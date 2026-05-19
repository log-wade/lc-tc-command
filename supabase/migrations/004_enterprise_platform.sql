-- Enterprise platform: multi-tenant orgs, events, workflows, SLA, integrations, API keys

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'coordinator' CHECK (role IN ('coordinator', 'agent', 'broker', 'mca', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_org ON profiles(organization_id);

-- Default organization (KW Austin Northwest)
INSERT INTO organizations (id, name, slug, settings)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'Keller Williams Austin Northwest',
  'kw-anw',
  '{"timezone":"America/Chicago","tuesday_update_hour":15}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE deadlines ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE communications ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE inbound_emails ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
ALTER TABLE escalations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

UPDATE listings SET organization_id = 'a0000000-0000-4000-8000-000000000001' WHERE organization_id IS NULL;
UPDATE transactions SET organization_id = 'a0000000-0000-4000-8000-000000000001' WHERE organization_id IS NULL;
UPDATE review_queue SET organization_id = 'a0000000-0000-4000-8000-000000000001' WHERE organization_id IS NULL;
UPDATE deadlines SET organization_id = 'a0000000-0000-4000-8000-000000000001' WHERE organization_id IS NULL;
UPDATE audit_logs SET organization_id = 'a0000000-0000-4000-8000-000000000001' WHERE organization_id IS NULL;

ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS due_by TIMESTAMPTZ;
ALTER TABLE review_queue ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMPTZ;

-- Immutable-style file event stream
CREATE TABLE file_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_type TEXT CHECK (file_type IN ('listing', 'transaction')),
  file_id UUID,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'human', 'ai_agent', 'integration')),
  actor_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_file_events_file ON file_events(file_type, file_id, created_at DESC);
CREATE INDEX idx_file_events_org ON file_events(organization_id, created_at DESC);

-- Workflow execution log
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL,
  file_type TEXT,
  file_id UUID,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  steps JSONB NOT NULL DEFAULT '[]',
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_workflow_runs_org ON workflow_runs(organization_id, started_at DESC);

-- AI agent audit (separate from general audit for broker reporting)
CREATE TABLE agent_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('chat', 'voice', 'tool', 'workflow')),
  action_type TEXT NOT NULL,
  actor_id TEXT,
  file_type TEXT,
  file_id UUID,
  tool_name TEXT,
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  policy_result TEXT CHECK (policy_result IN ('allowed', 'blocked', 'warn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_audit_org ON agent_audit_logs(organization_id, created_at DESC);

-- Per-org integration credentials (encrypted at app layer in production)
CREATE TABLE integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('mls', 'docusign', 'showingtime', 'supra', 'title', 'resend')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'error')),
  config JSONB NOT NULL DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, provider)
);

-- Enterprise API keys (Phase 5)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  scopes TEXT[] NOT NULL DEFAULT '{read}',
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper: current user's organization
CREATE OR REPLACE FUNCTION current_org_id() RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_self ON organizations FOR SELECT USING (
  id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY profiles_self ON profiles FOR SELECT USING (
  id = auth.uid() OR organization_id = current_org_id()
);

CREATE POLICY listings_org ON listings FOR ALL USING (organization_id = current_org_id());
CREATE POLICY transactions_org ON transactions FOR ALL USING (organization_id = current_org_id());
CREATE POLICY review_org ON review_queue FOR ALL USING (organization_id = current_org_id());
CREATE POLICY deadlines_org ON deadlines FOR ALL USING (organization_id = current_org_id());
CREATE POLICY audit_org ON audit_logs FOR SELECT USING (organization_id = current_org_id());
CREATE POLICY events_org ON file_events FOR SELECT USING (organization_id = current_org_id());
CREATE POLICY workflow_org ON workflow_runs FOR SELECT USING (organization_id = current_org_id());
CREATE POLICY agent_audit_org ON agent_audit_logs FOR SELECT USING (organization_id = current_org_id());
CREATE POLICY integrations_org ON integration_connections FOR ALL USING (organization_id = current_org_id());

-- Brokers/admins can read all org audit; agents see own files via listing_agent_id (future tighten)
