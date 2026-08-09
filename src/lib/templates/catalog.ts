export type EmailTemplate = {
  id: string;
  name: string;
  when: string;
  category: "Listing" | "Transaction" | "Internal";
  subject: string;
  body: string;
  requiresReview: boolean;
};

/**
 * Only IDs that no longer exist can be aliased safely.
 * tpl-3…tpl-9 were reused after renumbering. Migration 005 remaps only when tpl-10
 * still exists; 006 upserts content without remapping (greenfield-safe).
 */
const LEGACY_TEMPLATE_IDS: Record<string, string> = {
  "tpl-10": "tpl-9",
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-1",
    name: "Listing intro / What to Expect",
    when: "Within 24 hours of intake, or by end of next business day if intake is received on a weekend",
    category: "Listing",
    requiresReview: true,
    subject: "Welcome {{seller_first_name}} — Here's What to Expect for {{property_address}}",
    body: `Hi {{seller_first_name}},

Welcome! I'm Carly, the Listing Coordinator working with {{agent_first_name}} on the sale of {{property_address}}. My job is to handle the operational moving parts so {{agent_first_name}} can stay focused on you, your goals, and getting your home sold.

Here's the short version of what to expect over the next 7–10 days:

  • Photography: I'll coordinate professional photography this week.
  • Sign + Lockbox: {{agent_first_name}} will deliver these prior to the photo session.
  • MLS Listing: I'll build your full MLS record and send it to {{agent_first_name}} for review — nothing publishes without your green light.
  • Going Live: Once approved, I'll activate the listing and send you a "We Are Live" email.
  • Showings + Feedback: Weekly updates every Tuesday by 3 PM.

If anything comes up, reach me at the number below — Mon–Fri, 9 to 5. For urgent matters outside those hours, {{agent_first_name}} is your first call.

Looking forward to working with you.

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-2",
    name: "We Are Live",
    when: "Immediately after MLS publish, or the following morning if approval arrives after business hours",
    category: "Listing",
    requiresReview: true,
    subject: "We're Live — {{property_address}} is on the Market!",
    body: `Hi {{seller_first_name}},

Exciting news — {{property_address}} is LIVE on the market! Buyers can find it on MLS and the major real estate sites starting now. We're so glad to have your home out there and ready for showings.

Here's what to know:

  • Showings: Buyer agents request appointments through ShowingTime. {{showing_instructions}}
  • Showing restrictions: {{showing_restrictions}} If you already know days or times you need blocked off (or want to add any), just let me know and I'll update ShowingTime right away.
  • Notifications: {{showing_notifications}} When a showing is requested, you'll typically get a text and/or email from the showing service so you can confirm, deny, or ask to reschedule — this can vary by property type and whether the home is occupied.
  • Open house: {{open_house_details}}
  • Feedback: I'll send you a weekly summary every Tuesday by 3 PM with showings and themes from buyer agents.

We're thrilled to be under way — let's get this home sold!

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-3",
    name: "Weekly Tuesday listing update",
    when: "Every Tuesday by 3 PM CT",
    category: "Listing",
    requiresReview: true,
    subject: "{{property_address}} — Weekly Listing Update",
    body: `Hi {{seller_first_name}},

Here's where we are after {{days_on_market}} days on market:

  • Showings this week: {{showings_week}} (cumulative: {{showings_total}})
  • Feedback received: {{feedback_count}}

Feedback themes:
{{feedback_themes}}

As always, {{agent_first_name}} and I are watching activity closely and are here if you have questions. Reach out anytime — we're glad to be in your corner this week.

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-4",
    name: "LA recap (Monday)",
    when: "Monday by 5 PM CT",
    category: "Internal",
    requiresReview: true,
    subject: "Listing Activity — {{property_address}}",
    body: `Hey {{agent_first_name}},

Supra + ShowingTime pull for the week:

  • Showings: {{showings}} | Cancellations: {{cancellations}} | No-shows: {{no_shows}}
  • Feedback: {{feedback_count}} of {{showings}}
  • Themes: {{feedback_themes}}

Client update going out Tuesday by 3 PM unless you want me to hold.

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-5",
    name: "Congrats & What to Expect",
    when: "Within 48 hrs of execution",
    category: "Transaction",
    requiresReview: true,
    subject: "What Happens Next — {{property_address}}",
    body: `Hi {{client_first_name}},

Huge congratulations on going under contract on {{property_address}}! I'm Carly, the Transaction Coordinator working with {{agent_first_name}} from here to closing. I'll keep the deadlines, documents, and third-party coordination moving so you can focus on the exciting parts.

Here are your key dates and responsibilities:

{{key_dates_table}}

As we move through the transaction, you'll hear from me every Tuesday with a short weekly update on where things stand and what's coming up next.

I know there's a lot of moving parts, but we're so excited for you and are here to help every step of the way — now let's get to closing!

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-6",
    name: "Title + lender intro",
    when: "Within 48 hrs of execution (skip if agent already sent executed contract and CC'd TC)",
    category: "Transaction",
    requiresReview: true,
    subject: "New Contract — {{property_address}} — {{agent_first_name}}",
    body: `Hi {{third_party_name}},

I'm Carly, transaction coordinator for the Do Kind Group, and I'll be assisting {{agent_first_name}} with this new contract for {{property_address}} — executed documents attached below.

Please confirm receipt and kindly CC me on all transaction communications. Looking forward to working with you all — let's get this bad boy to the closing table! Wahoo.

Thanks,
Carly
{{signature_block}}`,
  },
  {
    id: "tpl-7",
    name: "Weekly Tuesday transaction update",
    when: "Every Tuesday by 3 PM CT. Status examples: \"In option period — survey ordered, title commitment expected Mar 12\" or \"Clear to close — final walkthrough scheduled, CD issued.\"",
    category: "Transaction",
    requiresReview: true,
    subject: "{{property_address}} — Weekly Update — {{days_to_closing}} Days to Closing",
    body: `Hi {{client_first_name}},

Quick check-in on {{property_address}} as we head toward closing — here's this week's snapshot:

{{transaction_progress}}

  • Closing Date: {{closing_date}} ({{days_to_closing}} days out)
  • Status: {{status_summary}}

Completed:
{{completed_milestones}}

In progress:
{{in_progress_items}}

Action needed: {{action_needed}}

As always, {{agent_first_name}} and I are here if anything comes up. Talk soon!

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-8",
    name: "Closing confirmation",
    when: "After signing time is coordinated with title (~1 week before contractual close)",
    category: "Transaction",
    requiresReview: true,
    subject: "Closing Confirmed — {{property_address}} — {{closing_day}} at {{closing_time}}",
    body: `Hi {{client_first_name}},

Your closing is confirmed!

  • Date: {{closing_day}}
  • Time: {{closing_time}} CT
  • Location: {{title_company}}
  • Closer: {{closer_name}} | {{closer_phone}}
  • Signing method: {{signing_method}}

A few reminders as we wrap up:

  • Utilities: {{utilities_reminder}}
  • Final walkthrough: {{final_walkthrough}}
  • Keys & remotes: {{keys_and_access}}

IMPORTANT: Verify wire instructions by PHONE using the closer's number above. Never trust an emailed change of wire instructions.

We're almost there — looking forward to celebrating with you at the closing table!

Carly
{{signature_block}}`,
  },
  {
    id: "tpl-9",
    name: "Post-closing + review",
    when: "Within 24 hrs of funding",
    category: "Transaction",
    requiresReview: true,
    subject: "Congratulations {{client_first_name}} — You're Closed!",
    body: `Hi {{client_first_name}},

Congratulations on closing at {{property_address}}! {{agent_first_name}} and I are so glad we got to walk this journey with you — from contract to keys, it's been a pleasure.

If you have a moment, we'd be honored if you'd share your experience. A quick Google review helps other families find our team, and it means the world to us:

{{review_link}}

Thank you again for trusting us with one of life's biggest milestones. We're cheering you on in this next chapter — and we're only a call or text away if you ever need anything.

With gratitude,
Carly
{{signature_block}}`,
  },
];

export function resolveTemplateId(id: string): string {
  return LEGACY_TEMPLATE_IDS[id] ?? id;
}

export function getTemplateById(id: string): EmailTemplate | undefined {
  const resolved = resolveTemplateId(id);
  return EMAIL_TEMPLATES.find((t) => t.id === resolved);
}
