-- 015_ai_job_queue.sql
-- AI job queue: production (Vercel) enqueues, DGX Spark polls over Tailscale,
-- results written back. No inbound connectivity to the Spark required.

-- ============================================================
-- Job queue
-- ============================================================
create type ai_job_type as enum (
  'inbox_triage',        -- categorize inbound email, extract action items
  'wire_fraud_scan',     -- P0 classifier pass on wire/payment-related email
  'doc_extract',         -- TREC contract PDF -> structured fields
  'synthetic_gen',       -- batch synthetic transaction generation
  'eval_run'             -- prompt regression / model eval batch
);

create type ai_job_status as enum (
  'queued', 'claimed', 'done', 'failed', 'fallback'
);

create table ai_jobs (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid,                              -- multi-tenant (Phase 5); plain uuid — no orgs table
  job_type      ai_job_type not null,
  priority      int not null default 5,            -- 0 = P0 wire fraud
  payload       jsonb not null,                    -- input (email body, doc ref, etc.)
  result        jsonb,                             -- worker output
  status        ai_job_status not null default 'queued',
  attempts      int not null default 0,
  max_attempts  int not null default 3,
  claimed_by    text,                              -- worker id, e.g. 'spark-node-b'
  claimed_at    timestamptz,
  finished_at   timestamptz,
  error         text,
  -- fallback control: if not picked up by deadline, production routes
  -- the job to the Anthropic API instead of waiting on the Spark
  fallback_after timestamptz not null default now() + interval '10 minutes',
  created_at    timestamptz not null default now()
);

create index ai_jobs_pickup_idx
  on ai_jobs (status, priority, created_at)
  where status = 'queued';

create index ai_jobs_org_idx on ai_jobs (org_id, created_at desc);

-- ============================================================
-- Atomic claim (poller calls this via RPC).
-- FOR UPDATE SKIP LOCKED = safe even if you later add a second worker.
-- ============================================================
create or replace function claim_ai_jobs(worker_id text, batch_size int default 5)
returns setof ai_jobs
language plpgsql
security definer
as $$
begin
  return query
  update ai_jobs
  set status = 'claimed',
      claimed_by = worker_id,
      claimed_at = now(),
      attempts = attempts + 1
  where id in (
    select id from ai_jobs
    where status = 'queued'
      and fallback_after > now()          -- don't grab jobs production already took back
    order by priority asc, created_at asc
    for update skip locked
    limit batch_size
  )
  returning *;
end;
$$;

-- ============================================================
-- Reclaim stale jobs (claimed but never finished — Spark crashed mid-batch).
-- Called by the existing Vercel cron.
-- ============================================================
create or replace function reclaim_stale_ai_jobs(stale_minutes int default 15)
returns int
language plpgsql
security definer
as $$
declare n int;
begin
  update ai_jobs
  set status = case when attempts >= max_attempts then 'failed' else 'queued' end,
      claimed_by = null, claimed_at = null
  where status = 'claimed'
    and claimed_at < now() - make_interval(mins => stale_minutes);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ============================================================
-- RLS: service role only. The Spark uses a dedicated service key;
-- end users never touch this table directly.
-- ============================================================
alter table ai_jobs enable row level security;
-- (no policies = service_role only, which bypasses RLS)

-- ============================================================
-- Wire-fraud results get their own audit-grade table (Layer 8),
-- regardless of which engine (Spark or API) produced the verdict.
-- ============================================================
create table wire_fraud_scans (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid references ai_jobs(id),
  org_id       uuid,                              -- plain uuid — no orgs table
  email_ref    text not null,                 -- message id / file event ref
  verdict      text not null check (verdict in ('clear','suspicious','fraud_p0')),
  confidence   numeric(4,3),
  signals      jsonb,                         -- which patterns fired
  engine       text not null,                 -- 'spark:wirefraud-lora-v3' | 'anthropic:claude-...'
  escalated    boolean not null default false,
  created_at   timestamptz not null default now()
);

create index wire_fraud_scans_org_idx on wire_fraud_scans (org_id, created_at desc);
