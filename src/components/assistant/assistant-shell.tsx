"use client";

import { useState } from "react";
import { MessageSquare, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssistantChat } from "./assistant-chat";
import { AssistantVoice } from "./assistant-voice";
import { WorkflowActions } from "./workflow-actions";

type Tab = "chat" | "voice";

export function AssistantShell() {
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
            tab === "chat"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface-card text-ink-muted ring-1 ring-border hover:text-ink"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </button>
        <button
          type="button"
          onClick={() => setTab("voice")}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
            tab === "voice"
              ? "bg-brand text-white shadow-sm"
              : "bg-surface-card text-ink-muted ring-1 ring-border hover:text-ink"
          )}
        >
          <Mic className="h-4 w-4" />
          Voice
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {tab === "chat" ? <AssistantChat /> : <AssistantVoice />}
        </div>
        <WorkflowActions />
      </div>
    </div>
  );
}
