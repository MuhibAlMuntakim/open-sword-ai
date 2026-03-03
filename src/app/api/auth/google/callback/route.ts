import { NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/google-oauth";
import { encrypt } from "@/lib/encryption";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
            console.error("Google OAuth Error:", error);
            return NextResponse.redirect(new URL("/dashboard?error=google_auth_failed", process.env.NEXT_PUBLIC_APP_URL!));
        }

        if (!code) {
            return new NextResponse("No code provided", { status: 400 });
        }

        const oauth2Client = getGoogleOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token || !tokens.refresh_token) {
            console.error("Missing tokens entirely. Make sure prompt: 'consent' was passed.");
            return NextResponse.redirect(new URL("/dashboard?error=missing_refresh_token", process.env.NEXT_PUBLIC_APP_URL!));
        }

        // Encrypt the tokens before storing
        const encryptedAccessToken = encrypt(tokens.access_token);
        const encryptedRefreshToken = encrypt(tokens.refresh_token);

        // Get true expiry date, or set an arbitrary default (e.g. 1 hour)
        const expiresAt = tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : new Date(Date.now() + 3600 * 1000);

        // Upsert the tokens in Prisma
        await prisma.googleOAuthToken.upsert({
            where: { userId },
            update: {
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                expiresAt,
            },
            create: {
                userId,
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                expiresAt,
            },
        });

        return NextResponse.redirect(new URL("/dashboard?success=google_connected", process.env.NEXT_PUBLIC_APP_URL!));

    } catch (error) {
        console.error("OAuth Callback Error:", error);
        return NextResponse.redirect(new URL("/dashboard?error=internal_server_error", process.env.NEXT_PUBLIC_APP_URL!));
    }
}
