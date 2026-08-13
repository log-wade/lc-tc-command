import { differenceInCalendarDays } from "date-fns";
import { memoryStore } from "../store/memory-store";
import { createServiceClient, isDatabaseConfigured, useMemoryStore } from "../supabase/server";
import type { Deadline, Listing, Transaction } from "../types";
import {
  buildKeyDateRows,
  renderKeyDatesTableHtml,
  renderKeyDatesTableText,
} from "./deadline-table";
import {
  renderTransactionProgress,
  suggestStatusSummary,
  summarizeMilestones,
} from "./progress";

export type EmailContext = Record<string, string | number | undefined>;

type FileMeta = {
  weekly_stats?: {
    showings_week?: string | number;
    showings_total?: string | number;
    feedback_count?: string | number;
    feedback_themes?: string;
    showings?: string | number;
    cancellations?: string | number;
    no_shows?: string | number;
    reverse_prospecting?: string | number;
    online_views?: string | number;
    online_saves?: string | number;
  };
  showing_restrictions?: string;
  showing_notification_preference?: string;
  open_house_details?: string;
  photo_date?: string;
  photo_time?: string;
  seller_first_name?: string;
  seller_preferred_name?: string;
  client_first_name?: string;
  has_hoa?: boolean;
  review_link?: string;
  title_company?: string;
  closer_name?: string;
  closer_phone?: string;
  closing_day?: string;
  closing_time?: string;
  signing_method?: string;
  utilities_reminder?: string;
  final_walkthrough?: string;
  keys_and_access?: string;
  third_party_name?: string;
  status_summary?: string;
  action_needed?: string;
};

function asMeta(raw: unknown): FileMeta {
  if (raw && typeof raw === "object") return raw as FileMeta;
  return {};
}

function notificationCopy(pref?: string): string {
  switch (pref) {
    case "text":
      return "You'll receive showing requests by text.";
    case "email":
      return "You'll receive showing requests by email.";
    case "both":
      return "You'll receive showing requests by text and email.";
    default:
      return "Depending on occupancy and property type, you'll receive showing requests by text and/or email.";
  }
}

async function getAgentName(agentId?: string): Promise<{ first: string; full: string }> {
  if (!agentId) return { first: "your agent", full: "your agent" };

  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase
        .from("agents")
        .select("first_name, last_name")
        .eq("id", agentId)
        .maybeSingle();
      if (data) {
        return {
          first: data.first_name ?? "your agent",
          full: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "your agent",
        };
      }
    }
  }

  const agent = memoryStore.getAgent(agentId);
  if (agent) {
    return {
      first: agent.first_name,
      full: `${agent.first_name} ${agent.last_name}`.trim(),
    };
  }
  return { first: "your agent", full: "your agent" };
}

async function loadDeadlines(fileType: string, fileId: string): Promise<Deadline[]> {
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase
        .from("deadlines")
        .select("*")
        .eq("file_type", fileType)
        .eq("file_id", fileId)
        .order("due_at");
      return (data ?? []) as Deadline[];
    }
  }
  return memoryStore.deadlines(fileType, fileId) as Deadline[];
}

export async function buildListingEmailContext(listing: Listing): Promise<EmailContext> {
  const meta = asMeta((listing as Listing & { metadata?: unknown }).metadata);
  const agent = await getAgentName(listing.listing_agent_id);
  const sellerFirst =
    meta.seller_preferred_name ||
    meta.seller_first_name ||
    "there";

  const listDate = listing.actual_list_date
    ? new Date(listing.actual_list_date)
    : undefined;
  const daysOnMarket = listDate
    ? Math.max(0, differenceInCalendarDays(new Date(), listDate))
    : "";

  const stats = meta.weekly_stats ?? {};
  const showingInstructions =
    (listing as Listing & { showing_instructions?: string }).showing_instructions ||
    "Instructions will be confirmed in ShowingTime.";
  const restrictions =
    meta.showing_restrictions ||
    (listing as Listing & { showing_restrictions?: string }).showing_restrictions ||
    "None noted yet — we can block off any days or times you prefer.";
  const openHouse =
    meta.open_house_details ||
    (listing as Listing & { open_house_details?: string }).open_house_details ||
    "We'll share open house details as soon as they're scheduled.";

  return {
    seller_first_name: sellerFirst,
    property_address: listing.property_address,
    agent_first_name: agent.first,
    agent_full_name: agent.full,
    showing_instructions: showingInstructions,
    showing_restrictions: restrictions,
    showing_notifications: notificationCopy(meta.showing_notification_preference),
    open_house_details: openHouse,
    days_on_market: daysOnMarket,
    showings_week: stats.showings_week ?? "—",
    showings_total: stats.showings_total ?? "—",
    feedback_count: stats.feedback_count ?? "—",
    feedback_themes: stats.feedback_themes || "(none yet — I'll add themes as feedback comes in)",
    showings: stats.showings ?? stats.showings_week ?? "—",
    cancellations: stats.cancellations ?? "—",
    no_shows: stats.no_shows ?? "—",
    reverse_prospecting: stats.reverse_prospecting ?? "—",
    online_views: stats.online_views ?? "—",
    online_saves: stats.online_saves ?? "—",
    photo_date: meta.photo_date || "To be confirmed",
    photo_time: meta.photo_time || "To be confirmed",
    review_link: meta.review_link || "https://g.page/r/review",
  };
}

export async function buildTransactionEmailContext(
  transaction: Transaction
): Promise<EmailContext> {
  const meta = asMeta((transaction as Transaction & { metadata?: unknown }).metadata);
  const agent = await getAgentName(transaction.supervising_agent_id);
  const deadlines = await loadDeadlines("transaction", transaction.id);
  const hasHoa = Boolean(
    (transaction as Transaction & { has_hoa?: boolean }).has_hoa || meta.has_hoa
  );
  const titleCompany =
    meta.title_company ||
    (transaction as Transaction & { title_company_name?: string }).title_company_name;

  const rows = buildKeyDateRows({
    deadlines,
    optionDays: transaction.option_days,
    financingDays: transaction.financing_days,
    hasHoa,
    titleCompany,
  });

  const milestones = summarizeMilestones(deadlines);
  const closing = transaction.closing_date ? new Date(transaction.closing_date) : null;
  const daysToClosing = closing
    ? Math.max(0, differenceInCalendarDays(closing, new Date()))
    : "";

  const clientFirst =
    meta.seller_preferred_name ||
    meta.seller_first_name ||
    meta.client_first_name ||
    "there";

  return {
    client_first_name: typeof clientFirst === "string" ? clientFirst : "there",
    property_address: transaction.property_address,
    agent_first_name: agent.first,
    agent_full_name: agent.full,
    third_party_name: meta.third_party_name || "Team",
    effective_date: transaction.effective_date ?? "",
    closing_date: transaction.closing_date ?? "",
    days_to_closing: daysToClosing,
    key_dates_table: renderKeyDatesTableHtml(rows),
    key_dates_table_text: renderKeyDatesTableText(rows),
    transaction_progress: renderTransactionProgress(deadlines),
    status_summary: meta.status_summary || suggestStatusSummary(deadlines),
    completed_milestones: milestones.completed,
    in_progress_items: milestones.inProgress,
    action_needed: meta.action_needed || milestones.actionNeeded,
    title_company: titleCompany || "Title company (TBD)",
    closer_name: meta.closer_name || "Closer TBD",
    closer_phone: meta.closer_phone || "",
    closing_day: meta.closing_day || transaction.closing_date || "",
    closing_time: meta.closing_time || "TBD",
    signing_method: meta.signing_method || "In person (or mobile notary if arranged)",
    utilities_reminder:
      meta.utilities_reminder ||
      "Please arrange start/stop of utilities with your providers effective on the closing date (or as agreed).",
    final_walkthrough:
      meta.final_walkthrough ||
      "We'll coordinate final walkthrough timing with your agent typically within 1–3 days of closing.",
    keys_and_access:
      meta.keys_and_access ||
      "Keys, remotes, and access devices are typically transferred at closing or per your agent's instructions.",
    review_link: meta.review_link || "https://g.page/r/review",
    title_file_number: transaction.title_file_number ?? "",
    mls_number: transaction.mls_number ?? "",
  };
}

export async function buildEmailContext(
  fileType: string | undefined,
  fileId: string | undefined,
  overrides?: EmailContext
): Promise<EmailContext> {
  let base: EmailContext = {};

  if (fileType === "listing" && fileId) {
    let listing: Listing | null = null;
    if (!useMemoryStore() && isDatabaseConfigured()) {
      const supabase = createServiceClient();
      if (supabase) {
        const { data } = await supabase.from("listings").select("*").eq("id", fileId).single();
        listing = data as Listing | null;
      }
    }
    if (!listing) listing = memoryStore.getListing(fileId) ?? null;
    if (listing) base = await buildListingEmailContext(listing);
  }

  if (fileType === "transaction" && fileId) {
    let transaction: Transaction | null = null;
    if (!useMemoryStore() && isDatabaseConfigured()) {
      const supabase = createServiceClient();
      if (supabase) {
        const { data } = await supabase.from("transactions").select("*").eq("id", fileId).single();
        transaction = data as Transaction | null;
      }
    }
    if (!transaction) transaction = memoryStore.getTransaction(fileId) ?? null;
    if (transaction) base = await buildTransactionEmailContext(transaction);
  }

  return { ...base, ...overrides };
}
