import { NextResponse } from "next/server";
import { runWireFraudScan } from "@/lib/ai/wire-fraud";
import { logAudit } from "@/lib/audit";

export async function POST(request: Request) {
  const body = await request.json();
  const { classification } = await runWireFraudScan(
    {
      from: body.from ?? "",
      subject: body.subject ?? "",
      body: body.body ?? "",
    },
    body
  );

  await logAudit({
    actor_type: "ai_agent",
    action_type: "email_classified",
    inputs: { from: body.from, subject: body.subject },
    outputs: classification as unknown as Record<string, unknown>,
    outcome: classification.wire_fraud_signal ? "escalated" : "success",
  });

  return NextResponse.json(classification);
}
