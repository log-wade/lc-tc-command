import { NextResponse } from "next/server";
import { getListings, getTransactions } from "@/lib/data";
import { fillTemplate } from "@/lib/templates/signature";
import { logAudit } from "@/lib/audit";
import { memoryStore } from "@/lib/store/memory-store";

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

  for (const l of activeListings) {
    memoryStore.addReview({
      file_type: "listing",
      file_id: l.id,
      item_type: "communication",
      priority: "P2",
      title: `Tuesday Update — ${l.property_address}`,
      payload: {
        template_id: "tpl-4",
        draft: fillTemplate(
          "Weekly update for {{property_address}} — due by 3 PM CT",
          { property_address: l.property_address }
        ),
      },
    });
    queued++;
  }

  for (const t of activeTxns) {
    memoryStore.addReview({
      file_type: "transaction",
      file_id: t.id,
      item_type: "communication",
      priority: "P2",
      title: `Tuesday Update — ${t.property_address}`,
      payload: { template_id: "tpl-8", transaction_id: t.id },
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
