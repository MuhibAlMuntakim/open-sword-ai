import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/encryption";
import { google } from "googleapis";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// The maximum number of users to process in one cron run (to prevent Vercel timeouts)
const BATCH_SIZE = 50;

export async function GET(req: NextRequest) {
    try {
        // 1. Verify CRON_SECRET for security
        const authHeader = req.headers.get("authorization");
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 2. Fetch users who have connected Google accounts
        const tokens = await prisma.googleOAuthToken.findMany({
            take: BATCH_SIZE,
            include: {
                user: true,
            },
        });

        const results = [];

        // 3. Loop through and run agent per user
        for (const token of tokens) {
            try {
                const result = await processUserAgent(token);
                results.push({ userId: token.userId, status: "success", result });
            } catch (err: any) {
                console.error(`Agent failed for user ${token.userId}:`, err);

                await prisma.agentLog.create({
                    data: {
                        userId: token.userId,
                        status: "FAILED",
                        errorMessage: err.message || "Unknown error occurred",
                    }
                });

                results.push({ userId: token.userId, status: "error", error: err.message });
            }
        }

        return NextResponse.json({ processed: results.length, results });
    } catch (error: any) {
        console.error("Cron Agent Master Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

async function processUserAgent(tokenData: any) {
    // A. Decrypt Tokens and Init Google Client
    const accessToken = decrypt(tokenData.accessToken);
    const refreshToken = decrypt(tokenData.refreshToken);

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    // Handle automatic refreshing if expired
    oauth2Client.on('tokens', async (newTokens) => {
        if (newTokens.refresh_token) {
            await prisma.googleOAuthToken.update({
                where: { id: tokenData.id },
                data: {
                    accessToken: encrypt(newTokens.access_token!),
                    refreshToken: encrypt(newTokens.refresh_token),
                    expiresAt: new Date(newTokens.expiry_date!),
                }
            });
        } else {
            await prisma.googleOAuthToken.update({
                where: { id: tokenData.id },
                data: {
                    accessToken: encrypt(newTokens.access_token!),
                    expiresAt: new Date(newTokens.expiry_date!),
                }
            });
        }
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // B. Fetch Unread Emails
    const gmailRes = await gmail.users.messages.list({
        userId: "me",
        q: "is:unread -category:promotions -category:social", // Skip junk
        maxResults: 5,
    });

    const messages = gmailRes.data.messages || [];
    const emailContexts = [];

    for (const m of messages) {
        if (!m.id) continue;
        const msgData = await gmail.users.messages.get({
            userId: "me",
            id: m.id,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date"],
        });

        // Quick parse Headers
        const headers = msgData.data.payload?.headers || [];
        const subject = headers.find(h => h.name === 'Subject')?.value || "No Subject";
        const from = headers.find(h => h.name === 'From')?.value || "Unknown Sender";
        const snippet = msgData.data.snippet || "";

        emailContexts.push({
            id: m.id,
            threadId: msgData.data.threadId,
            subject,
            from,
            snippet
        });
    }

    // C. Fetch Upcoming Calendar Events (next 7 days)
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const calRes = await calendar.events.list({
        calendarId: "primary",
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 10,
    });

    const upcomingEvents = (calRes.data.items || []).map(e => ({
        summary: e.summary,
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
    }));

    if (emailContexts.length === 0) {
        // Nothing to do
        return "No unread actionable emails.";
    }

    // D. Call AI (Gemini) to Analyze and Propose Actions
    const prompt = `
    You are an elite, autonomous executive assistant. 
    Review the following unread emails and the user's upcoming calendar schedule.
    
    Decide what actions to take:
    1. Should you draft a reply to an email? (e.g. they asked a question, requested a meeting, or need follow up).
    2. Should you schedule a new calendar event? (e.g. they proposed a specific time that is free on the calendar).

    Here is the data:
    ---
    Unread Emails:
    ${JSON.stringify(emailContexts, null, 2)}
    ---
    Upcoming Calendar Events (Next 7 Days):
    ${JSON.stringify(upcomingEvents, null, 2)}
    ---
    Current Date/Time: ${new Date().toISOString()}

    Return a strictly valid JSON response (NO markdown formatting, just raw JSON text).
    Format exactly like this matching TypeScript Interface:
    {
      "actions": {
        "draftEmails": [
           { "emailId": "id-from-context", "threadId": "thread-id", "subject": "Re: original subject", "body": "Draft text here..." }
        ],
        "scheduleEvents": [
           { "title": "Meeting with X", "description": "Discussing Y", "startTime": "ISO-DATE", "endTime": "ISO-DATE", "attendees": ["email@test.com"] }
        ]
      }
    }
  `;

    const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        }
    });

    const responseText = result.text;
    let parsedActions: { draftEmails: any[], scheduleEvents: any[] } = { draftEmails: [], scheduleEvents: [] };

    try {
        const rawData = JSON.parse(responseText || "{}");
        parsedActions = rawData.actions || parsedActions;
    } catch (e) {
        throw new Error("AI failed to return valid JSON format: " + responseText);
    }

    const actionsTaken = [];

    // E. Execute Actions & Log to Database

    // 1. Save Email Drafts
    for (const draft of parsedActions.draftEmails || []) {
        await prisma.emailDraft.create({
            data: {
                userId: tokenData.userId,
                messageId: draft.emailId,
                threadId: draft.threadId,
                subject: draft.subject,
                body: draft.body,
                status: "PENDING"
            }
        });
        // Mark as read in Gmail so we dont process again next tick
        await gmail.users.messages.modify({
            userId: "me",
            id: draft.emailId,
            requestBody: { removeLabelIds: ["UNREAD"] }
        });

        actionsTaken.push(`Drafted reply for email: ${draft.subject}`);
    }

    // 2. Schedule Calendar Events
    for (const ev of parsedActions.scheduleEvents || []) {
        await prisma.calendarEventDraft.create({
            data: {
                userId: tokenData.userId,
                title: ev.title,
                description: ev.description,
                startTime: new Date(ev.startTime),
                endTime: new Date(ev.endTime),
                attendees: ev.attendees || [],
                status: "PENDING"
            }
        });
        actionsTaken.push(`Proposed Calendar Event: ${ev.title} at ${ev.startTime}`);
    }

    // Final Log
    await prisma.agentLog.create({
        data: {
            userId: tokenData.userId,
            status: actionsTaken.length > 0 ? "SUCCESS" : "PARTIAL",
            actionsTaken: actionsTaken,
        }
    });

    return `Processed ${actionsTaken.length} actions.`;
}
