-- Round 2 template revisions (source of truth is src/lib/templates/catalog.ts).
-- Keeps the email_templates seed rows in sync:
--  - tpl-1: add Staging Consultation + Disclosures bullets, photography timing,
--           drop Showings + Feedback bullet, rewrite closing paragraph
--  - tpl-2: expand ShowingTime overview with Home by ShowingTime app links,
--           fold Notifications into the Showings section, reword showing parameters
--  - tpl-4: add online exposure / reverse prospecting stats
--  - tpl-photoshoot-prep: new Listing Coordination template

INSERT INTO email_templates (id, name, subject_template, body_template, category, requires_review, auto_send_enabled) VALUES
('tpl-1', 'Listing Intro / What to Expect',
 'Welcome {{seller_first_name}} — Here''s What to Expect for {{property_address}}',
 E'Hi {{seller_first_name}},\n\nWelcome! I''m Carly, the Listing Coordinator working with {{agent_first_name}} on the sale of {{property_address}}. My job is to handle the operational moving parts so {{agent_first_name}} can stay focused on you, your goals, and getting your home sold.\n\nHere''s the short version of what to expect over the next 7–10 days:\n\n  • Staging Consultation: We''ll start with a staging consultation so your home is styled to show its very best for photos and showings.\n  • Photography: I''ll coordinate professional photography, completed at least 2 days before your intended "Go Live" date.\n  • Sign + Lockbox: {{agent_first_name}} will deliver these prior to the photo session.\n  • Disclosures + Notices: I''ll help you complete and provide any necessary disclosures and notices — Seller''s Disclosure Notice, PID/MUD notices, Survey & T-47, and similar — where applicable.\n  • MLS Listing: I''ll build your full MLS record and send it to {{agent_first_name}} for review — nothing publishes without your green light.\n  • Going Live: Once approved, I''ll activate the listing and send you a "We Are Live" email.\n\nThroughout this Make-Ready / Coming Soon process, I''m here to answer any questions you have — so please never hesitate to reach out. {{agent_first_name}} and I are genuinely excited to work with you and to get your home sold.\n\nLooking forward to working with you.\n\nCarly\n{{signature_block}}',
 'listing', true, false),

('tpl-photoshoot-prep', 'Photoshoot Confirmation & How to Prepare',
 'Photoshoot Confirmed — {{property_address}} — {{photo_date}}',
 E'Hi {{seller_first_name}},\n\nGreat news — professional photography for {{property_address}} is confirmed! Photos are one of the biggest drivers of buyer interest, so here''s everything you need to have the home camera-ready.\n\nPhotoshoot details:\n\n  • Date: {{photo_date}}\n  • Time: {{photo_time}}\n\nOur professional photographer will arrive at the scheduled time. To help your home look its absolute best, here''s a quick prep checklist:\n\n  Whole home\n  • Turn on every light and replace any burnt-out bulbs; open blinds and curtains for natural light.\n  • Declutter countertops, floors, and surfaces — less is more on camera.\n  • Put away personal items (family photos, mail, calendars) and any valuables.\n  • Tuck away cords, chargers, remotes, and visible electronics.\n  • Hide trash cans, pet bowls, litter boxes, toys, and crates.\n\n  Kitchen\n  • Clear the counters down to one or two decorative items.\n  • Remove magnets, notes, and photos from the fridge.\n  • Stow dish soap, sponges, and towels.\n\n  Bathrooms\n  • Clear counters; stow toiletries, toothbrushes, and trash cans.\n  • Close toilet lids, hang fresh towels, and remove floor mats.\n\n  Bedrooms\n  • Make the beds with clean, wrinkle-free linens.\n  • Clear nightstands and dressers to a minimum.\n\n  Curb appeal\n  • Mow, trim, and clear the yard of hoses, tools, and toys.\n  • Sweep the walkways and porch; move cars out of the driveway and off the front curb.\n  • Bring trash and recycling bins out of view.\n\nA couple of tips: pets are best kept crated or off-site during the shoot, and please have the home fully ready before the photographer arrives so we can stay on schedule.\n\nIf anything comes up or you have questions as you prepare, just reach out — I''m happy to help. Can''t wait to see how it turns out!\n\nCarly\n{{signature_block}}',
 'listing', true, false),

('tpl-2', 'We Are Live',
 'We''re Live — {{property_address}} is on the Market!',
 E'Hi {{seller_first_name}},\n\nExciting news — {{property_address}} is LIVE on the market! Buyers can find it on MLS and the major real estate sites starting now. We''re so glad to have your home out there and ready for showings.\n\nHere''s what to know:\n\n  • Showings: Buyer agents request appointments through ShowingTime, the showing management service we use to schedule, confirm, and gather feedback on every visit. I''d recommend downloading the free "Home by ShowingTime" app so you can approve, deny, or reschedule requests right from your phone, see who''s coming, and read feedback all in one place. {{showing_instructions}}\n      – iPhone / iPad: https://apps.apple.com/us/app/home-by-showingtime/id1433915149\n      – Android: https://play.google.com/store/apps/details?id=com.showingtime.ConsumerApp\n      – Desktop: https://home.showingtime.com\n    Notifications: {{showing_notifications}} When a showing is requested, you''ll get a text and/or email so you can confirm, deny, or ask to reschedule — how this works can vary by property type and whether the home is occupied.\n  • Showing parameters: {{showing_restrictions}} If there''s anything you''d like us to set in ShowingTime — a minimum notice window, specific days or times to block off, or special showing instructions — just let me know and I''ll update it right away.\n  • Open house: {{open_house_details}}\n  • Feedback: I''ll send you a weekly summary every Tuesday by 3 PM with showings and themes from buyer agents.\n\nWe''re thrilled to be under way — let''s get this home sold!\n\nCarly\n{{signature_block}}',
 'listing', true, false),

('tpl-4', 'LA Recap (Monday)',
 'Listing Activity — {{property_address}}',
 E'Hey {{agent_first_name}},\n\nSupra + ShowingTime pull for the week:\n\n  • Showings: {{showings}} | Cancellations: {{cancellations}} | No-shows: {{no_shows}}\n  • Feedback: {{feedback_count}} of {{showings}}\n  • Themes: {{feedback_themes}}\n\nOnline exposure:\n\n  • MLS reverse prospecting: {{reverse_prospecting}}\n  • Portal views (Zillow/Realtor.com/etc.): {{online_views}}\n  • Saves / favorites: {{online_saves}}\n\nClient update going out Tuesday by 3 PM unless you want me to hold.\n\nCarly\n{{signature_block}}',
 'internal', true, false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subject_template = EXCLUDED.subject_template,
  body_template = EXCLUDED.body_template,
  category = EXCLUDED.category,
  requires_review = EXCLUDED.requires_review,
  auto_send_enabled = EXCLUDED.auto_send_enabled;
