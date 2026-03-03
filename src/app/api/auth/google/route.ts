import { getGoogleOAuthClient, GOOGLE_OAUTH_SCOPES } from "@/lib/google-oauth";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    const { userId } = await auth();

    if (!userId) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const oauth2Client = getGoogleOAuthClient();

    // Generate a secure url
    const authorizeUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: GOOGLE_OAUTH_SCOPES,
        prompt: "consent", // Force consent to ensure we get a refresh token
        // state: userId, // Optional: Pass state if CSRF protection/redirects are needed
    });

    return NextResponse.redirect(authorizeUrl);
}
