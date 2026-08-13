-- Replace recomputable transaction deadlines atomically. Completion history
-- (met/waived rows) is intentionally retained by both this function and the app.

CREATE OR REPLACE FUNCTION replace_transaction_deadlines(
  p_file_id UUID,
  p_deadlines JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM deadlines
  WHERE file_type = 'transaction'
    AND file_id = p_file_id
    AND status IN ('pending', 'missed', 'cancelled');

  INSERT INTO deadlines (
    file_type,
    file_id,
    deadline_type,
    label,
    due_at,
    status
  )
  SELECT
    'transaction',
    p_file_id,
    item.deadline_type,
    item.label,
    item.due_at,
    item.status
  FROM jsonb_to_recordset(p_deadlines) AS item(
    deadline_type TEXT,
    label TEXT,
    due_at TIMESTAMPTZ,
    status TEXT
  );
END;
$$;

REVOKE ALL ON FUNCTION replace_transaction_deadlines(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION replace_transaction_deadlines(UUID, JSONB) TO service_role;
