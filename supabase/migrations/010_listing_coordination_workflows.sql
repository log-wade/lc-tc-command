-- Listing-coordination workflows recovered from the operational source documents.
-- catalog.ts remains the application source of truth; these rows keep Supabase in sync.

INSERT INTO email_templates
  (id, name, subject_template, body_template, category, requires_review, auto_send_enabled)
VALUES
(
  'tpl-listing-docs',
  'Listing Documents Needed / Survey & T-47',
  'Documents Needed for {{property_address}}',
  E'Hi {{seller_first_name}},\n\nAs we prepare {{property_address}} for the market, here are the documents and items we need from you:\n\n  • Current survey: Please reply with a clear PDF copy if you have one.\n  • T-47 affidavit: If you have a current survey, complete the T-47 using the survey and acquisition date, list any changes to the property (or write NONE), then sign it in wet ink before a notary. The T-47 cannot be electronically signed. If you need a blank form or help finding a notary, let me know.\n  • Listing documents: Watch for the Lone Wolf e-sign packet, which may include the Listing Agreement, Information About Brokerage Services, General Notice, Warning Regarding Wire Fraud, and Seller Net Sheet.\n  • Seller''s Disclosure Notice: Please complete the Sellers Shield questionnaire we send. The optional paid legal-protection upgrade is not required unless you want it.\n  • Spare key: Please have a working spare key ready for the lockbox before photography.\n\nReply here with the survey or any questions. I’m happy to walk you through the T-47 before it is notarized.\n\nCarly\n{{signature_block}}',
  'listing',
  true,
  false
),
(
  'tpl-ecad-needed',
  'ECAD Audit Needed',
  'ECAD Energy Audit Needed for {{property_address}}',
  E'Hi {{seller_first_name}},\n\nBecause {{property_address}} is within Austin city limits, receives Austin Energy service, and is at least 10 years old, the City of Austin''s ECAD ordinance requires an energy audit before the property is sold.\n\nYou can schedule the audit with Austin Auditors here:\nhttps://austinauditors.com/book/\n\nPricing is typically about $159 and up, depending on the property. The report does not need to delay our go-live date, but it must be completed and disclosed before the resale contract is executed.\n\nPlease send me the appointment details once scheduled, and forward the completed report when you receive it.\n\nCarly\n{{signature_block}}',
  'listing',
  true,
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subject_template = EXCLUDED.subject_template,
  body_template = EXCLUDED.body_template,
  category = EXCLUDED.category,
  requires_review = EXCLUDED.requires_review,
  auto_send_enabled = EXCLUDED.auto_send_enabled;
