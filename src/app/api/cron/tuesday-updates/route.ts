import { NextResponse } from "next/server";
import { getListings, getTransactions } from "@/lib/data";
import { getTemplateById } from "@/lib/templates/catalog";
import { fillTemplate } from "@/lib/templates/signature";
import { buildListingEmailContext, buildTransactionEmailContext } from "@/lib/templates/build-context";
import { logAudit } from "@/lib/audit";
import { memoryStore } from "@/lib/store/memory-store";
import { createServiceClient, isDatabaseConfigured, useMemoryStore } from "@/lib/supabase/server";
import { DEFAULT_ORG_ID } from "@/lib/supabase/server-auth";

async function queueReviewItem(item: {
  file_type: "listing" | "transaction";
  file_id: string;
  item_type: string;
  priority: string;
  title: string;
  payload: Record<string, unknown>;
}) {
  if (!useMemoryStore() && isDatabaseConfigured()) {
    const supabase = createServiceClient();
    if (supabase) {
      await supabase.from("review_queue").insert({
        ...item,
        status: "pending",
        organization_id: DEFAULT_ORG_ID,
      });
      return;
    }
  }
  memoryStore.addReview(item);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await getListings();
  const transactions = await getTransactions();
  const activeListings = listings.filter((l) =>
    ["active", "coming_soon", "active_option"].includes(l.status)
  );
  const activeTxns = transactions.filter((t) => ["active", "pending"].includes(t.status));

  let queued = 0;

  const listingTpl = getTemplateById("tpl-3");
  for (const l of activeListings) {
    const ctx = await buildListingEmailContext(l);
    const draftSubject = listingTpl
      ? fillTemplate(listingTpl.subject, ctx)
      : `Weekly update for ${l.property_address}`;
    const draftBody = listingTpl ? fillTemplate(listingTpl.body, ctx) : "";

    await queueReviewItem({
      file_type: "listing",
      file_id: l.id,
      item_type: "communication",
      priority: "P2",
      title: `Tuesday Update — ${l.property_address}`,
      payload: {
        template_id: "tpl-3",
        listing_id: l.id,
        draft_subject: draftSubject,
        draft: draftBody,
      },
    });
    queued++;
  }

  const txnTpl = getTemplateById("tpl-7");
  for (const t of activeTxns) {
    const ctx = await buildTransactionEmailContext(t);
    const draftSubject = txnTpl
      ? fillTemplate(txnTpl.subject, ctx)
      : `Weekly update for ${t.property_address}`;
    const draftBody = txnTpl ? fillTemplate(txnTpl.body, ctx) : "";

    await queueReviewItem({
      file_type: "transaction",
      file_id: t.id,
      item_type: "communication",
      priority: "P2",
      title: `Tuesday Update — ${t.property_address}`,
      payload: {
        template_id: "tpl-7",
        transaction_id: t.id,
        draft_subject: draftSubject,
        draft: draftBody,
      },
    });
    queued++;
  }

  await logAudit({
    actor_type: "system",
    action_type: "cron_tuesday_updates",
    outputs: { listings: activeListings.length, transactions: activeTxns.length, queued },
    outcome: "success",
  });

  return NextResponse.json({
    message: "Tuesday updates queued for licensee review",
    queued,
  });
}
