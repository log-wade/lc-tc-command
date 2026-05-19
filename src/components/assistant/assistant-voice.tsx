"use client";

import { useCallback, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function AssistantVoiceInner() {
  const [error, setError] = useState<string | null>(null);
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

  const conversation = useConversation({
    onConnect: () => setError(null),
    onDisconnect: () => {},
    onError: (err) => setError(typeof err === "string" ? err : "Voice connection error"),
  });

  const start = useCallback(() => {
    setError(null);
    void (async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const signedRes = await fetch("/api/elevenlabs/signed-url");
        if (signedRes.ok) {
          const { signedUrl } = await signedRes.json();
          conversation.startSession({ signedUrl });
          return;
        }

        if (!agentId) {
          throw new Error("ElevenLabs agent not configured.");
        }

        conversation.startSession({ agentId });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start voice session");
      }
    })();
  }, [agentId, conversation]);

  const stop = useCallback(() => {
    conversation.endSession();
  }, [conversation]);

  const connected = conversation.status === "connected";
  const connecting = conversation.status === "connecting";

  return (
    <div className="flex h-[min(560px,70vh)] flex-col items-center justify-center rounded-2xl border border-border bg-surface-card p-8 shadow-sm">
      <div
        className={cn(
          "mb-6 flex h-28 w-28 items-center justify-center rounded-full transition-all duration-500",
          connected
            ? "bg-accent/20 ring-4 ring-accent/40 animate-pulse"
            : "bg-stone-100 ring-2 ring-border"
        )}
      >
        {connecting ? (
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
        ) : connected ? (
          <Mic className="h-10 w-10 text-accent" />
        ) : (
          <MicOff className="h-10 w-10 text-ink-muted" />
        )}
      </div>

      <p className="font-display text-xl font-semibold text-ink">Voice assistant</p>
      <p className="mt-2 max-w-sm text-center text-sm text-ink-muted">
        {connected
          ? conversation.isSpeaking
            ? "Speaking…"
            : "Listening — ask about deadlines, reviews, or run a workflow."
          : "Start a hands-free session with your LC/TC coordination agent."}
      </p>

      <p className="mt-1 text-xs text-ink-muted capitalize">Status: {conversation.status}</p>

      {error && (
        <p className="mt-4 max-w-md rounded-lg bg-urgent-soft px-3 py-2 text-center text-xs text-urgent">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-3">
        {!connected ? (
          <Button onClick={start} disabled={connecting} size="lg">
            <Phone className="h-4 w-4" />
            {connecting ? "Connecting…" : "Start voice"}
          </Button>
        ) : (
          <Button variant="secondary" onClick={stop} size="lg">
            <PhoneOff className="h-4 w-4" />
            End call
          </Button>
        )}
      </div>
    </div>
  );
}

export function AssistantVoice() {
  return (
    <ConversationProvider>
      <AssistantVoiceInner />
    </ConversationProvider>
  );
}
