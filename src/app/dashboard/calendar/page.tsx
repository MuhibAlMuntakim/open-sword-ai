import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { DraftActions } from "@/components/draft-actions";

export default async function CalendarPage() {
    const { userId } = await auth();

    if (!userId) return null;

    const events = await prisma.calendarEventDraft.findMany({
        where: { userId },
        orderBy: { startTime: "asc" },
        take: 20,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl tracking-tight font-light gradient-text">Schedule</h1>
                <p className="text-zinc-400 font-light mt-1 text-sm">Proposed calendar events crafted by your AI.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {events.length === 0 ? (
                    <Card className="glass shadow-none border-white/5 bg-secondary/10 md:col-span-2">
                        <CardContent className="flex flex-col items-center justify-center h-48">
                            <CalendarIcon className="h-8 w-8 text-zinc-500 mb-4 opacity-50" />
                            <p className="text-zinc-400 font-light">No events scheduled recently.</p>
                        </CardContent>
                    </Card>
                ) : (
                    events.map((ev: any) => (
                        <Card key={ev.id} className="glass shadow-none border border-white/5 hover:-translate-y-1 transition duration-300">
                            <CardHeader className="py-4 border-b border-white/5 bg-white/[0.01]">
                                <CardTitle className="text-md font-medium text-white flex justify-between items-center">
                                    <span className="truncate">{ev.title}</span>
                                    <div className="flex items-center gap-3">
                                        <Badge variant={ev.status === "PENDING" ? "secondary" : "default"} className="h-5 text-[10px] uppercase font-semibold">
                                            {ev.status}
                                        </Badge>
                                        <DraftActions id={ev.id} type="calendar" />
                                    </div>
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-2 text-xs text-zinc-400 font-mono">
                                    <Clock className="w-3 h-3" />
                                    {new Date(ev.startTime).toLocaleString()} - {new Date(ev.endTime).toLocaleTimeString()}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="py-4">
                                <p className="text-sm text-zinc-300 mb-4">{ev.description || "No description provided."}</p>

                                {ev.attendees && ev.attendees.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Attendees</span>
                                        <div className="flex flex-wrap gap-2">
                                            {(ev.attendees as string[]).map((email, idx) => (
                                                <Badge key={idx} variant="outline" className="border-white/10 text-white/70 font-light bg-background/50">
                                                    {email}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
