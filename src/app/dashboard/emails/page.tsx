import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import { Shield, Database, Key } from "lucide-react";
import { DraftActions } from "@/components/draft-actions";

export default async function EmailsPage() {
    const { userId } = await auth();

    if (!userId) return null;

    const drafts = await prisma.emailDraft.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl tracking-tight font-light gradient-text">Email Drafts</h1>
                <p className="text-zinc-400 font-light mt-1 text-sm">Review emails drafted by your autonomous agent.</p>
            </div>

            <div className="grid gap-4">
                {drafts.length === 0 ? (
                    <Card className="glass shadow-none border-white/5 bg-secondary/10">
                        <CardContent className="flex flex-col items-center justify-center h-48">
                            <p className="text-zinc-400 font-light">No drafts generated yet.</p>
                        </CardContent>
                    </Card>
                ) : (
                    drafts.map((draft: any) => (
                        <Card key={draft.id} className="glass shadow-none border-white/5 hover:bg-white/[0.02] transition">
                            <CardHeader className="py-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-md font-medium text-white flex gap-3 items-center">
                                            {draft.subject || "No Subject"}
                                            <Badge variant={draft.status === "PENDING" ? "secondary" : "default"} className="ml-2 h-5 text-[10px] uppercase font-semibold">
                                                {draft.status}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="mt-1 text-xs text-zinc-500">
                                            Drafted on {new Date(draft.createdAt).toLocaleString()}
                                        </CardDescription>
                                    </div>
                                    <DraftActions id={draft.id} type="email" />
                                </div>
                            </CardHeader>
                            <CardContent className="py-0 pb-4">
                                <p className="text-sm text-zinc-400">Scan your inbox and schedule your week with AI. It's time to be productive.</p>
                                <div className="text-sm text-zinc-300 whitespace-pre-wrap bg-background/50 p-4 rounded-xl border border-white/5 font-mono">
                                    {draft.body}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
