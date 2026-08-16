// src/lib/aiQueue.ts
// Production-side bridge to the Spark job queue.
//
// Rule: the Spark is an ASYNC accelerator, never a request-path dependency.
// - Wire-fraud scans: enqueue for the Spark AND run the Claude API path
//   immediately (belt and suspenders on the P0). Spark result is recorded
//   for comparison/audit; API result drives the escalation today. Flip
//   primacy only after the classifier beats the API on your eval set.
// - Inbox triage: enqueue with a fallback deadline. A cron sweeps jobs the
//   Spark didn't pick up in time and routes them to the API.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type AiJobType =
  | "inbox_triage"
  | "wire_fraud_scan"
  | "doc_extract"
  | "synthetic_gen"
  | "eval_run";

export async function enqueueAiJob(opts: {
  jobType: AiJobType;
  payload: Record<string, unknown>;
  orgId?: string;
  priority?: number;          // 0 = P0
  fallbackMinutes?: number;   // API takeover deadline; default 10
}) {
  const { data, error } = await supabase
    .from("ai_jobs")
    .insert({
      job_type: opts.jobType,
      payload: opts.payload,
      org_id: opts.orgId ?? null,
      priority: opts.priority ?? 5,
      fallback_after: new Date(
        Date.now() + (opts.fallbackMinutes ?? 10) * 60_000
      ).toISOString(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

// -----------------------------------------------------------------
// Cron: /api/cron/ai-fallback  (add to vercel.json, every 5 min)
// Sweeps queued jobs past their fallback deadline into the existing
// Claude API triage path, and reclaims stale claimed jobs.
// -----------------------------------------------------------------
export async function sweepFallbacks(
  runViaApi: (jobType: AiJobType, payload: any) => Promise<any>
) {
  await supabase.rpc("reclaim_stale_ai_jobs", { stale_minutes: 15 });

  const { data: expired } = await supabase
    .from("ai_jobs")
    .select("*")
    .eq("status", "queued")
    .lt("fallback_after", new Date().toISOString())
    .limit(25);

  for (const job of expired ?? []) {
    try {
      const result = await runViaApi(job.job_type, job.payload);
      await supabase
        .from("ai_jobs")
        .update({
          status: "fallback",
          result,
          finished_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    } catch (e: any) {
      await supabase
        .from("ai_jobs")
        .update({ status: "failed", error: String(e).slice(0, 2000) })
        .eq("id", job.id);
    }
  }
  return expired?.length ?? 0;
}
