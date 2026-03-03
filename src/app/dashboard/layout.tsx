import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Calendar, Mail, Settings, Sword } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-secondary/20 backdrop-blur-3xl hidden md:flex flex-col">
                <div className="p-6 flex items-center space-x-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 hover-float">
                        <Sword className="text-primary h-6 w-6" />
                    </div>
                    <span className="text-xl font-bold tracking-wider text-white">OpenSword</span>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <Link href="/dashboard" className="flex items-center space-x-3 px-4 py-3 bg-white/5 text-white rounded-lg border border-white/10 transition hover:bg-white/10">
                        <LayoutDashboard className="h-5 w-5 text-zinc-400" />
                        <span className="font-medium">Overview</span>
                    </Link>
                    <Link href="/dashboard/emails" className="flex items-center space-x-3 px-4 py-3 text-zinc-400 rounded-lg transition hover:bg-white/5 hover:text-white">
                        <Mail className="h-5 w-5" />
                        <span className="font-medium">Drafts</span>
                    </Link>
                    <Link href="/dashboard/calendar" className="flex items-center space-x-3 px-4 py-3 text-zinc-400 rounded-lg transition hover:bg-white/5 hover:text-white">
                        <Calendar className="h-5 w-5" />
                        <span className="font-medium">Schedule</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <Link href="/dashboard/settings" className="flex items-center space-x-3 px-4 py-3 text-zinc-400 rounded-lg transition hover:bg-white/5 hover:text-white mb-2">
                        <Settings className="h-5 w-5" />
                        <span className="font-medium">Settings</span>
                    </Link>
                    <div className="flex items-center gap-3 px-4 py-2 glass-panel rounded-xl">
                        <UserButton afterSignOutUrl="/" />
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">My Account</span>
                            <span className="text-xs text-green-400">Pro Active</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <header className="h-20 border-b border-white/5 flex items-center px-8 justify-between sticky top-0 bg-background/50 backdrop-blur-md z-10">
                    <h2 className="text-lg font-medium text-zinc-200">Executive Dashboard</h2>
                    <div className="md:hidden">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </header>
                <div className="p-8 max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
