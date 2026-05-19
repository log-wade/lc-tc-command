import { NextResponse } from "next/server";
import { classifyInboundEmail } from "@/lib/ai/agent";
import { logAudit } from "@/lib/audit";
import { memoryStore } from "@/lib/store/memory-store";

export async function POST(request: Request) {
  const body = await request.json();
  const classification = await classifyInboundEmail({
    from: body.from ?? "",
    subject: body.subject ?? "",
    body: body.body ?? "",
  });

  await logAudit({
    actor_type: "ai_agent",
    action_type: "email_classified",
    inputs: { from: body.from, subject: body.subject },
    outputs: classification as unknown as Record<string, unknown>,
    outcome: classification.wire_fraud_signal ? "escalated" : "success",
  });

  if (classification.wire_fraud_signal) {
    memoryStore.addReview({
      item_type: "wire_change",
      priority: "P0",
      title: "WIRE FRAUD SIGNAL — Immediate human verification required",
      payload: { classification, email: body },
    });
  }

  return NextResponse.json(classification);
}
