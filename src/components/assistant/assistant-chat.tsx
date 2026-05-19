"use client";

import { useCallback, useRef, useState } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

export function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi Carly — I'm your LC/TC assistant. Ask about deadlines, review queue, templates, or run a morning briefing workflow.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat failed");
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Something went wrong. Try again.",
        },
      ]);
    } finally {
      setLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [input, loading, messages]);

  return (
    <div className="flex h-[min(560px,70vh)] flex-col rounded-2xl border border-border bg-surface-card shadow-sm">
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                m.role === "user" ? "bg-brand text-white" : "bg-accent-soft text-accent"
              )}
            >
              {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </span>
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-brand text-white"
                  : "bg-stone-50 text-ink ring-1 ring-border"
              )}
            >
              {m.content}
            </p>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3 sm:p-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about deadlines, reviews, templates…"
            className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} size="sm">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}