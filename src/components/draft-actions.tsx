"use client";

import { Button } from "@/components/ui/button";
import { Check, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { approveEmailDraft, rejectEmailDraft, approveCalendarEvent, rejectCalendarEvent } from "@/app/actions/drafts";
import { useToast } from "@/hooks/use-toast";

interface DraftActionsProps {
    id: string;
    type: "email" | "calendar";
}

export function DraftActions({ id, type }: DraftActionsProps) {
    const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
    const { toast } = useToast();

    const handleAction = async (action: "approve" | "reject") => {
        setLoading(action);
        try {
            if (type === "email") {
                if (action === "approve") await approveEmailDraft(id);
                else await rejectEmailDraft(id);
            } else {
                if (action === "approve") await approveCalendarEvent(id);
                else await rejectCalendarEvent(id);
            }
            toast({
                title: action === "approve" ? "Approved" : "Rejected",
                description: `Successfully ${action === "approve" ? "processed" : "removed"} the item.`,
            });
        } catch (_error) {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="flex gap-2">
            <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 rounded-full border-white/10 hover:bg-green-500/10 hover:text-green-400"
                onClick={() => handleAction("approve")}
                disabled={!!loading}
            >
                {loading === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </Button>
            <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 rounded-full border-white/10 hover:bg-red-500/10 hover:text-red-400"
                onClick={() => handleAction("reject")}
                disabled={!!loading}
            >
                {loading === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
            </Button>
        </div>
    );
}
