"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RecomputeDeadlinesButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const res = await fetch(`/api/transactions/${transactionId}/recompute-deadlines`, {
      method: "POST",
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Could not recompute deadlines");
      return;
    }
    toast.success("Deadlines recomputed from current contract terms");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} disabled={loading}>
      <RefreshCw className="h-4 w-4" />
      {loading ? "Recomputing…" : "Recompute"}
    </Button>
  );
}
