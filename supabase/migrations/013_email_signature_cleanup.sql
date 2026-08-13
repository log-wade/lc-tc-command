-- Remove redundant "Carly" sign-offs before the full signature and remove
-- direct/cell numbers from both stored templates and already-queued drafts.

CREATE OR REPLACE FUNCTION clean_carly_email_body(body TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                body,
                E'\nWith gratitude,\nCarly\n{{signature_block}}',
                E'\nWith gratitude,\n{{signature_block}}'
              ),
              E'\nThanks,\nCarly\n{{signature_block}}',
              E'\nThank you,\n{{signature_block}}'
            ),
            E'\nCarly\n{{signature_block}}',
            E'\nThank you,\n{{signature_block}}'
          ),
          E'\nWith gratitude,\nCarly\nCarly Bryant',
          E'\nWith gratitude,\nCarly Bryant'
        ),
        E'\nThanks,\nCarly\nCarly Bryant',
        E'\nThank you,\nCarly Bryant'
      ),
      E'\nCarly\nCarly Bryant',
      E'\nThank you,\nCarly Bryant'
    ),
    E'\nDirect: (512) 555-0184  |  Cell: (512) 555-0291',
    ''
  );
$$;

UPDATE email_templates
SET body_template = clean_carly_email_body(body_template);

UPDATE review_queue
SET payload = jsonb_set(
  payload,
  '{draft_body}',
  to_jsonb(clean_carly_email_body(payload->>'draft_body'))
)
WHERE status = 'pending'
  AND payload ? 'draft_body'
  AND jsonb_typeof(payload->'draft_body') = 'string';

DROP FUNCTION clean_carly_email_body(TEXT);
