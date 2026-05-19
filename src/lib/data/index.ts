import { createServiceClient, isDatabaseConfigured, useMemoryStore } from "../supabase/server";
import { DEFAULT_ORG_ID } from "../supabase/server-auth";
import { getTemplateById } from "../templates/catalog";
import { sendEmail } from "../email/resend";
import { recordFileEvent } from "../events/file-events";
import { memoryStore } from "../store/memory-store";
import {
  computeTransactionDeadlines,
  deadlinesToRecords,
} from "../deadlines/engine";
import { logAudit } from "../audit";
import type { DashboardStats, Listing, Transaction } from "../types";

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

export async function getReviewQueue() {
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase
        .from("review_queue")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data ?? [];
    }
  }
  return memoryStore.reviews();
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

export async function createListingIntake(payload: Record<string, unknown>): Promise<Listing> {
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
    has_hoa: payload.has_hoa === true || payload.has_hoa === "yes",
    hoa_name: payload.hoa_name as string | undefined,
    mud_pid_sid: payload.mud_pid_sid === true || payload.mud_pid_sid === "yes",
    photo_package: payload.photo_package as string | undefined,
    showing_instructions: payload.showing_instructions as string | undefined,
    listing_agent_id: payload.listing_agent_id as string | undefined,
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

  memoryStore.addReview({
    file_type: "listing",
    file_id: listing.id,
    item_type: "communication",
    priority: "P2",
    title: `Send Template 1 — Intro email for ${listing.property_address}`,
    payload: { template_id: "tpl-1", listing_id: listing.id },
  });

  return listing;
}

export async function createTransactionIntake(payload: Record<string, unknown>): Promise<Transaction> {
  const effectiveDate = new Date(String(payload.effective_date));
  const closingDate = new Date(String(payload.closing_date));
  const optionDays = Number(payload.option_days ?? 10);
  const financingDays = Number(payload.financing_days ?? 21);

  const txnData = {
    property_address: String(payload.property_address ?? ""),
    side: (payload.side as "sell" | "buy" | "both") ?? "buy",
    effective_date: payload.effective_date as string,
    closing_date: payload.closing_date as string,
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

  memoryStore.addReview({
    file_type: "transaction",
    file_id: transaction.id,
    item_type: "communication",
    priority: "P2",
    title: `Send Template 6 — Congrats & What to Expect for ${transaction.property_address}`,
    payload: { template_id: "tpl-6", transaction_id: transaction.id },
  });

  return transaction;
}

export async function approveGoLive(listingId: string, agentId: string) {
  const patch = {
    go_live_approved: true,
    go_live_approved_at: new Date().toISOString(),
    go_live_approved_by: agentId,
    status: "active" as const,
    actual_list_date: new Date().toISOString().split("T")[0],
  };

  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      await supabase.from("listings").update(patch).eq("id", listingId);
    }
  } else if (useMemoryStore()) {
    memoryStore.updateListing(listingId, patch);
  }

  await logAudit({
    actor_type: "human",
    actor_id: agentId,
    file_type: "listing",
    file_id: listingId,
    action_type: "go_live_approved",
    outcome: "success",
  });

  memoryStore.addReview({
    file_type: "listing",
    file_id: listingId,
    item_type: "communication",
    priority: "P2",
    title: "Send Template 3 — We Are Live",
    payload: { template_id: "tpl-3", listing_id: listingId },
  });
}

export async function resolveReview(reviewId: string, approved: boolean, notes?: string) {
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
    const template = getTemplateById(String(reviewPayload.template_id));
    const alertTo = process.env.ALERT_EMAIL;
    if (template && alertTo) {
      await sendEmail({
        to: [alertTo],
        subject: template.subject,
        body: template.body,
        fileType,
        fileId,
        templateId: template.id,
      });
    }
  }

  if (fileId && fileType && (fileType === "listing" || fileType === "transaction")) {
    await recordFileEvent({
      fileType,
      fileId,
      eventType: approved ? "review.approved" : "review.rejected",
      actorType: "human",
      payload: { reviewId, notes },
    });
  }

  await logAudit({
    actor_type: "human",
    action_type: approved ? "review_approved" : "review_rejected",
    inputs: { reviewId, notes },
    outcome: "success",
  });
}
