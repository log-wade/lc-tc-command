import { memoryStore } from "@/lib/store/memory-store";
import { createServiceClient } from "@/lib/supabase/server";
import {
  classifyInboundEmail,
  type EmailClassification,
} from "@/lib/ai/agent";

export type WireFraudVerdict = "clear" | "suspicious" | "fraud_p0";

export interface WireFraudScanResult {
  classification: EmailClassification;
  verdict: WireFraudVerdict;
  escalated: boolean;
  confidence: number | null;
  signals: Record<string, unknown>;
}

/**
 * Existing wire-fraud / P0 path: classify via Claude (with keyword short-circuit),
 * escalate to the review queue when a wire signal fires.
 */
export async function runWireFraudScan(
  payload: {
    from: string;
    subject: string;
    body: string;
  },
  reviewEmail: Record<string, unknown> = payload
): Promise<WireFraudScanResult> {
  const classification = await classifyInboundEmail({
    from: payload.from,
    subject: payload.subject,
    body: payload.body,
  });

  const escalated = Boolean(classification.wire_fraud_signal);
  if (escalated) {
    memoryStore.addReview({
      item_type: "wire_change",
      priority: "P0",
      title: "WIRE FRAUD SIGNAL — Immediate human verification required",
      payload: { classification, email: reviewEmail },
    });
  }

  const verdict: WireFraudVerdict = escalated
    ? "fraud_p0"
    : classification.priority === "P0"
      ? "suspicious"
      : "clear";

  return {
    classification,
    verdict,
    escalated,
    confidence: escalated ? 1 : null,
    signals: {
      wire_fraud_signal: classification.wire_fraud_signal,
      priority: classification.priority,
      suggested_action: classification.suggested_action,
    },
  };
}

/** Persist an audit row for whichever engine produced the verdict. */
export async function recordWireFraudScan(opts: {
  emailRef: string;
  verdict: WireFraudVerdict;
  confidence: number | null;
  signals: Record<string, unknown>;
  engine: string;
  escalated: boolean;
  jobId?: string | null;
  orgId?: string | null;
}): Promise<void> {
  const supabase = createServiceClient();
  if (!supabase) return;

  const { error } = await supabase.from("wire_fraud_scans").insert({
    job_id: opts.jobId ?? null,
    org_id: opts.orgId ?? null,
    email_ref: opts.emailRef,
    verdict: opts.verdict,
    confidence: opts.confidence,
    signals: opts.signals,
    engine: opts.engine,
    escalated: opts.escalated,
  });

  if (error) throw error;
}
