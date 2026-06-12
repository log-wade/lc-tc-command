"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function resolve(approved: boolean) {
    setLoading(true);
    await fetch(`/api/reviews/${reviewId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="success"
        disabled={loading}
        onClick={() => void resolve(true)}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={loading}
        onClick={() => void resolve(false)}
      >
        Reject
      </Button>
    </div>
  );
}
