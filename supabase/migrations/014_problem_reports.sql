-- Authenticated problem reports, AI analysis, and approved implementation runs

CREATE TABLE problem_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN (
      'open',
      'analyzing',
      'plan_ready',
      'approved',
      'implementing',
      'pr_open',
      'merged',
      'deployed',
      'failed',
      'rejected'
    )
  ),
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  plan JSONB,
  plan_version INTEGER NOT NULL DEFAULT 0 CHECK (plan_version >= 0),
  cursor_agent_id TEXT,
  cursor_run_id TEXT,
  pr_url TEXT,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_problem_reports_org_created
  ON problem_reports(organization_id, created_at DESC);
CREATE INDEX idx_problem_reports_status
  ON problem_reports(status, updated_at DESC);

ALTER TABLE problem_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated clients may read their organization’s reports. All mutations go
-- through authenticated server routes using the service role so approval cannot
-- be bypassed by writing status or plan fields directly.
CREATE POLICY problem_reports_org_read ON problem_reports
  FOR SELECT
  USING (organization_id = current_org_id());
