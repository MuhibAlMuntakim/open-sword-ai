"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveEmailDraft(draftId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // In a real app, this would trigger the actual Gmail send API
    // For this MVP, we just mark it as SENT
    await prisma.emailDraft.update({
        where: { id: draftId, userId },
        data: { status: "APPROVED" },
    });

    revalidatePath("/dashboard/emails");
}

export async function rejectEmailDraft(draftId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await prisma.emailDraft.delete({
        where: { id: draftId, userId },
    });

    revalidatePath("/dashboard/emails");
}

export async function approveCalendarEvent(eventId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // In a real app, this would trigger the actual Google Calendar API
    await prisma.calendarEventDraft.update({
        where: { id: eventId, userId },
        data: { status: "APPROVED" },
    });

    revalidatePath("/dashboard/calendar");
}

export async function rejectCalendarEvent(eventId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await prisma.calendarEventDraft.delete({
        where: { id: eventId, userId },
    });

    revalidatePath("/dashboard/calendar");
}
