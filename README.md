# OpenSword AI

OpenSword AI is an autonomous, background-running executive assistant SaaS. It connects to your Gmail and Google Calendar to automatically read unread threads, ghostwrite drafts, extract action items, and schedule meetings.

Built on Next.js 14 App Router, Supabase, Google Gemini, and Clerk.

## Setup

1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in the values
4. Run `npx prisma db push` (or migrate)
5. Run `npm run dev`

## Architecture
See `docs/DEPENDENCY_MANIFEST.md` and `docs/TECH_BRIEF.md` for more details.
