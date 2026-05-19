-- Automated LC/TC System — Phase 1 schema
-- Mirrors design doc Section 6

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agents (supervising licensees)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  trec_license TEXT,
  role TEXT DEFAULT 'agent' CHECK (role IN ('agent', 'broker', 'mca', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts (clients, escrow officers, etc.)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legal_name TEXT NOT NULL,
  preferred_name TEXT,
  email TEXT,
  phone TEXT,
  contact_type TEXT DEFAULT 'client' CHECK (contact_type IN ('client', 'escrow_officer', 'loan_officer', 'other')),
  communication_prefs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors (photographers, title, lenders, etc.)
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL CHECK (vendor_type IN ('photographer', 'title', 'lender', 'staging', 'sign', 'inspector', 'hoa', 'other')),
  primary_contact TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings (LC files)
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_address TEXT NOT NULL,
  city TEXT,
  state TEXT DEFAULT 'TX',
  zip TEXT,
  county TEXT,
  mls_number TEXT,
  status TEXT DEFAULT 'intake' CHECK (status IN (
    'intake', 'coming_soon', 'active', 'active_option', 'active_contingent',
    'pending', 'sold', 'withdrawn', 'expired', 'cancelled', 'temp_off_market'
  )),
  list_price NUMERIC(12,2),
  target_list_date DATE,
  actual_list_date DATE,
  sqft INTEGER,
  beds INTEGER,
  baths NUMERIC(3,1),
  year_built INTEGER,
  has_hoa BOOLEAN DEFAULT FALSE,
  hoa_name TEXT,
  mud_pid_sid BOOLEAN DEFAULT FALSE,
  photo_package TEXT,
  showing_instructions TEXT,
  compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'submitted', 'approved', 'kick_back', 'resolved')),
  listing_agent_id UUID REFERENCES agents(id),
  photographer_id UUID REFERENCES vendors(id),
  photo_session_at TIMESTAMPTZ,
  lockbox_serial TEXT,
  go_live_approved BOOLEAN DEFAULT FALSE,
  go_live_approved_at TIMESTAMPTZ,
  go_live_approved_by UUID REFERENCES agents(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE listing_sellers (
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  PRIMARY KEY (listing_id, contact_id)
);

-- Transactions (TC files)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  linked_listing_id UUID REFERENCES listings(id),
  side TEXT NOT NULL CHECK (side IN ('sell', 'buy', 'both')),
  property_address TEXT NOT NULL,
  mls_number TEXT,
  status TEXT DEFAULT 'intake' CHECK (status IN (
    'intake', 'active', 'pending', 'closed', 'terminated', 'cancelled'
  )),
  effective_date DATE,
  closing_date DATE,
  option_days INTEGER DEFAULT 10,
  option_fee_amount NUMERIC(12,2),
  earnest_money_amount NUMERIC(12,2),
  financing_days INTEGER DEFAULT 21,
  loan_type TEXT,
  title_file_number TEXT,
  compliance_status TEXT DEFAULT 'pending',
  supervising_agent_id UUID REFERENCES agents(id),
  title_company_id UUID REFERENCES vendors(id),
  lender_company_id UUID REFERENCES vendors(id),
  escrow_officer_id UUID REFERENCES contacts(id),
  loan_officer_id UUID REFERENCES contacts(id),
  wire_verified BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transaction_parties (
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  party_role TEXT CHECK (party_role IN ('buyer', 'seller')),
  PRIMARY KEY (transaction_id, contact_id, party_role)
);

-- Deadlines (deadline engine output)
CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_type TEXT NOT NULL CHECK (file_type IN ('listing', 'transaction')),
  file_id UUID NOT NULL,
  deadline_type TEXT NOT NULL,
  label TEXT NOT NULL,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'met', 'missed', 'waived', 'cancelled')),
  reminder_sent_7d BOOLEAN DEFAULT FALSE,
  reminder_sent_2d BOOLEAN DEFAULT FALSE,
  reminder_sent_1d BOOLEAN DEFAULT FALSE,
  reminder_sent_4h BOOLEAN DEFAULT FALSE,
  reminder_sent_0 BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deadlines_due ON deadlines(due_at) WHERE status = 'pending';
CREATE INDEX idx_deadlines_file ON deadlines(file_type, file_id);

-- Email templates
CREATE TABLE email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  category TEXT CHECK (category IN ('listing', 'transaction', 'internal', 'vendor')),
  requires_review BOOLEAN DEFAULT TRUE,
  auto_send_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communications log
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_type TEXT CHECK (file_type IN ('listing', 'transaction')),
  file_id UUID,
  template_id TEXT REFERENCES email_templates(id),
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  priority TEXT CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  to_addresses TEXT[] NOT NULL DEFAULT '{}',
  cc_addresses TEXT[] DEFAULT '{}',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES agents(id),
  reviewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Human-in-loop review queue
CREATE TABLE review_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_type TEXT,
  file_id UUID,
  item_type TEXT NOT NULL CHECK (item_type IN (
    'communication', 'go_live', 'amendment', 'escalation', 'wire_change', 'compliance'
  )),
  priority TEXT DEFAULT 'P2' CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  title TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  assigned_to UUID REFERENCES agents(id),
  resolved_by UUID REFERENCES agents(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_type TEXT CHECK (file_type IN ('listing', 'transaction')),
  file_id UUID,
  doc_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT,
  version INTEGER DEFAULT 1,
  compliance_checked BOOLEAN DEFAULT FALSE,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escalations
CREATE TABLE escalations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_type TEXT,
  file_id UUID,
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 4),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  assigned_to UUID REFERENCES agents(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log (Layer 8)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'human', 'ai_agent')),
  actor_id TEXT,
  file_type TEXT,
  file_id UUID,
  action_type TEXT NOT NULL,
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',
  references JSONB DEFAULT '{}',
  outcome TEXT CHECK (outcome IN ('success', 'failure', 'escalated', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_file ON audit_logs(file_type, file_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Inbound emails (AI triage)
CREATE TABLE inbound_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT UNIQUE,
  from_address TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  file_type TEXT,
  file_id UUID,
  priority TEXT CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  suggested_template TEXT,
  suggested_action TEXT,
  ai_classification JSONB,
  processed BOOLEAN DEFAULT FALSE,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default agent (Carly persona supervisor placeholder)
INSERT INTO agents (first_name, last_name, email, phone, trec_license, role)
VALUES ('Carly', 'Bryant', 'carly.bryant@kw.com', '(512) 555-0184', '723235-SA', 'admin');
