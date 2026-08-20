import { createServiceClient, isDatabaseConfigured, useMemoryStore } from "../supabase/server";
import { fromZonedTime } from "date-fns-tz";
import { DEFAULT_ORG_ID, resolveAgentId } from "../supabase/server-auth";
import { getTemplateById, resolveTemplateId } from "../templates/catalog";
import { fillTemplate } from "../templates/signature";
import { buildEmailContext } from "../templates/build-context";
import { htmlDraftToPlainText } from "../templates/html-draft";
import { resolveSendRecipients } from "../email/recipients";
import { sendEmail } from "../email/resend";
import { recordFileEvent } from "../events/file-events";
import { isEcadRequired } from "../listings/ecad";
import { memoryStore } from "../store/memory-store";
import {
  DEFAULT_FINANCING_DAYS,
  DEFAULT_OPTION_DAYS,
  DEFAULT_SURVEY_DAYS,
  DEFAULT_TITLE_COMMITMENT_DAYS,
  computeTransactionDeadlines,
  deadlinesToRecords,
  introEmailDueBy,
} from "../deadlines/engine";
import { CENTRAL_TZ, isCalendarDate, toCalendarDate } from "../deadlines/calendar";
import { logAudit } from "../audit";
import type { DashboardStats, Deadline, Listing, Transaction } from "../types";

function numberOr(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

function optionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function requireSurveySelection(value: unknown): boolean {
  if (value === true || value === "yes") return true;
  if (value === false || value === "no") return false;
  throw new Error("Select whether an existing survey and T-47 must be delivered");
}

function isYesNoValue(value: unknown): boolean {
  return value === true || value === false || value === "yes" || value === "no";
}

function centralDateTimeIso(date: unknown, time: unknown): string | undefined {
  const hasDate = typeof date === "string" && Boolean(date);
  const hasTime = typeof time === "string" && Boolean(time);
  if (hasDate !== hasTime) {
    throw new Error("Photoshoot date and start time must be provided together");
  }
  if (!hasDate || !hasTime) return undefined;
  return fromZonedTime(`${date}T${time}:00`, CENTRAL_TZ).toISOString();
}

function sameInstant(left?: string, right?: string): boolean {
  if (!left || !right) return left === right;
  return new Date(left).getTime() === new Date(right).getTime();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const [listings, transactions, reviews, deadlines] = await Promise.all([
        supabase.from("listings").select("id, status"),
        supabase.from("transactions").select("id, status"),
        supabase.from("review_queue").select("id").eq("status", "pending"),
        supabase.from("deadlines").select("due_at, status").eq("status", "pending"),
      ]);
      const now = new Date();
      const pending = deadlines.data ?? [];
      return {
        activeListings: (listings.data ?? []).filter((l) =>
          ["active", "coming_soon", "active_option", "active_contingent", "pending"].includes(
            l.status
          )
        ).length,
        activeTransactions: (transactions.data ?? []).filter((t) =>
          ["active", "pending", "intake"].includes(t.status)
        ).length,
        pendingReviews: reviews.data?.length ?? 0,
        overdueDeadlines: pending.filter((d) => new Date(d.due_at) < now).length,
        dueToday: pending.filter((d) => {
          const due = new Date(d.due_at);
          return due.toDateString() === now.toDateString();
        }).length,
        openEscalations: 0,
      };
    }
  }
  return memoryStore.stats();
}

export async function getListings(): Promise<Listing[]> {
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Listing[];
    }
  }
  return memoryStore.listings();
}

export async function getTransactions(): Promise<Transaction[]> {
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as Transaction[];
    }
  }
  return memoryStore.transactions();
}

export async function getListing(id: string): Promise<Listing | null> {
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase.from("listings").select("*").eq("id", id).single();
      return data as Listing | null;
    }
  }
  return memoryStore.getListing(id) ?? null;
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase.from("transactions").select("*").eq("id", id).single();
      return data as Transaction | null;
    }
  }
  return memoryStore.getTransaction(id) ?? null;
}

export async function getDeadlines(fileType?: string, fileId?: string) {
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      let q = supabase.from("deadlines").select("*").order("due_at");
      if (fileType) q = q.eq("file_type", fileType);
      if (fileId) q = q.eq("file_id", fileId);
      const { data } = await q;
      return data ?? [];
    }
  }
  return memoryStore.deadlines(fileType, fileId);
}

/**
 * Mirrors the Supabase order clause below so the memory store and the database agree.
 * Queue order is urgency first, then the order items were created. Items queued as a
 * batch during intake depend on the created_at tiebreak to stay in their intended
 * send order, so this must stay ascending. Keep both in sync.
 */
function compareReviewQueue(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): number {
  const priority = String(a.priority ?? "P2").localeCompare(String(b.priority ?? "P2"));
  if (priority !== 0) return priority;
  return String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
}

export async function getReviewQueue() {
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase
        .from("review_queue")
        .select("*")
        .eq("status", "pending")
        .order("priority", { ascending: true })
        .order("created_at", { ascending: true });
      return data ?? [];
    }
  }
  return memoryStore.reviews().sort(compareReviewQueue);
}

export async function getAuditLogs(limit = 50) {
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      return data ?? [];
    }
  }
  return memoryStore.auditLogs().slice(0, limit);
}

type ReviewQueueItem = {
  file_type: "listing" | "transaction";
  file_id: string;
  item_type: string;
  priority: string;
  title: string;
  payload: Record<string, unknown>;
  due_by?: string;
};

async function queueReview(item: ReviewQueueItem): Promise<void> {
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { error } = await supabase.from("review_queue").insert({
        ...item,
        status: "pending",
        organization_id: DEFAULT_ORG_ID,
      });
      if (error) throw new Error(error.message);
      return;
    }
  }
  memoryStore.addReview(item);
}

async function ensureSellSideTransaction(listing: Listing, agentId: string): Promise<Transaction> {
  const txnData = {
    linked_listing_id: listing.id,
    property_address: listing.property_address,
    side: "sell" as const,
    status: "active" as const,
    mls_number: listing.mls_number,
    supervising_agent_id: listing.listing_agent_id ?? agentId,
    compliance_status: "approved",
    organization_id: DEFAULT_ORG_ID,
  };

  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data: existing } = await supabase
        .from("transactions")
        .select("*")
        .eq("linked_listing_id", listing.id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("transactions")
          .update({ status: "active", property_address: listing.property_address })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as Transaction;
      }

      const { data, error } = await supabase.from("transactions").insert(txnData).select().single();
      if (error) throw new Error(error.message);
      return data as Transaction;
    }
  }

  const existing = memoryStore
    .transactions()
    .find((t) => t.linked_listing_id === listing.id);
  if (existing) {
    return memoryStore.updateTransaction(existing.id, { status: "active" }) ?? existing;
  }

  return memoryStore.createTransaction(txnData);
}

export async function createListingIntake(payload: Record<string, unknown>): Promise<Listing> {
  const sellerPreferred = payload.seller_preferred_name as string | undefined;
  const sellerLegal = payload.seller_legal_name as string | undefined;
  const sellerFirst =
    sellerPreferred ||
    (sellerLegal ? String(sellerLegal).split(/\s+/)[0] : undefined);
  const yearBuilt = optionalNumber(payload.year_built);
  if (!yearBuilt) throw new Error("Year built is required for ECAD screening");
  if (!isYesNoValue(payload.in_austin_city_limits)) {
    throw new Error("Select whether the property is inside Austin city limits");
  }
  if (!isYesNoValue(payload.austin_energy_service)) {
    throw new Error("Select whether Austin Energy serves the property");
  }
  if (!isYesNoValue(payload.survey_on_file)) {
    throw new Error("Select whether the seller has a current survey");
  }
  const inAustinCityLimits =
    payload.in_austin_city_limits === true || payload.in_austin_city_limits === "yes";
  const austinEnergyService =
    payload.austin_energy_service === true || payload.austin_energy_service === "yes";
  const ecadRequired = isEcadRequired({
    yearBuilt,
    inAustinCityLimits,
    austinEnergyService,
  });
  const surveyOnFile = payload.survey_on_file === true || payload.survey_on_file === "yes";
  const photoSessionAt = centralDateTimeIso(payload.photo_date, payload.photo_time);

  const listingData = {
    property_address: String(payload.property_address ?? ""),
    city: payload.city as string | undefined,
    zip: payload.zip as string | undefined,
    county: payload.county as string | undefined,
    list_price: payload.list_price ? Number(payload.list_price) : undefined,
    target_list_date: payload.target_list_date as string | undefined,
    sqft: payload.sqft ? Number(payload.sqft) : undefined,
    beds: payload.beds ? Number(payload.beds) : undefined,
    baths: payload.baths ? Number(payload.baths) : undefined,
    year_built: yearBuilt,
    has_hoa: payload.has_hoa === true || payload.has_hoa === "yes",
    hoa_name: payload.hoa_name as string | undefined,
    mud_pid_sid: payload.mud_pid_sid === true || payload.mud_pid_sid === "yes",
    photo_package: payload.photo_package as string | undefined,
    photo_session_at: photoSessionAt,
    showing_instructions: payload.showing_instructions as string | undefined,
    showing_restrictions: payload.showing_restrictions as string | undefined,
    showing_notification_preference: payload.showing_notification_preference as
      | string
      | undefined,
    open_house_details: payload.open_house_details as string | undefined,
    listing_agent_id: payload.listing_agent_id as string | undefined,
    metadata: {
      seller_first_name: sellerFirst,
      seller_preferred_name: sellerPreferred,
      seller_legal_name: sellerLegal,
      seller_email: payload.seller_email as string | undefined,
      seller_phone: payload.seller_phone as string | undefined,
      in_austin_city_limits: inAustinCityLimits,
      austin_energy_service: austinEnergyService,
      ecad_required: ecadRequired,
      survey_on_file: surveyOnFile,
      t47_status: surveyOnFile ? "needed" : "not_applicable",
      staging_status: payload.staging_status as string | undefined,
      disclosure_status: payload.disclosure_status as string | undefined,
      spare_key_status: payload.spare_key_status as string | undefined,
      photo_date: payload.photo_date as string | undefined,
      photo_time: payload.photo_time as string | undefined,
      showing_restrictions: payload.showing_restrictions as string | undefined,
      showing_notification_preference: payload.showing_notification_preference as
        | string
        | undefined,
      open_house_details: payload.open_house_details as string | undefined,
    },
    status: "intake" as const,
    compliance_status: "pending",
    organization_id: DEFAULT_ORG_ID,
  };

  let listing: Listing;

  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data, error } = await supabase.from("listings").insert(listingData).select().single();
      if (error) throw new Error(error.message);
      listing = data as Listing;
    } else {
      listing = memoryStore.createListing(listingData);
    }
  } else {
    listing = memoryStore.createListing(listingData);
  }

  await logAudit({
    actor_type: "system",
    file_type: "listing",
    file_id: listing.id,
    action_type: "listing_intake_created",
    inputs: payload,
    outcome: "success",
  });

  await recordFileEvent({
    fileType: "listing",
    fileId: listing.id,
    eventType: "listing.created",
    actorType: "system",
    payload: listingData,
  });

  await queueReview({
    file_type: "listing",
    file_id: listing.id,
    item_type: "communication",
    priority: "P1",
    title: `Send Template 1 — Intro email for ${listing.property_address}`,
    payload: { template_id: "tpl-1", listing_id: listing.id },
    due_by: introEmailDueBy().toISOString(),
  });

  await queueReview({
    file_type: "listing",
    file_id: listing.id,
    item_type: "communication",
    priority: "P2",
    title: `Send listing documents / Survey, T-47${ecadRequired ? " & ECAD" : ""} request for ${listing.property_address}`,
    payload: { template_id: "tpl-listing-docs", listing_id: listing.id },
    due_by: introEmailDueBy().toISOString(),
  });

  if (photoSessionAt) {
    const session = new Date(photoSessionAt);
    const twoDaysBefore = new Date(session.getTime() - 48 * 60 * 60 * 1000);
    await queueReview({
      file_type: "listing",
      file_id: listing.id,
      item_type: "communication",
      priority: "P1",
      title: `Send photoshoot confirmation for ${listing.property_address}`,
      payload: { template_id: "tpl-photoshoot-prep", listing_id: listing.id },
      due_by: new Date(Math.max(Date.now(), twoDaysBefore.getTime())).toISOString(),
    });
  }

  return listing;
}

export async function createTransactionIntake(payload: Record<string, unknown>): Promise<Transaction> {
  const effectiveDate = toCalendarDate(String(payload.effective_date));
  const closingDate = toCalendarDate(String(payload.closing_date));
  const optionDays = numberOr(payload.option_days, DEFAULT_OPTION_DAYS);
  const financingDays = numberOr(payload.financing_days, DEFAULT_FINANCING_DAYS);
  const titleCommitmentDays = numberOr(
    payload.title_commitment_days,
    DEFAULT_TITLE_COMMITMENT_DAYS
  );
  const surveyRequired = requireSurveySelection(payload.survey_required);
  const surveyDays = surveyRequired ? numberOr(payload.survey_days, DEFAULT_SURVEY_DAYS) : null;

  const hasHoa = payload.has_hoa === true || payload.has_hoa === "yes";
  const clientFirst =
    (payload.client_first_name as string | undefined) ||
    (payload.buyer_first_name as string | undefined) ||
    (payload.seller_preferred_name as string | undefined);

  const txnData = {
    property_address: String(payload.property_address ?? ""),
    side: (payload.side as "sell" | "buy" | "both") ?? "buy",
    effective_date: effectiveDate,
    closing_date: closingDate,
    option_days: optionDays,
    option_fee_amount: payload.option_fee_amount ? Number(payload.option_fee_amount) : undefined,
    earnest_money_amount: payload.earnest_money_amount
      ? Number(payload.earnest_money_amount)
      : undefined,
    financing_days: financingDays,
    loan_type: payload.loan_type as string | undefined,
    title_file_number: payload.title_file_number as string | undefined,
    mls_number: payload.mls_number as string | undefined,
    supervising_agent_id: payload.supervising_agent_id as string | undefined,
    has_hoa: hasHoa,
    metadata: {
      client_first_name: clientFirst,
      client_email: payload.client_email as string | undefined,
      has_hoa: hasHoa,
      title_company: payload.title_company as string | undefined,
      third_party_name: payload.third_party_name as string | undefined,
      third_party_email: payload.third_party_email as string | undefined,
      title_commitment_days: titleCommitmentDays,
      survey_required: surveyRequired,
      survey_days: surveyDays ?? undefined,
    },
    status: "intake" as const,
    compliance_status: "pending",
    organization_id: DEFAULT_ORG_ID,
  };

  let transaction: Transaction;

  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data, error } = await supabase.from("transactions").insert(txnData).select().single();
      if (error) throw new Error(error.message);
      transaction = data as Transaction;

      const computed = computeTransactionDeadlines({
        transactionId: transaction.id,
        effectiveDate,
        closingDate,
        optionDays,
        financingDays,
        titleCommitmentDays,
        surveyDays,
        hasHoa,
      });
      const records = deadlinesToRecords("transaction", transaction.id, computed);
      await supabase.from("deadlines").insert(records);
    } else {
      transaction = memoryStore.createTransaction(txnData);
    }
  } else {
    transaction = memoryStore.createTransaction(txnData);
    const computed = computeTransactionDeadlines({
      transactionId: transaction.id,
      effectiveDate,
      closingDate,
      optionDays,
      financingDays,
      titleCommitmentDays,
      surveyDays,
      hasHoa,
    });
    memoryStore.createDeadlines(
      deadlinesToRecords("transaction", transaction.id, computed).map((d, i) => ({
        ...d,
        id: `dl-${transaction.id}-${i}`,
      }))
    );
  }

  await logAudit({
    actor_type: "system",
    file_type: "transaction",
    file_id: transaction.id,
    action_type: "transaction_intake_created",
    inputs: payload,
    outcome: "success",
  });

  await recordFileEvent({
    fileType: "transaction",
    fileId: transaction.id,
    eventType: "transaction.created",
    actorType: "system",
    payload: txnData,
  });

  await queueReview({
    file_type: "transaction",
    file_id: transaction.id,
    item_type: "communication",
    priority: "P2",
    title: `Send Template 5 — Congrats & What to Expect for ${transaction.property_address}`,
    payload: { template_id: "tpl-5", transaction_id: transaction.id },
  });

  await queueReview({
    file_type: "transaction",
    file_id: transaction.id,
    item_type: "communication",
    priority: "P2",
    title: `Send Template 6 — Title + lender intro for ${transaction.property_address}`,
    payload: {
      template_id: "tpl-6",
      transaction_id: transaction.id,
      skippable: true,
      skip_reason_hint: "agent_already_sent",
    },
  });

  return transaction;
}

export async function approveGoLive(listingId: string, agentId: string) {
  const resolvedAgentId = resolveAgentId(agentId);
  const listing = await getListing(listingId);
  if (!listing) {
    throw new Error("Listing not found");
  }

  const patch = {
    go_live_approved: true,
    go_live_approved_at: new Date().toISOString(),
    go_live_approved_by: resolvedAgentId,
    status: "active" as const,
    actual_list_date: new Date().toISOString().split("T")[0],
  };

  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { error } = await supabase.from("listings").update(patch).eq("id", listingId);
      if (error) throw new Error(error.message);
    }
  } else if (useMemoryStore()) {
    memoryStore.updateListing(listingId, patch);
  }

  const updatedListing: Listing = { ...listing, ...patch };
  const transaction = await ensureSellSideTransaction(updatedListing, resolvedAgentId);

  await logAudit({
    actor_type: "human",
    actor_id: resolvedAgentId,
    file_type: "listing",
    file_id: listingId,
    action_type: "go_live_approved",
    outcome: "success",
  });

  await recordFileEvent({
    fileType: "transaction",
    fileId: transaction.id,
    eventType: "transaction.created_from_go_live",
    actorType: "human",
    actorId: resolvedAgentId,
    payload: { listing_id: listingId, linked_listing_id: listingId },
  });

  await queueReview({
    file_type: "listing",
    file_id: listingId,
    item_type: "go_live",
    priority: "P2",
    title: "Send Template 2 — We Are Live",
    payload: { template_id: "tpl-2", listing_id: listingId },
  });

  return { listing: updatedListing, transaction };
}

export async function updateListingWeeklyStats(
  listingId: string,
  stats: Record<string, unknown>
): Promise<Listing | null> {
  const listing = await getListing(listingId);
  if (!listing) return null;

  const prevMeta = listing.metadata ?? {};
  const openHouseDetails =
    typeof stats.open_house_details === "string"
      ? stats.open_house_details
      : typeof prevMeta.open_house_details === "string"
        ? prevMeta.open_house_details
        : undefined;

  const metadata = {
    ...prevMeta,
    weekly_stats: {
      ...(prevMeta.weekly_stats ?? {}),
      showings_week: stats.showings_week as string | number | undefined,
      showings_total: stats.showings_total as string | number | undefined,
      feedback_count: stats.feedback_count as string | number | undefined,
      feedback_themes: stats.feedback_themes as string | undefined,
      showings: stats.showings as string | number | undefined,
      cancellations: stats.cancellations as string | number | undefined,
      no_shows: stats.no_shows as string | number | undefined,
      reverse_prospecting: stats.reverse_prospecting as string | number | undefined,
      online_views: stats.online_views as string | number | undefined,
      online_saves: stats.online_saves as string | number | undefined,
    },
    open_house_details: openHouseDetails,
  };

  const patch = {
    metadata,
    open_house_details: openHouseDetails,
  };

  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("listings")
        .update(patch)
        .eq("id", listingId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Listing;
    }
  }

  return memoryStore.updateListing(listingId, patch) ?? null;
}

export async function updateListingPreparation(
  listingId: string,
  input: Record<string, unknown>
): Promise<Listing | null> {
  const listing = await getListing(listingId);
  if (!listing) return null;

  const yearBuilt = optionalNumber(input.year_built) ?? listing.year_built;
  if (!yearBuilt) throw new Error("Year built is required for ECAD screening");
  if (!isYesNoValue(input.in_austin_city_limits)) {
    throw new Error("Select whether the property is inside Austin city limits");
  }
  if (!isYesNoValue(input.austin_energy_service)) {
    throw new Error("Select whether Austin Energy serves the property");
  }
  if (!isYesNoValue(input.survey_on_file)) {
    throw new Error("Select whether the seller has a current survey");
  }
  const inAustinCityLimits =
    input.in_austin_city_limits === true || input.in_austin_city_limits === "yes";
  const austinEnergyService =
    input.austin_energy_service === true || input.austin_energy_service === "yes";
  const ecadRequired = isEcadRequired({
    yearBuilt,
    inAustinCityLimits,
    austinEnergyService,
  });
  const surveyOnFile = input.survey_on_file === true || input.survey_on_file === "yes";
  const photoSessionAt = centralDateTimeIso(input.photo_date, input.photo_time);
  const photoChanged = !sameInstant(photoSessionAt, listing.photo_session_at);
  const ecadBecameRequired = ecadRequired && listing.metadata?.ecad_required !== true;

  const metadata = {
    ...(listing.metadata ?? {}),
    in_austin_city_limits: inAustinCityLimits,
    austin_energy_service: austinEnergyService,
    ecad_required: ecadRequired,
    survey_on_file: surveyOnFile,
    t47_status: surveyOnFile ? String(input.t47_status || "needed") : "not_applicable",
    staging_status: String(input.staging_status || "needed"),
    disclosure_status: String(input.disclosure_status || "needed"),
    spare_key_status: String(input.spare_key_status || "needed"),
    photo_date: typeof input.photo_date === "string" ? input.photo_date : undefined,
    photo_time: typeof input.photo_time === "string" ? input.photo_time : undefined,
  };
  const patch: Partial<Listing> = {
    year_built: yearBuilt,
    photo_session_at: photoSessionAt,
    metadata,
  };

  let updated: Listing | null = null;
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("listings")
        .update(patch)
        .eq("id", listingId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      updated = data as Listing;
    }
  }
  if (!updated) updated = memoryStore.updateListing(listingId, patch);
  if (!updated) return null;

  if (ecadBecameRequired) {
    await queueReview({
      file_type: "listing",
      file_id: listingId,
      item_type: "communication",
      priority: "P1",
      title: `Send ECAD audit notice for ${updated.property_address}`,
      payload: { template_id: "tpl-ecad-needed", listing_id: listingId },
      due_by: introEmailDueBy().toISOString(),
    });
  }

  if (photoChanged && photoSessionAt) {
    const session = new Date(photoSessionAt);
    const twoDaysBefore = new Date(session.getTime() - 48 * 60 * 60 * 1000);
    await queueReview({
      file_type: "listing",
      file_id: listingId,
      item_type: "communication",
      priority: "P1",
      title: `Send photoshoot confirmation for ${updated.property_address}`,
      payload: { template_id: "tpl-photoshoot-prep", listing_id: listingId },
      due_by: new Date(Math.max(Date.now(), twoDaysBefore.getTime())).toISOString(),
    });
  }

  await recordFileEvent({
    fileType: "listing",
    fileId: listingId,
    eventType: "listing.preparation_updated",
    actorType: "system",
    payload: patch,
  });

  return updated;
}

async function mergeTransactionMetadata(
  transactionId: string,
  patch: Record<string, unknown>
): Promise<Transaction | null> {
  const txn = await getTransaction(transactionId);
  if (!txn) return null;

  const metadata = {
    ...(txn.metadata ?? {}),
    ...patch,
  };

  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("transactions")
        .update({ metadata })
        .eq("id", transactionId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Transaction;
    }
  }

  return memoryStore.updateTransaction(transactionId, { metadata }) ?? null;
}

export async function updateTransactionWeeklyNotes(
  transactionId: string,
  notes: Record<string, unknown>
): Promise<Transaction | null> {
  return mergeTransactionMetadata(transactionId, notes);
}

const CLOSING_PREP_KEYS = [
  "closing_day",
  "closing_time",
  "signing_method",
  "utilities_reminder",
  "final_walkthrough",
  "keys_and_access",
  "closer_name",
  "closer_phone",
  "title_company",
] as const;

export async function updateTransactionClosingPrep(
  transactionId: string,
  prep: Record<string, unknown>
): Promise<Transaction | null> {
  const patch: Record<string, unknown> = {};
  for (const key of CLOSING_PREP_KEYS) {
    if (key in prep && typeof prep[key] === "string") {
      patch[key] = prep[key];
    }
  }
  return mergeTransactionMetadata(transactionId, patch);
}

export type ContractTermsInput = {
  effective_date?: string;
  closing_date?: string;
  option_days?: string | number;
  financing_days?: string | number;
  title_commitment_days?: string | number;
  survey_required?: string | boolean;
  survey_days?: string | number;
  option_fee_amount?: string | number;
  earnest_money_amount?: string | number;
  loan_type?: string;
  title_file_number?: string;
};

/**
 * Updates the contract terms the deadline engine reads, then recomputes the
 * timeline so an executed amendment only has to be entered once.
 */
export async function updateTransactionContractTerms(
  transactionId: string,
  input: ContractTermsInput
): Promise<{ transaction: Transaction; replaced: number; kept: number } | null> {
  const txn = await getTransaction(transactionId);
  if (!txn) return null;

  const effectiveDate = input.effective_date?.trim() || txn.effective_date;
  const closingDate = input.closing_date?.trim() || txn.closing_date;
  if (!effectiveDate || !closingDate) {
    throw new Error("Effective date and closing date are both required");
  }
  if (!isCalendarDate(effectiveDate) || !isCalendarDate(closingDate)) {
    throw new Error("Dates must be calendar dates (YYYY-MM-DD)");
  }
  if (closingDate < effectiveDate) {
    throw new Error("Closing date cannot be before the effective date");
  }

  const surveyRequired = requireSurveySelection(input.survey_required);
  const patch: Record<string, unknown> = {
    effective_date: effectiveDate,
    closing_date: closingDate,
    option_days: numberOr(input.option_days, txn.option_days ?? DEFAULT_OPTION_DAYS),
    financing_days: numberOr(input.financing_days, txn.financing_days ?? DEFAULT_FINANCING_DAYS),
    option_fee_amount: optionalNumber(input.option_fee_amount) ?? txn.option_fee_amount ?? null,
    earnest_money_amount:
      optionalNumber(input.earnest_money_amount) ?? txn.earnest_money_amount ?? null,
    loan_type: input.loan_type?.trim() || txn.loan_type || null,
    title_file_number: input.title_file_number?.trim() || txn.title_file_number || null,
    metadata: {
      ...(txn.metadata ?? {}),
      title_commitment_days: numberOr(
        input.title_commitment_days,
        txn.metadata?.title_commitment_days ?? DEFAULT_TITLE_COMMITMENT_DAYS
      ),
      survey_required: surveyRequired,
      survey_days: surveyRequired
        ? numberOr(input.survey_days, txn.metadata?.survey_days ?? DEFAULT_SURVEY_DAYS)
        : undefined,
    },
  };

  let transaction: Transaction | null = null;

  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("transactions")
        .update(patch)
        .eq("id", transactionId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      transaction = data as Transaction;
    }
  }
  if (!transaction) {
    transaction = memoryStore.updateTransaction(transactionId, patch as Partial<Transaction>);
  }
  if (!transaction) return null;

  await logAudit({
    actor_type: "system",
    file_type: "transaction",
    file_id: transactionId,
    action_type: "transaction_contract_terms_updated",
    inputs: patch,
    outcome: "success",
  });

  await recordFileEvent({
    fileType: "transaction",
    fileId: transactionId,
    eventType: "transaction.contract_terms_updated",
    actorType: "system",
    payload: patch,
  });

  const recomputed = await recomputeTransactionDeadlines(transactionId);

  return {
    transaction,
    replaced: recomputed?.replaced ?? 0,
    kept: recomputed?.kept ?? 0,
  };
}

/**
 * Re-runs the deadline engine against the transaction's current contract terms.
 * Deadlines already marked met/missed/waived are left alone so completion
 * history survives; only pending rows are replaced.
 */
export async function recomputeTransactionDeadlines(
  transactionId: string
): Promise<{ replaced: number; kept: number } | null> {
  const txn = await getTransaction(transactionId);
  if (!txn) return null;
  if (!txn.effective_date || !txn.closing_date) {
    throw new Error("Transaction needs an effective date and closing date");
  }

  const existing = (await getDeadlines("transaction", transactionId)) as Deadline[];
  const preservedTypes = new Set(
    existing
      .filter((d) => d.status === "met" || d.status === "waived")
      .map((d) => d.deadline_type)
  );

  if (typeof txn.metadata?.survey_required !== "boolean") {
    throw new Error(
      "Set the survey / T-47 terms in Edit contract terms before recomputing this legacy file"
    );
  }
  const surveyRequired = txn.metadata.survey_required;
  const computed = computeTransactionDeadlines({
    transactionId,
    effectiveDate: txn.effective_date,
    closingDate: txn.closing_date,
    optionDays: numberOr(txn.option_days, DEFAULT_OPTION_DAYS),
    financingDays: numberOr(txn.financing_days, DEFAULT_FINANCING_DAYS),
    titleCommitmentDays: numberOr(
      txn.metadata?.title_commitment_days,
      DEFAULT_TITLE_COMMITMENT_DAYS
    ),
    surveyDays: surveyRequired ? numberOr(txn.metadata?.survey_days, DEFAULT_SURVEY_DAYS) : null,
    hasHoa: txn.has_hoa ?? txn.metadata?.has_hoa,
  }).filter((c) => !preservedTypes.has(c.deadline_type));

  const records = deadlinesToRecords("transaction", transactionId, computed);

  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { error } = await supabase.rpc("replace_transaction_deadlines", {
        p_file_id: transactionId,
        p_deadlines: records.map((record) => ({
          deadline_type: record.deadline_type,
          label: record.label,
          due_at: record.due_at,
          status: record.status,
        })),
      });
      if (error) throw new Error(error.message);
    }
  } else {
    memoryStore.deleteReplaceableDeadlines("transaction", transactionId);
    memoryStore.createDeadlines(
      records.map((d, i) => ({ ...d, id: `dl-${transactionId}-r${Date.now()}-${i}` }))
    );
  }

  await logAudit({
    actor_type: "system",
    file_type: "transaction",
    file_id: transactionId,
    action_type: "transaction_deadlines_recomputed",
    inputs: { effective_date: txn.effective_date, closing_date: txn.closing_date },
    outcome: "success",
  });

  return { replaced: records.length, kept: preservedTypes.size };
}

async function loadRecipientFields(
  fileType: string | undefined,
  fileId: string | undefined
): Promise<{
  sellerEmail?: string;
  clientEmail?: string;
  thirdPartyEmail?: string;
  agentEmail?: string;
}> {
  if (!fileType || !fileId) return {};

  if (fileType === "listing") {
    let listing: Listing | null = null;
    if (!useMemoryStore() && isDatabaseConfigured()) {
      const supabase = createServiceClient();
      if (supabase) {
        const { data } = await supabase.from("listings").select("*").eq("id", fileId).single();
        listing = data as Listing | null;
      }
    }
    if (!listing) listing = memoryStore.getListing(fileId) ?? null;
    if (!listing) return {};

    const meta = (listing.metadata ?? {}) as Record<string, unknown>;
    const agentId = listing.listing_agent_id;
    let agentEmail: string | undefined;
    if (agentId) {
      if (!useMemoryStore() && isDatabaseConfigured()) {
        const supabase = createServiceClient();
        if (supabase) {
          const { data } = await supabase
            .from("agents")
            .select("email")
            .eq("id", agentId)
            .maybeSingle();
          agentEmail = data?.email as string | undefined;
        }
      }
      if (!agentEmail) agentEmail = memoryStore.getAgent(agentId)?.email;
    }

    return {
      sellerEmail:
        typeof meta.seller_email === "string" ? meta.seller_email : undefined,
      agentEmail,
    };
  }

  if (fileType === "transaction") {
    let transaction: Transaction | null = null;
    if (!useMemoryStore() && isDatabaseConfigured()) {
      const supabase = createServiceClient();
      if (supabase) {
        const { data } = await supabase
          .from("transactions")
          .select("*")
          .eq("id", fileId)
          .single();
        transaction = data as Transaction | null;
      }
    }
    if (!transaction) transaction = memoryStore.getTransaction(fileId) ?? null;
    if (!transaction) return {};

    const meta = (transaction.metadata ?? {}) as Record<string, unknown>;
    const agentId = transaction.supervising_agent_id;
    let agentEmail: string | undefined;
    if (agentId) {
      if (!useMemoryStore() && isDatabaseConfigured()) {
        const supabase = createServiceClient();
        if (supabase) {
          const { data } = await supabase
            .from("agents")
            .select("email")
            .eq("id", agentId)
            .maybeSingle();
          agentEmail = data?.email as string | undefined;
        }
      }
      if (!agentEmail) agentEmail = memoryStore.getAgent(agentId)?.email;
    }

    return {
      clientEmail:
        typeof meta.client_email === "string" ? meta.client_email : undefined,
      thirdPartyEmail:
        typeof meta.third_party_email === "string"
          ? meta.third_party_email
          : undefined,
      agentEmail,
    };
  }

  return {};
}

export async function resolveReview(
  reviewId: string,
  approved: boolean,
  notes?: string,
  draftOverrides?: { subject?: string; body?: string }
) {
  let reviewPayload: Record<string, unknown> | undefined;
  let fileType: string | undefined;
  let fileId: string | undefined;

  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data: review } = await supabase
        .from("review_queue")
        .select("*")
        .eq("id", reviewId)
        .single();

      reviewPayload = (review?.payload as Record<string, unknown>) ?? undefined;
      fileType = review?.file_type as string | undefined;
      fileId = review?.file_id as string | undefined;

      await supabase
        .from("review_queue")
        .update({
          status: approved ? "approved" : "rejected",
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq("id", reviewId);
    }
  } else if (useMemoryStore()) {
    const review = memoryStore.reviews().find((r) => r.id === reviewId);
    reviewPayload = review?.payload as Record<string, unknown> | undefined;
    fileType = review?.file_type as string | undefined;
    fileId = review?.file_id as string | undefined;
    memoryStore.resolveReview(reviewId, approved, notes);
  }

  if (approved && reviewPayload?.template_id) {
    const templateId = resolveTemplateId(String(reviewPayload.template_id));
    const template = getTemplateById(templateId);
    if (!template) {
      await logAudit({
        actor_type: "system",
        action_type: "email_send_skipped",
        inputs: { reviewId, templateId, reason: "template_not_found" },
        outcome: "failure",
      });
    } else {
      const recipientFields = await loadRecipientFields(fileType, fileId);
      const recipients = resolveSendRecipients({
        template,
        sellerEmail: recipientFields.sellerEmail,
        clientEmail: recipientFields.clientEmail,
        thirdPartyEmail: recipientFields.thirdPartyEmail,
        agentEmail: recipientFields.agentEmail,
        alertEmail: process.env.ALERT_EMAIL,
      });

      if (recipients.to.length === 0) {
        await logAudit({
          actor_type: "system",
          action_type: "email_send_skipped",
          inputs: {
            reviewId,
            templateId: template.id,
            reason: recipients.reason ?? "no recipients resolved",
          },
          outcome: "failure",
        });
      } else {
        const ctx = await buildEmailContext(fileType, fileId);
        const subject =
          draftOverrides?.subject ??
          (typeof reviewPayload.draft_subject === "string"
            ? reviewPayload.draft_subject
            : fillTemplate(template.subject, ctx));
        const authoredBody =
          draftOverrides?.body ??
          (typeof reviewPayload.draft === "string" ? reviewPayload.draft : undefined);
        const textCtx = {
          ...ctx,
          key_dates_table: String(ctx.key_dates_table_text ?? ctx.key_dates_table ?? ""),
        };
        const htmlBody = authoredBody ?? fillTemplate(template.body, ctx);
        // An authored body carries the HTML table, so the text part is derived from it
        // rather than reused verbatim — otherwise recipients see raw table markup.
        const textBody = authoredBody
          ? htmlDraftToPlainText(authoredBody)
          : fillTemplate(template.body, textCtx);
        await sendEmail({
          to: recipients.to,
          cc: recipients.cc.length > 0 ? recipients.cc : undefined,
          subject,
          body: textBody,
          html: htmlBody !== textBody ? htmlBody : undefined,
          fileType,
          fileId,
          templateId: template.id,
        });
        if (recipients.usedAlertFallback) {
          await logAudit({
            actor_type: "system",
            action_type: "email_recipient_fallback",
            inputs: {
              reviewId,
              templateId: template.id,
              to: recipients.to,
              reason: recipients.reason,
            },
            outcome: "success",
          });
        }
      }
    }
  }

  if (fileId && fileType && (fileType === "listing" || fileType === "transaction")) {
    await recordFileEvent({
      fileType,
      fileId,
      eventType: approved
        ? "review.approved"
        : notes === "agent_already_sent"
          ? "review.skipped"
          : "review.rejected",
      actorType: "human",
      payload: { reviewId, notes },
    });
  }

  await logAudit({
    actor_type: "human",
    action_type: approved
      ? "review_approved"
      : notes === "agent_already_sent"
        ? "review_skipped"
        : "review_rejected",
    inputs: { reviewId, notes },
    outcome: "success",
  });
}
