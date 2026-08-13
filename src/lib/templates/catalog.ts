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

  • Staging Consultation: We'll start with a staging consultation so your home is styled to show its very best for photos and showings.
  • Photography: I'll coordinate professional photography, completed at least 2 days before your intended "Go Live" date.
  • Sign + Lockbox: {{agent_first_name}} will deliver these prior to the photo session.
  • Disclosures + Notices: I'll help you complete and provide any necessary disclosures and notices — Seller's Disclosure Notice, PID/MUD notices, Survey & T-47, and similar — where applicable.
  • MLS Listing: I'll build your full MLS record and send it to {{agent_first_name}} for review — nothing publishes without your green light.
  • Going Live: Once approved, I'll activate the listing and send you a "We Are Live" email.

Throughout this Make-Ready / Coming Soon process, I'm here to answer any questions you have — so please never hesitate to reach out. {{agent_first_name}} and I are genuinely excited to work with you and to get your home sold.

Looking forward to working with you.

Thank you,
{{signature_block}}`,
  },
  {
    id: "tpl-listing-docs",
    name: "Listing Documents Needed / Survey & T-47",
    when: "At listing intake, after the welcome email",
    category: "Listing",
    requiresReview: true,
    subject: "Documents Needed for {{property_address}}",
    body: `Hi {{seller_first_name}},

As we prepare {{property_address}} for the market, here are the documents and items we need from you:

  • Current survey: Please reply with a clear PDF copy if you have one.
  • T-47 affidavit: If you have a current survey, complete the T-47 using the survey and acquisition date, list any changes to the property (or write NONE), then sign it in wet ink before a notary. The T-47 cannot be electronically signed. If you need a blank form or help finding a notary, let me know.
  • Listing documents: Watch for the Lone Wolf e-sign packet, which may include the Listing Agreement, Information About Brokerage Services, General Notice, Warning Regarding Wire Fraud, and Seller Net Sheet.
  • Seller's Disclosure Notice: Please complete the Sellers Shield questionnaire we send. The optional paid legal-protection upgrade is not required unless you want it.
  • Spare key: Please have a working spare key ready for the lockbox before photography.

Reply here with the survey or any questions. I’m happy to walk you through the T-47 before it is notarized.

Thank you,
{{signature_block}}`,
  },
  {
    id: "tpl-ecad-needed",
    name: "ECAD Audit Needed",
    when: "At intake when the property is in Austin city limits, served by Austin Energy, and at least 10 years old",
    category: "Listing",
    requiresReview: true,
    subject: "ECAD Energy Audit Needed for {{property_address}}",
    body: `Hi {{seller_first_name}},

Because {{property_address}} is within Austin city limits, receives Austin Energy service, and is at least 10 years old, the City of Austin's ECAD ordinance requires an energy audit before the property is sold.

You can schedule the audit with Austin Auditors here:
https://austinauditors.com/book/

Pricing is typically about $159 and up, depending on the property. The report does not need to delay our go-live date, but it must be completed and disclosed before the resale contract is executed.

Please send me the appointment details once scheduled, and forward the completed report when you receive it.

Thank you,
{{signature_block}}`,
  },
  {
    id: "tpl-photoshoot-prep",
    name: "Photoshoot Confirmation & How to Prepare",
    when: "Once photography is scheduled — send 1–2 days before the shoot",
    category: "Listing",
    requiresReview: true,
    subject: "Photoshoot Confirmed — {{property_address}} — {{photo_date}}",
    body: `Hi {{seller_first_name}},

Great news — professional photography for {{property_address}} is confirmed! Photos are one of the biggest drivers of buyer interest, so here's everything you need to have the home camera-ready.

Photoshoot details:

  • Date: {{photo_date}}
  • Time: {{photo_time}}

Our professional photographer will arrive at the scheduled time. To help your home look its absolute best, here's a quick prep checklist:

  Whole home
  • Turn on every light and replace any burnt-out bulbs; open blinds and curtains for natural light.
  • Declutter countertops, floors, and surfaces — less is more on camera.
  • Put away personal items (family photos, mail, calendars) and any valuables.
  • Tuck away cords, chargers, remotes, and visible electronics.
  • Hide trash cans, pet bowls, litter boxes, toys, and crates.

  Kitchen
  • Clear the counters down to one or two decorative items.
  • Remove magnets, notes, and photos from the fridge.
  • Stow dish soap, sponges, and towels.

  Bathrooms
  • Clear counters; stow toiletries, toothbrushes, and trash cans.
  • Close toilet lids, hang fresh towels, and remove floor mats.

  Bedrooms
  • Make the beds with clean, wrinkle-free linens.
  • Clear nightstands and dressers to a minimum.

  Curb appeal
  • Mow, trim, and clear the yard of hoses, tools, and toys.
  • Sweep the walkways and porch; move cars out of the driveway and off the front curb.
  • Bring trash and recycling bins out of view.

A couple of tips: pets are best kept crated or off-site during the shoot, and please have the home fully ready before the photographer arrives so we can stay on schedule.

If anything comes up or you have questions as you prepare, just reach out — I'm happy to help. Can't wait to see how it turns out!

Thank you,
{{signature_block}}`,
  },
  {
    id: "tpl-photoshoot-prep",
    name: "Photoshoot Confirmation & How to Prepare",
    when: "Once photography is scheduled — send 1–2 days before the shoot",
    category: "Listing",
    requiresReview: true,
    subject: "Photoshoot Confirmed — {{property_address}} — {{photo_date}}",
    body: `Hi {{seller_first_name}},

Great news — professional photography for {{property_address}} is confirmed! Photos are one of the biggest drivers of buyer interest, so here's everything you need to have the home camera-ready.

Photoshoot details:

  • Date: {{photo_date}}
  • Time: {{photo_time}}

Our professional photographer will arrive at the scheduled time. To help your home look its absolute best, here's a quick prep checklist:

  Whole home
  • Turn on every light and replace any burnt-out bulbs; open blinds and curtains for natural light.
  • Declutter countertops, floors, and surfaces — less is more on camera.
  • Put away personal items (family photos, mail, calendars) and any valuables.
  • Tuck away cords, chargers, remotes, and visible electronics.
  • Hide trash cans, pet bowls, litter boxes, toys, and crates.

  Kitchen
  • Clear the counters down to one or two decorative items.
  • Remove magnets, notes, and photos from the fridge.
  • Stow dish soap, sponges, and towels.

  Bathrooms
  • Clear counters; stow toiletries, toothbrushes, and trash cans.
  • Close toilet lids, hang fresh towels, and remove floor mats.

  Bedrooms
  • Make the beds with clean, wrinkle-free linens.
  • Clear nightstands and dressers to a minimum.

  Curb appeal
  • Mow, trim, and clear the yard of hoses, tools, and toys.
  • Sweep the walkways and porch; move cars out of the driveway and off the front curb.
  • Bring trash and recycling bins out of view.

A couple of tips: pets are best kept crated or off-site during the shoot, and please have the home fully ready before the photographer arrives so we can stay on schedule.

If anything comes up or you have questions as you prepare, just reach out — I'm happy to help. Can't wait to see how it turns out!

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

  • Showings: Buyer agents request appointments through ShowingTime, the showing management service we use to schedule, confirm, and gather feedback on every visit. I'd recommend downloading the free "Home by ShowingTime" app so you can approve, deny, or reschedule requests right from your phone, see who's coming, and read feedback all in one place. {{showing_instructions}}
      – iPhone / iPad: https://apps.apple.com/us/app/home-by-showingtime/id1433915149
      – Android: https://play.google.com/store/apps/details?id=com.showingtime.ConsumerApp
      – Desktop: https://home.showingtime.com
    Notifications: {{showing_notifications}} When a showing is requested, you'll get a text and/or email so you can confirm, deny, or ask to reschedule — how this works can vary by property type and whether the home is occupied.
  • Showing parameters: {{showing_restrictions}} If there's anything you'd like us to set in ShowingTime — a minimum notice window, specific days or times to block off, or special showing instructions — just let me know and I'll update it right away.
  • Open house: {{open_house_details}}
  • Feedback: I'll send you a weekly summary every Tuesday by 3 PM with showings and themes from buyer agents.

We're thrilled to be under way — let's get this home sold!

Thank you,
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

Thank you,
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

Online exposure:

  • MLS reverse prospecting: {{reverse_prospecting}}
  • Portal views (Zillow/Realtor.com/etc.): {{online_views}}
  • Saves / favorites: {{online_saves}}

Client update going out Tuesday by 3 PM unless you want me to hold.

Thank you,
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

Thank you,
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

Thank you,
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

Thank you,
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

Thank you,
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
