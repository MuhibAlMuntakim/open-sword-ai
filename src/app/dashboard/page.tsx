import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        return null;
    }

    // Fetch recent AI logs
    const logs = await prisma.agentLog.findMany({
        where: { userId },
        orderBy: { executedAt: "desc" },
        take: 10,
    });

    // Fetch connection status
    const connection = await prisma.googleOAuthToken.findUnique({
        where: { userId },
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl tracking-tight font-light gradient-text">Overview</h1>
                <p className="text-zinc-400 font-light mt-1 text-sm">Monitor your autonomous agent's activities.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Status Card */}
                <Card className="glass shadow-none border-white/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-medium text-white flex justify-between items-center">
                            Agent Status
                            {connection ? (
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            ) : (
                                <Badge variant="destructive">Disconnected</Badge>
                            )}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            {connection ? "Connected to Google Workspace and actively monitoring." : "Your Google account is disconnected. Agent is idling."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!connection && (
                            <a href="/api/auth/google" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 hover-float w-full">
                                Connect Google Account
                            </a>
                        )}
                    </CardContent>
                </Card>

                <Card className="glass shadow-none border-white/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-medium text-white">Execution Metrics</CardTitle>
                        <CardDescription className="text-zinc-400">Agent efficiency over the last 30 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 items-center">
                            <div className="flex flex-col">
                                <span className="text-4xl font-light text-white">{logs.length}</span>
                                <span className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Total Runs</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                <Card className="glass shadow-none border-white/5 pt-0">
                    <ScrollArea className="h-[400px]">
                        {logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
                                <p>No activity recorded yet.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {logs.map((log: any) => (
                                    <div key={log.id} className="p-4 hover:bg-white/[0.02] flex items-center justify-between transition-colors">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant={log.status === 'SUCCESS' ? 'default' : log.status === 'FAILED' ? 'destructive' : 'secondary'} className="text-[10px] h-5 glass border-white/10">
                                                    {log.status}
                                                </Badge>
                                                <p className="text-sm text-zinc-400">Scan your inbox and schedule your week with AI. It&apos;s time to be productive.</p></div>
                                            <span className="text-xs text-zinc-500 mt-1">
                                                {(log.actionsTaken as string[]).join(", ") || "No actionable context found."}
                                            </span>
                                        </div>
                                        <div className="text-xs text-zinc-500 whitespace-nowrap ml-4 border border-white/10 px-2 py-1 rounded-md glass-panel">
                                            {new Date(log.executedAt).toLocaleDateString()} {new Date(log.executedAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}
