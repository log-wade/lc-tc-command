import { NextResponse } from "next/server";
import { classifyInboundEmail } from "@/lib/ai/agent";
import { recordWireFraudScan, runWireFraudScan } from "@/lib/ai/wire-fraud";
import {
  sweepFallbacks,
  type AiJobType,
} from "@/lib/aiQueue";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function emailFields(payload: Record<string, unknown>) {
  return {
    from: String(payload.from ?? ""),
    subject: String(payload.subject ?? ""),
    body: String(payload.body ?? ""),
    email_ref: String(
      payload.email_ref ?? payload.message_id ?? payload.id ?? "unknown"
    ),
  };
}

async function runViaApi(
  jobType: AiJobType,
  payload: Record<string, unknown>
): Promise<unknown> {
  switch (jobType) {
    case "inbox_triage": {
      const { from, subject, body } = emailFields(payload);
      return classifyInboundEmail({ from, subject, body });
    }
    case "wire_fraud_scan": {
      const { from, subject, body, email_ref } = emailFields(payload);
      const scan = await runWireFraudScan({ from, subject, body });
      await recordWireFraudScan({
        emailRef: email_ref,
        verdict: scan.verdict,
        confidence: scan.confidence,
        signals: scan.signals,
        engine: "anthropic:fallback",
        escalated: scan.escalated,
      });
      return {
        ...scan.classification,
        verdict: scan.verdict,
        escalated: scan.escalated,
        engine: "anthropic:fallback",
      };
    }
    case "doc_extract":
    case "synthetic_gen":
    case "eval_run":
      throw new Error(`no API fallback for ${jobType}`);
    default: {
      const _exhaustive: never = jobType;
      throw new Error(`no API fallback for ${_exhaustive}`);
    }
  }
}

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const swept = await sweepFallbacks(runViaApi);
    console.info("ai-fallback cron", { swept });
    return NextResponse.json({ swept });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ai-fallback sweep failed";
    console.error("ai-fallback cron failed", { message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
