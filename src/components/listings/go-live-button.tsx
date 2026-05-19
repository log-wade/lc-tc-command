"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GoLiveButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function approve() {
    if (!confirm("Approve go-live? Listing will move to Active status.")) return;
    setLoading(true);
    await fetch(`/api/listings/${listingId}/go-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: "agent-admin" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={approve}
      disabled={loading}
      className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
    >
      {loading ? "Approving..." : "Approve Go-Live"}
    </button>
  );
}
