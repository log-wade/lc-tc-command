INSERT INTO email_templates (id, name, subject_template, body_template, category, requires_review, auto_send_enabled) VALUES
('tpl-1', 'Listing Intro / What to Expect',
 'Welcome {{seller_first_name}} — Here''s What to Expect for {{property_address}}',
 E'Hi {{seller_first_name}},\n\nWelcome! I''m Carly Bryant, the Listing Coordinator working with {{agent_first_name}} on the sale of {{property_address}}. My job is to handle the operational moving parts so {{agent_first_name}} can stay focused on you, your goals, and getting your home sold.\n\nHere''s the short version of what to expect over the next 7–10 days:\n\n  • Photography: I''ll schedule with {{photographer_name}} this week.\n  • Sign + Lockbox: {{agent_first_name}} will deliver these prior to the photo session.\n  • MLS Listing: I''ll build your full MLS record and send it to {{agent_first_name}} for review — nothing publishes without your green light.\n  • Going Live: Once approved, I''ll activate the listing and send you a "We Are Live" email.\n  • Showings + Feedback: Weekly updates every Tuesday by 3 PM.\n\nIf anything comes up, reach me at the number below — Mon–Fri, 8 to 5:30. For urgent matters outside those hours, {{agent_first_name}} is your first call.\n\nLooking forward to working with you.\n\nCarly\n{{signature_block}}',
 'listing', true, false),

('tpl-3', 'We Are Live',
 'We''re Live — {{property_address}} is on the Market',
 E'Hi {{seller_first_name}},\n\nGreat news — your listing went active on MLS this morning at {{go_live_time}}.\n\n  • Showings: Buyer agents request through ShowingTime. {{showing_instructions}}\n  • Lockbox: Supra lockbox active, serial {{lockbox_serial}}.\n  • Showing Feedback: Summary every Tuesday by 3 PM.\n\nWelcome to market. Let''s go sell this house.\n\nCarly\n{{signature_block}}',
 'listing', true, false),

('tpl-4', 'Weekly Tuesday Listing Update',
 '{{property_address}} — Weekly Update (Week of {{week_date}})',
 E'Hi {{seller_first_name}},\n\nHere''s where we are after {{days_on_market}} days on market:\n\n  • Showings this week: {{showings_week}} (cumulative: {{showings_total}})\n  • Feedback received: {{feedback_count}}\n  • Days on Market: {{days_on_market}}\n\nFeedback themes:\n{{feedback_themes}}\n\nWhat''s next:\n{{next_steps}}\n\nCarly\n{{signature_block}}',
 'listing', true, false),

('tpl-5', 'LA Recap (Monday)',
 'LA Recap — {{property_address}} — Week of {{week_date}}',
 E'Hey {{agent_first_name}},\n\nSupra + ShowingTime pull for the week:\n\n  • Showings: {{showings}} | Cancellations: {{cancellations}} | No-shows: {{no_shows}}\n  • Feedback: {{feedback_count}} of {{showings}}\n  • Themes: {{feedback_themes}}\n\nMy read: {{agent_read}}\n\nClient update going out Tuesday by 3 PM unless you want me to hold.\n\nCarly\n{{signature_block}}',
 'internal', true, false),

('tpl-6', 'Congrats & What to Expect (Transaction)',
 'Congrats {{client_first_name}} — Here''s What Happens Next for {{property_address}}',
 E'Hi {{client_first_name}},\n\nHuge congratulations on going under contract on {{property_address}}! I''m Carly Bryant, the Transaction Coordinator working with {{agent_first_name}} from here to closing.\n\nKey dates:\n  • Effective Date: {{effective_date}}\n  • Option Fee Due: {{option_fee_due}}\n  • Earnest Money Due: {{earnest_money_due}}\n  • Option Period Ends: {{option_period_end}}\n  • Loan Application Due: {{loan_app_due}}\n  • Buyer Approval Deadline: {{buyer_approval_due}}\n  • Title Commitment Due: {{title_commitment_due}}\n  • Closing Date: {{closing_date}}\n\nWeekly updates every Tuesday. Intro emails to lender and title today.\n\nExcited for you. Let''s get to closing.\n\nCarly\n{{signature_block}}',
 'transaction', true, false),

('tpl-7', 'Title + Lender Intro',
 'New Contract — {{property_address}} — Closing {{closing_date}} — Please cc TC',
 E'Hi {{third_party_name}},\n\nCarly Bryant, Transaction Coordinator for {{agent_full_name}} at Keller Williams Realty Austin Northwest.\n\n  • Buyer: {{buyer_names}} | Seller: {{seller_names}}\n  • Effective: {{effective_date}} | Closing: {{closing_date}}\n  • Title File #: {{title_file_number}} | MLS #: {{mls_number}}\n\nPlease cc me on all transaction communications.\n\nCarly\n{{signature_block}}',
 'transaction', true, false),

('tpl-8', 'Weekly Tuesday Transaction Update',
 '{{property_address}} — Weekly Update — {{days_to_closing}} Days to Closing',
 E'Hi {{client_first_name}},\n\n  • Closing Date: {{closing_date}} ({{days_to_closing}} days out)\n  • Status: {{status_summary}}\n\nCompleted:\n{{completed_milestones}}\n\nIn progress:\n{{in_progress_items}}\n\nAction needed: {{action_needed}}\n\nCarly\n{{signature_block}}',
 'transaction', true, false),

('tpl-9', 'Closing Appointment Confirmation',
 'Closing Confirmed — {{property_address}} — {{closing_day}} at {{closing_time}}',
 E'Hi {{client_first_name}},\n\nYour closing is confirmed!\n\n  • Date: {{closing_day}}\n  • Time: {{closing_time}} CT\n  • Location: {{title_company}}\n  • Closer: {{closer_name}} | {{closer_phone}}\n\nIMPORTANT: Verify wire instructions by PHONE using the closer''s number above. Never trust an emailed change of wire instructions.\n\nCarly\n{{signature_block}}',
 'transaction', true, false),

('tpl-10', 'Post-Closing Congrats + Review',
 'Congratulations {{client_first_name}} — You''re Closed!',
 E'Hi {{client_first_name}},\n\nCongratulations on closing at {{property_address}}! {{agent_first_name}} and I are so glad we got to work with you.\n\n  • MLS updated to Sold/Closed.\n  • Review link: {{review_link}}\n\nThank you for trusting us.\n\nCarly\n{{signature_block}}',
 'transaction', true, false);
