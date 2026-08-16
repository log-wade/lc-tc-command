# LC/TC Command × DGX Spark — Implementation Plan

The Spark is an async accelerator behind dokind.ai, never a request-path dependency. Production enqueues work into Supabase; the Spark polls outbound over Tailscale, processes locally, writes results back. If the Spark is offline, the fallback cron routes jobs to the Anthropic API and users never notice.

## Phase 0 — Plumbing (one evening)

1. Apply `015_ai_job_queue.sql` in the Supabase SQL editor (numbered after your existing `014_problem_reports.sql`).
2. On the Spark: `mkdir /opt/lctc`, drop in `worker.py`, `pip install httpx --break-system-packages`, create `/etc/lctc-worker.env` with the four env vars, install the systemd unit.
3. Create a **dedicated** Supabase service key for the worker rather than reusing the platform's service role key — you want to be able to revoke the Spark's access independently.
4. Add `/api/cron/ai-fallback` to `vercel.json` on a 5-minute schedule, wiring `sweepFallbacks()` to your existing Claude triage function.
5. Smoke test: insert a row into `ai_jobs` by hand, watch `journalctl -fu lctc-worker` pick it up.

Definition of done: a triage job round-trips production → Spark → production, and the same job with the worker stopped lands in `fallback` status via the cron.

## Phase 1 — Shadow-mode triage (week 1)

Point the inbound-email webhook at `enqueueAiJob("inbox_triage", ...)` while keeping the existing Claude API triage as the system of record. Both results land in the database; nothing user-facing changes. You're collecting a free comparison corpus: every email now has an API verdict and a local-model verdict side by side. Disagreements are your first eval set, and agreement rate tells you when the local model is ready to take primary on easy categories.

Model to start: Qwen3.5-35B-A3B on vLLM. It's fast (3B active), comfortably shares the box, and triage doesn't need more. Don't fine-tune yet — prompt-only until shadow mode shows you where it fails.

## Phase 2 — Synthetic transaction factory (weeks 1–2, parallel)

Batch-generate fictional Texas transactions overnight via `synthetic_gen` jobs. Recipe lives in the payload so you version it in the repo, not in the worker.

Corpus design:
- **Contract skeletons**: effective date, option period days/fee, closing date, financing type, party names — deliberately spanning edge cases: weekend/holiday effective dates, option periods ending on federal holidays, leap-day math, same-day amendments.
- **Email streams per transaction**: 15–40 messages each across title, lender, co-op agent, client — including the boring ones. Realism of the mundane matters more than clever fraud examples.
- **Fraud injections**: for the wire-fraud set, generate matched pairs — a legitimate wire-instruction email from the title company, and 5–10 fraudulent variants of the *same* transaction (spoofed domain, urgency, changed account, reply-to mismatch, bypass-the-phone-call language). Matched pairs are what teach a classifier the difference rather than surface features.
- Target: ~200 transactions, ~5k emails, ~1.5k fraud pairs. A 35B model generates this in a couple of overnight runs.
- Have a bigger model (or the Claude API, one-time cost) spot-grade a 5% sample for realism before you train on any of it.

This corpus is simultaneously: deadline-engine regression fixtures, triage eval set, wire-fraud training data, and demo data that isn't real clients.

## Phase 3 — Wire-fraud classifier (weeks 3–4)

**Base model**: Qwen3.5-9B (Apache 2.0). Small enough to eval exhaustively and cheap to retrain; the task is narrow classification, not reasoning. Your existing LoRA pipeline targets Qwen3-32B, so the tooling transfers almost unchanged — just a smaller target.

**Training data**: the Phase 2 fraud pairs + any real historical examples Carly's team can contribute (processed only on the Spark — this is exactly the PII-heavy archive work that never touches an API). Label schema matches the worker: `clear | suspicious | fraud_p0` with signal annotations.

**Eval design — this is the part that matters**:
- Held-out fraud pairs the model never saw, including fraud *techniques* held out entirely (train without reply-to-mismatch examples, test on them) to measure generalization vs. memorization.
- **The metric is recall on fraud_p0 at a fixed false-positive budget.** A missed fraud is catastrophic; a false escalation costs a phone call. Tune the threshold so `suspicious` catches everything ambiguous. Aim for zero missed fraud_p0 on held-out data before it influences anything.
- Run the full eval on every retrain; keep a scorecard per model version in the repo.

**Rollout**: shadow first (Spark verdict recorded alongside the API verdict in `wire_fraud_scans`, API drives escalation). Flip primacy only when the fine-tune beats the API path on your eval set — and even then, keep both engines on P0. Two independent detectors on a wire-fraud path is a feature you can put in front of a broker.

## Phase 4 — Doc extraction (later)

TREC 20-18 PDF → structured fields via a local vision model (Qwen3.5-VL class). Develop against real executed contracts on the Spark only. Ship as a `doc_extract` job type when accuracy beats the intake form's error rate. Don't start this until Phases 1–3 are stable — it's the biggest lift.

## Operating notes

- The worker's `MemoryMax=8G` and `Nice=10` keep it polite if it shares a node with the voice stack; drop those if it gets a dedicated box.
- Watch for the fallback rate in the `ai_jobs` table — it's your uptime metric for the Spark. If `fallback` status climbs, the box is down or the model is too slow for the deadline.
- Wire-fraud jobs enqueue at `priority 0` with a short `fallbackMinutes` (2–3). P0 must never wait on a polling interval.
- When DKG grows past one team, per-org queues and rate limits slot into the existing `org_id` column.
