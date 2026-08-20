-- Persist coordinator revisions and file attachments on broker email templates.
-- catalog.ts still seeds defaults; runtime overlays subject/body/attachments from this table.

ALTER TABLE email_templates
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('template-attachments', 'template-attachments', false, 8388608)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit;
