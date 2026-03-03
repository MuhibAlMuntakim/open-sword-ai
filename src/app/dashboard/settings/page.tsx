import { auth } from "@clerk/nextjs/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import prisma from "@/lib/prisma";
import { Shield, Database, Key } from "lucide-react";

export default async function SettingsPage() {
    const { userId } = await auth();

    if (!userId) return null;

    const connection = await prisma.googleOAuthToken.findUnique({
        where: { userId },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl tracking-tight font-light gradient-text">Settings</h1>
                <p className="text-zinc-400 font-light mt-1 text-sm">Manage your account and AI agent configurations.</p>
            </div>

            <div className="grid gap-6">
                <Card className="glass shadow-none border-white/5">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Integrations
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Connect your external services to empower the AI agent.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                                    <Database className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Google Workspace</p>
                                    <p className="text-xs text-zinc-500">Gmail and Calendar access</p>
                                </div>
                            </div>
                            {connection ? (
                                <Badge variant="default" className="bg-green-500/10 text-green-400 border-green-500/20">
                                    Connected
                                </Badge>
                            ) : (
                                <a href="/api/auth/google" className="text-xs font-medium text-primary hover:underline">
                                    Connect
                                </a>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass shadow-none border-white/5">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                            <Key className="h-5 w-5 text-primary" />
                            Security
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Encryption and data protection settings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-zinc-400">
                            Your OAuth tokens are encrypted using AES-256-CBC and stored securely.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
