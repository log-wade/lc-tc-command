export type EmailTemplate = {
  id: string;
  name: string;
  when: string;
  category: "Listing" | "Transaction" | "Internal";
  subject: string;
  body: string;
  requiresReview: boolean;
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-1",
    name: "Listing intro / What to Expect",
    when: "Within 24 hrs of intake",
    category: "Listing",
    requiresReview: true,
    subject: "Welcome {{seller_first_name}} — Here's What to Expect for {{property_address}}",
    body: `Hi {{seller_first_name}},

Welcome! I'm Carly Bryant, the Listing Coordinator working with {{agent_first_name}} on the sale of {{property_address}}. My job is to handle the operational moving parts so {{agent_first_name}} can stay focused on you, your goals, and getting your home sold.

Here's the short version of what to expect over the next 7–10 days:

  • Photography: I'll schedule with {{photographer_name}} this week.
  • Sign + Lockbox: {{agent_first_name}} will deliver these prior to the photo session.
  • MLS Listing: I'll build your full MLS record and send it to {{agent_first_name}} for review — nothing publishes without your green light.
  • Going Live: Once approved, I'll activate the listing and send you a "We Are Live" email.
  • Showings + Feedback: Weekly updates every Tuesday by 3 PM.

If anything comes up, reach me at the number below — Mon–Fri, 8 to 5:30. For urgent matters outside those hours, {{agent_first_name}} is your first call.

Looking forward to working with you.

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-3",
    name: "We Are Live",
    when: "After go-live approval",
    category: "Listing",
    requiresReview: true,
    subject: "We're Live — {{property_address}} is on the Market",
    body: `Hi {{seller_first_name}},

Great news — your listing went active on MLS this morning at {{go_live_time}}.

  • Showings: Buyer agents request through ShowingTime. {{showing_instructions}}
  • Lockbox: Supra lockbox active, serial {{lockbox_serial}}.
  • Showing Feedback: Summary every Tuesday by 3 PM.

Welcome to market. Let's go sell this house.

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-4",
    name: "Weekly Tuesday listing update",
    when: "Every Tuesday by 3 PM CT",
    category: "Listing",
    requiresReview: true,
    subject: "{{property_address}} — Weekly Update (Week of {{week_date}})",
    body: `Hi {{seller_first_name}},

Here's where we are after {{days_on_market}} days on market:

  • Showings this week: {{showings_week}} (cumulative: {{showings_total}})
  • Feedback received: {{feedback_count}}
  • Days on Market: {{days_on_market}}

Feedback themes:
{{feedback_themes}}

What's next:
{{next_steps}}

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-5",
    name: "LA recap (Monday)",
    when: "Monday by 5 PM CT",
    category: "Internal",
    requiresReview: true,
    subject: "LA Recap — {{property_address}} — Week of {{week_date}}",
    body: `Hey {{agent_first_name}},

Supra + ShowingTime pull for the week:

  • Showings: {{showings}} | Cancellations: {{cancellations}} | No-shows: {{no_shows}}
  • Feedback: {{feedback_count}} of {{showings}}
  • Themes: {{feedback_themes}}

My read: {{agent_read}}

Client update going out Tuesday by 3 PM unless you want me to hold.

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-6",
    name: "Congrats & What to Expect",
    when: "Within 48 hrs of execution",
    category: "Transaction",
    requiresReview: true,
    subject: "Congrats {{client_first_name}} — Here's What Happens Next for {{property_address}}",
    body: `Hi {{client_first_name}},

Huge congratulations on going under contract on {{property_address}}! I'm Carly Bryant, the Transaction Coordinator working with {{agent_first_name}} from here to closing.

Key dates:
  • Effective Date: {{effective_date}}
  • Option Fee Due: {{option_fee_due}}
  • Earnest Money Due: {{earnest_money_due}}
  • Option Period Ends: {{option_period_end}}
  • Loan Application Due: {{loan_app_due}}
  • Buyer Approval Deadline: {{buyer_approval_due}}
  • Title Commitment Due: {{title_commitment_due}}
  • Closing Date: {{closing_date}}

Weekly updates every Tuesday. Intro emails to lender and title today.

Excited for you. Let's get to closing.

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-7",
    name: "Title + lender intro",
    when: "Within 48 hrs of execution",
    category: "Transaction",
    requiresReview: true,
    subject: "New Contract — {{property_address}} — Closing {{closing_date}} — Please cc TC",
    body: `Hi {{third_party_name}},

Carly Bryant, Transaction Coordinator for {{agent_full_name}} at Keller Williams Realty Austin Northwest.

  • Buyer: {{buyer_names}} | Seller: {{seller_names}}
  • Effective: {{effective_date}} | Closing: {{closing_date}}
  • Title File #: {{title_file_number}} | MLS #: {{mls_number}}

Please cc me on all transaction communications.

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-8",
    name: "Weekly Tuesday transaction update",
    when: "Every Tuesday by 3 PM CT",
    category: "Transaction",
    requiresReview: true,
    subject: "{{property_address}} — Weekly Update — {{days_to_closing}} Days to Closing",
    body: `Hi {{client_first_name}},

  • Closing Date: {{closing_date}} ({{days_to_closing}} days out)
  • Status: {{status_summary}}

Completed:
{{completed_milestones}}

In progress:
{{in_progress_items}}

Action needed: {{action_needed}}

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-9",
    name: "Closing confirmation",
    when: "When title confirms",
    category: "Transaction",
    requiresReview: true,
    subject: "Closing Confirmed — {{property_address}} — {{closing_day}} at {{closing_time}}",
    body: `Hi {{client_first_name}},

Your closing is confirmed!

  • Date: {{closing_day}}
  • Time: {{closing_time}} CT
  • Location: {{title_company}}
  • Closer: {{closer_name}} | {{closer_phone}}

IMPORTANT: Verify wire instructions by PHONE using the closer's number above. Never trust an emailed change of wire instructions.

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-10",
    name: "Post-closing + review",
    when: "Within 24 hrs of funding",
    category: "Transaction",
    requiresReview: true,
    subject: "Congratulations {{client_first_name}} — You're Closed!",
    body: `Hi {{client_first_name}},

Congratulations on closing at {{property_address}}! {{agent_first_name}} and I are so glad we got to work with you.

  • MLS updated to Sold/Closed.
  • Review link: {{review_link}}

Thank you for trusting us.

Carly
{{signature_block}}`,
  },
];

export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id);
}
