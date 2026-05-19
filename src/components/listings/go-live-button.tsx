"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GoLiveButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function approve() {
    if (!confirm("Approve go-live? The listing moves to Active and the seller 'We Are Live' email queues for review.")) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/listings/${listingId}/go-live`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: "agent-admin" }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not approve go-live");
      return;
    }
    toast.success("Go-live approved — We Are Live email queued");
    router.refresh();
  }

  return (
    <Button variant="success" size="sm" onClick={approve} disabled={loading}>
      {loading ? "Approving…" : "Approve go-live"}
    </Button>
  );
}
