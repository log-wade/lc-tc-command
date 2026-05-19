import { NextResponse } from "next/server";
import { runAgentChat, type ChatMessage } from "@/lib/ai/orchestrator";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = (body.messages ?? []) as ChatMessage[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const { reply, toolCalls } = await runAgentChat(messages);

    try {
      await logAudit({
        actor_type: "ai_agent",
        action_type: "assistant_chat",
        inputs: { message_count: messages.length },
        outputs: { tool_calls: toolCalls.length },
        outcome: "success",
      });
    } catch {
      // Audit failure should not block the assistant reply
    }

    return NextResponse.json({ reply, toolCalls });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
