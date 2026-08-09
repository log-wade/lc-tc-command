-- Idempotent safety pass after 005:
-- - Ensure listing/transaction columns exist
-- - Upsert 9-template library content (no ID remapping)
-- - Drop any leftover tpl-10 / legacy-* rows if somehow present
-- Safe to run on DBs already on the new scheme (greenfield or post-005).

ALTER TABLE listings ADD COLUMN IF NOT EXISTS showing_restrictions TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS showing_notification_preference TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS open_house_details TEXT;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS has_hoa BOOLEAN DEFAULT FALSE;

-- Never remap current IDs. Only remove obsolete rows.
DELETE FROM email_templates WHERE id = 'tpl-10' OR id LIKE 'legacy-%';

INSERT INTO email_templates (id, name, subject_template, body_template, category, requires_review, auto_send_enabled) VALUES
('tpl-1', 'Listing Intro / What to Expect',
 'Welcome {{seller_first_name}} — Here''s What to Expect for {{property_address}}',
 E'Hi {{seller_first_name}},\n\nWelcome! I''m Carly, the Listing Coordinator working with {{agent_first_name}} on the sale of {{property_address}}. My job is to handle the operational moving parts so {{agent_first_name}} can stay focused on you, your goals, and getting your home sold.\n\nHere''s the short version of what to expect over the next 7–10 days:\n\n  • Photography: I''ll coordinate professional photography this week.\n  • Sign + Lockbox: {{agent_first_name}} will deliver these prior to the photo session.\n  • MLS Listing: I''ll build your full MLS record and send it to {{agent_first_name}} for review — nothing publishes without your green light.\n  • Going Live: Once approved, I''ll activate the listing and send you a "We Are Live" email.\n  • Showings + Feedback: Weekly updates every Tuesday by 3 PM.\n\nIf anything comes up, reach me at the number below — Mon–Fri, 9 to 5. For urgent matters outside those hours, {{agent_first_name}} is your first call.\n\nLooking forward to working with you.\n\nCarly\n{{signature_block}}',
 'listing', true, false),

('tpl-2', 'We Are Live',
 'We''re Live — {{property_address}} is on the Market!',
 E'Hi {{seller_first_name}},\n\nExciting news — {{property_address}} is LIVE on the market! Buyers can find it on MLS and the major real estate sites starting now. We''re so glad to have your home out there and ready for showings.\n\nHere''s what to know:\n\n  • Showings: Buyer agents request appointments through ShowingTime. {{showing_instructions}}\n  • Showing restrictions: {{showing_restrictions}} If you already know days or times you need blocked off (or want to add any), just let me know and I''ll update ShowingTime right away.\n  • Notifications: {{showing_notifications}} When a showing is requested, you''ll typically get a text and/or email from the showing service so you can confirm, deny, or ask to reschedule — this can vary by property type and whether the home is occupied.\n  • Open house: {{open_house_details}}\n  • Feedback: I''ll send you a weekly summary every Tuesday by 3 PM with showings and themes from buyer agents.\n\nWe''re thrilled to be under way — let''s get this home sold!\n\nCarly\n{{signature_block}}',
 'listing', true, false),

('tpl-3', 'Weekly Tuesday Listing Update',
 '{{property_address}} — Weekly Listing Update',
 E'Hi {{seller_first_name}},\n\nHere''s where we are after {{days_on_market}} days on market:\n\n  • Showings this week: {{showings_week}} (cumulative: {{showings_total}})\n  • Feedback received: {{feedback_count}}\n\nFeedback themes:\n{{feedback_themes}}\n\nAs always, {{agent_first_name}} and I are watching activity closely and are here if you have questions. Reach out anytime — we''re glad to be in your corner this week.\n\nCarly\n{{signature_block}}',
 'listing', true, false),

('tpl-4', 'LA Recap (Monday)',
 'Listing Activity — {{property_address}}',
 E'Hey {{agent_first_name}},\n\nSupra + ShowingTime pull for the week:\n\n  • Showings: {{showings}} | Cancellations: {{cancellations}} | No-shows: {{no_shows}}\n  • Feedback: {{feedback_count}} of {{showings}}\n  • Themes: {{feedback_themes}}\n\nClient update going out Tuesday by 3 PM unless you want me to hold.\n\nCarly\n{{signature_block}}',
 'internal', true, false),

('tpl-5', 'Congrats & What to Expect (Transaction)',
 'What Happens Next — {{property_address}}',
 E'Hi {{client_first_name}},\n\nHuge congratulations on going under contract on {{property_address}}! I''m Carly, the Transaction Coordinator working with {{agent_first_name}} from here to closing. I''ll keep the deadlines, documents, and third-party coordination moving so you can focus on the exciting parts.\n\nHere are your key dates and responsibilities:\n\n{{key_dates_table}}\n\nAs we move through the transaction, you''ll hear from me every Tuesday with a short weekly update on where things stand and what''s coming up next.\n\nI know there''s a lot of moving parts, but we''re so excited for you and are here to help every step of the way — now let''s get to closing!\n\nCarly\n{{signature_block}}',
 'transaction', true, false),

('tpl-6', 'Title + Lender Intro',
 'New Contract — {{property_address}} — {{agent_first_name}}',
 E'Hi {{third_party_name}},\n\nI''m Carly, transaction coordinator for the Do Kind Group, and I''ll be assisting {{agent_first_name}} with this new contract for {{property_address}} — executed documents attached below.\n\nPlease confirm receipt and kindly CC me on all transaction communications. Looking forward to working with you all — let''s get this bad boy to the closing table! Wahoo.\n\nThanks,\nCarly\n{{signature_block}}',
 'transaction', true, false),

('tpl-7', 'Weekly Tuesday Transaction Update',
 '{{property_address}} — Weekly Update — {{days_to_closing}} Days to Closing',
 E'Hi {{client_first_name}},\n\nQuick check-in on {{property_address}} as we head toward closing — here''s this week''s snapshot:\n\n{{transaction_progress}}\n\n  • Closing Date: {{closing_date}} ({{days_to_closing}} days out)\n  • Status: {{status_summary}}\n\nCompleted:\n{{completed_milestones}}\n\nIn progress:\n{{in_progress_items}}\n\nAction needed: {{action_needed}}\n\nAs always, {{agent_first_name}} and I are here if anything comes up. Talk soon!\n\nCarly\n{{signature_block}}',
 'transaction', true, false),

('tpl-8', 'Closing Appointment Confirmation',
 'Closing Confirmed — {{property_address}} — {{closing_day}} at {{closing_time}}',
 E'Hi {{client_first_name}},\n\nYour closing is confirmed!\n\n  • Date: {{closing_day}}\n  • Time: {{closing_time}} CT\n  • Location: {{title_company}}\n  • Closer: {{closer_name}} | {{closer_phone}}\n  • Signing method: {{signing_method}}\n\nA few reminders as we wrap up:\n\n  • Utilities: {{utilities_reminder}}\n  • Final walkthrough: {{final_walkthrough}}\n  • Keys & remotes: {{keys_and_access}}\n\nIMPORTANT: Verify wire instructions by PHONE using the closer''s number above. Never trust an emailed change of wire instructions.\n\nWe''re almost there — looking forward to celebrating with you at the closing table!\n\nCarly\n{{signature_block}}',
 'transaction', true, false),

('tpl-9', 'Post-Closing Congrats + Review',
 'Congratulations {{client_first_name}} — You''re Closed!',
 E'Hi {{client_first_name}},\n\nCongratulations on closing at {{property_address}}! {{agent_first_name}} and I are so glad we got to walk this journey with you — from contract to keys, it''s been a pleasure.\n\nIf you have a moment, we''d be honored if you''d share your experience. A quick Google review helps other families find our team, and it means the world to us:\n\n{{review_link}}\n\nThank you again for trusting us with one of life''s biggest milestones. We''re cheering you on in this next chapter — and we''re only a call or text away if you ever need anything.\n\nWith gratitude,\nCarly\n{{signature_block}}',
 'transaction', true, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subject_template = EXCLUDED.subject_template,
  body_template = EXCLUDED.body_template,
  category = EXCLUDED.category,
  requires_review = EXCLUDED.requires_review,
  auto_send_enabled = EXCLUDED.auto_send_enabled;

-- Normalize any stray pending review that still points at removed tpl-10
UPDATE review_queue
SET payload = jsonb_set(payload, '{template_id}', '"tpl-9"')
WHERE status = 'pending'
  AND payload->>'template_id' = 'tpl-10';
