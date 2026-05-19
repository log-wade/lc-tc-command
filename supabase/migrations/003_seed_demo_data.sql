-- Demo seed data for production dashboard (optional starter files)

INSERT INTO agents (id, first_name, last_name, email, phone, trec_license, role)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Jamie', 'Rivera', 'jamie.rivera@kw.com', '(512) 555-0100', '654321-SA', 'agent'),
  ('a0000000-0000-4000-8000-000000000002', 'Carly', 'Bryant', 'carly.bryant@kw.com', '(512) 555-0184', '723235-SA', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO listings (
  id, property_address, city, state, zip, county, status, list_price,
  target_list_date, actual_list_date, listing_agent_id, compliance_status, go_live_approved
) VALUES
  (
    'b0000000-0000-4000-8000-000000000001',
    '413 Pecan Hollow Dr', 'Cedar Park', 'TX', '78613', 'Williamson',
    'active', 485000, '2026-04-15', '2026-04-18',
    'a0000000-0000-4000-8000-000000000001', 'approved', true
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    '1204 Lakeline Blvd Unit 204', 'Austin', 'TX', '78717', 'Williamson',
    'intake', 325000, '2026-05-25', NULL,
    'a0000000-0000-4000-8000-000000000001', 'pending', false
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions (
  id, property_address, side, status, effective_date, closing_date,
  option_days, option_fee_amount, earnest_money_amount, financing_days,
  supervising_agent_id, compliance_status
) VALUES (
  'c0000000-0000-4000-8000-000000000001',
  '892 Summit Ridge Ln', 'buy', 'pending',
  '2026-05-01', '2026-06-15',
  10, 500, 15000, 21,
  'a0000000-0000-4000-8000-000000000001', 'submitted'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO deadlines (file_type, file_id, deadline_type, label, due_at, status) VALUES
  ('transaction', 'c0000000-0000-4000-8000-000000000001', 'option_period_end', 'Option Period Ends (5 PM)', '2026-05-11 17:00:00-05', 'met'),
  ('transaction', 'c0000000-0000-4000-8000-000000000001', 'title_commitment', 'Title Commitment Due', '2026-05-21 17:00:00-05', 'pending'),
  ('transaction', 'c0000000-0000-4000-8000-000000000001', 'closing', 'Closing Date', '2026-06-15 17:00:00-05', 'pending')
ON CONFLICT DO NOTHING;
