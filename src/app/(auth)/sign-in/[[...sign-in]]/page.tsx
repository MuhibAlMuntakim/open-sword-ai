import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse-glow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -z-10" />

            <SignIn path="/sign-in" appearance={{
                elements: {
                    card: "glass border-white/5",
                    headerTitle: "text-white font-light",
                    headerSubtitle: "text-zinc-400 font-light",
                    socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
                    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
                    footerActionLink: "text-primary hover:text-primary/80",
                    formFieldLabel: "text-zinc-400",
                    formFieldInput: "bg-white/5 border-white/10 text-white focus:border-primary/50",
                    dividerText: "text-zinc-500",
                    dividerLine: "bg-white/10"
                }
            }} />
        </div>
    );
}
