-- Fold ECAD into the listing documents-needed template. catalog.ts is the
-- application source of truth; this keeps stored email_templates in sync.
-- The standalone tpl-ecad-needed row stays for post-intake discovery.

UPDATE email_templates
SET
  name = 'Listing Documents Needed / Survey, T-47 & ECAD',
  body_template = $body$Hi {{seller_first_name}},

As we prepare {{property_address}} for the market, here are the documents and items we need from you:

  • Current survey: Please reply with a clear PDF copy if you have one.
  • T-47 affidavit: If you have a current survey, complete the T-47 using the survey and acquisition date, list any changes to the property (or write NONE), then sign it in wet ink before a notary. The T-47 cannot be electronically signed. If you need a blank form or help finding a notary, let me know.
{{ecad_request}}  • Listing documents: Watch for the Lone Wolf e-sign packet, which may include the Listing Agreement, Information About Brokerage Services, General Notice, Warning Regarding Wire Fraud, and Seller Net Sheet.
  • Seller's Disclosure Notice: Please complete the Sellers Shield questionnaire we send. The optional paid legal-protection upgrade is not required unless you want it.
  • Spare key: Please have a working spare key ready for the lockbox before photography.

Reply here with the survey{{ecad_reply_ask}} or any questions. I’m happy to walk you through the T-47 before it is notarized.

Thank you,
{{signature_block}}$body$
WHERE id = 'tpl-listing-docs';
