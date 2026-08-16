#!/usr/bin/env python3
"""
LC/TC Command — Spark worker.

Polls the Supabase ai_jobs queue over Tailscale, runs local inference
against the vLLM OpenAI-compatible endpoint on this box (or node A over
the DAC link), writes results back. Outbound-only: nothing connects
INTO the Spark.

Env (put in /etc/lctc-worker.env, referenced by the systemd unit):
  SUPABASE_URL=https://mueadgepbcguidxnuqxj.supabase.co
  SUPABASE_SERVICE_KEY=<service_role_or_sb_secret_from_dashboard>
  LLM_BASE_URL=http://127.0.0.1:8000/v1
  LLM_MODEL=qwen3.5-35b-a3b       # or your wire-fraud LoRA merge
  WORKER_ID=spark-node-b
"""

import os, time, json, logging, signal
import httpx

log = logging.getLogger("lctc-worker")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

SUPABASE_URL  = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY   = os.environ["SUPABASE_SERVICE_KEY"]
LLM_BASE_URL  = os.environ.get("LLM_BASE_URL", "http://127.0.0.1:8000/v1")
LLM_MODEL     = os.environ.get("LLM_MODEL", "qwen3.5-35b-a3b")
WORKER_ID     = os.environ.get("WORKER_ID", "spark-node-b")
POLL_SECONDS  = int(os.environ.get("POLL_SECONDS", "10"))
BATCH_SIZE    = int(os.environ.get("BATCH_SIZE", "5"))

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
}

_running = True
def _stop(*_):  # graceful shutdown so systemd restarts are clean
    global _running
    _running = False
signal.signal(signal.SIGTERM, _stop)
signal.signal(signal.SIGINT, _stop)

# ----------------------------------------------------------------------
# Supabase helpers
# ----------------------------------------------------------------------
def claim_jobs(client: httpx.Client) -> list[dict]:
    r = client.post(
        f"{SUPABASE_URL}/rest/v1/rpc/claim_ai_jobs",
        headers=HEADERS,
        json={"worker_id": WORKER_ID, "batch_size": BATCH_SIZE},
        timeout=30,
    )
    r.raise_for_status()
    return r.json() or []

def finish_job(client: httpx.Client, job_id: str, result: dict | None, error: str | None):
    patch = (
        {"status": "done", "result": result, "finished_at": "now()"}
        if error is None
        else {"status": "failed", "error": error[:2000], "finished_at": "now()"}
    )
    r = client.patch(
        f"{SUPABASE_URL}/rest/v1/ai_jobs?id=eq.{job_id}",
        headers=HEADERS, json=patch, timeout=30,
    )
    r.raise_for_status()

def record_wire_scan(client: httpx.Client, job: dict, result: dict):
    row = {
        "job_id": job["id"],
        "org_id": job.get("org_id"),
        "email_ref": job["payload"].get("email_ref", "unknown"),
        "verdict": result["verdict"],
        "confidence": result.get("confidence"),
        "signals": result.get("signals"),
        "engine": f"spark:{LLM_MODEL}",
        "escalated": result["verdict"] == "fraud_p0",
    }
    client.post(f"{SUPABASE_URL}/rest/v1/wire_fraud_scans",
                headers=HEADERS, json=row, timeout=30).raise_for_status()

# ----------------------------------------------------------------------
# Local inference
# ----------------------------------------------------------------------
def llm(client: httpx.Client, system: str, user: str, json_mode: bool = True) -> dict | str:
    body = {
        "model": LLM_MODEL,
        "messages": [{"role": "system", "content": system},
                     {"role": "user", "content": user}],
        "temperature": 0.1,
        "max_tokens": 1024,
        "chat_template_kwargs": {"enable_thinking": False},
    }
    r = client.post(f"{LLM_BASE_URL}/chat/completions", json=body, timeout=120)
    r.raise_for_status()
    text = r.json()["choices"][0]["message"]["content"]
    if not json_mode:
        return text
    # tolerate fenced output
    text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(text)

# ----------------------------------------------------------------------
# Handlers (one per job_type)
# ----------------------------------------------------------------------
TRIAGE_SYSTEM = """You are the inbox triage engine for a Texas residential real estate
transaction coordination platform. Classify the email and extract action items.
Respond ONLY with JSON:
{"category": "title|lender|coop_agent|client|showing|vendor|spam|other",
 "action_items": [{"item": str, "due_hint": str|null}],
 "transaction_ref_hint": str|null,
 "requires_human": bool,
 "summary": str}"""

WIREFRAUD_SYSTEM = """You are a wire-fraud detection engine for real estate transactions.
Analyze the email for payment-instruction fraud: changed wire instructions, spoofed or
look-alike sender domains, urgency pressure, requests to bypass phone verification,
mismatched reply-to, first-time payment instructions late in a transaction.
Be conservative: when uncertain, escalate.
Respond ONLY with JSON:
{"verdict": "clear|suspicious|fraud_p0",
 "confidence": 0.0-1.0,
 "signals": [str],
 "recommended_action": str}"""

def handle_inbox_triage(client, job):
    p = job["payload"]
    return llm(client, TRIAGE_SYSTEM,
               f"From: {p.get('from','')}\nSubject: {p.get('subject','')}\n\n{p.get('body','')}")

def handle_wire_fraud_scan(client, job):
    p = job["payload"]
    result = llm(client, WIREFRAUD_SYSTEM,
                 f"From: {p.get('from','')}\nReply-To: {p.get('reply_to','')}\n"
                 f"Subject: {p.get('subject','')}\n\n{p.get('body','')}")
    record_wire_scan(client, job, result)
    return result

def handle_synthetic_gen(client, job):
    # payload: {"scenario": "...", "count_hint": n} — generation prompt lives
    # in the payload so the platform controls the corpus recipe.
    p = job["payload"]
    return {"generated": llm(client, p["system_prompt"], p["user_prompt"])}

HANDLERS = {
    "inbox_triage": handle_inbox_triage,
    "wire_fraud_scan": handle_wire_fraud_scan,
    "synthetic_gen": handle_synthetic_gen,
    # 'doc_extract' and 'eval_run' land here when those pipelines are built
}

# ----------------------------------------------------------------------
def main():
    log.info("worker %s starting; llm=%s model=%s", WORKER_ID, LLM_BASE_URL, LLM_MODEL)
    with httpx.Client() as client:
        while _running:
            try:
                jobs = claim_jobs(client)
            except Exception as e:
                log.warning("claim failed (%s); backing off", e)
                time.sleep(POLL_SECONDS * 3)
                continue

            if not jobs:
                time.sleep(POLL_SECONDS)
                continue

            for job in jobs:
                if not _running:
                    break
                handler = HANDLERS.get(job["job_type"])
                if handler is None:
                    finish_job(client, job["id"], None, f"no handler for {job['job_type']}")
                    continue
                try:
                    result = handler(client, job)
                    finish_job(client, job["id"], result, None)
                    log.info("done %s %s", job["job_type"], job["id"])
                except Exception as e:
                    log.error("job %s failed: %s", job["id"], e)
                    finish_job(client, job["id"], None, str(e))

    log.info("worker stopped")

if __name__ == "__main__":
    main()
