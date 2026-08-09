"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, FormSection } from "@/components/ui/form-field";

export function WeeklyStatsForm({
  listingId,
  initial,
}: {
  listingId: string;
  initial?: {
    showings_week?: string;
    showings_total?: string;
    feedback_count?: string;
    feedback_themes?: string;
    cancellations?: string;
    no_shows?: string;
    open_house_details?: string;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch(`/api/listings/${listingId}/weekly-stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Could not save weekly stats");
      return;
    }
    toast.success("Weekly stats saved — Tuesday update will use these figures");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <FormSection
        title="Weekly listing stats"
        description="Pull from ShowingTime / Supra each week. These fill Template 3 (Tuesday update) and Template 4 (LA recap)."
      >
        <FormField
          label="Showings this week"
          name="showings_week"
          type="number"
          defaultValue={initial?.showings_week}
        />
        <FormField
          label="Showings cumulative"
          name="showings_total"
          type="number"
          defaultValue={initial?.showings_total}
        />
        <FormField
          label="Feedback count"
          name="feedback_count"
          type="number"
          defaultValue={initial?.feedback_count}
        />
        <FormField
          label="Cancellations"
          name="cancellations"
          type="number"
          defaultValue={initial?.cancellations}
        />
        <FormField
          label="No-shows"
          name="no_shows"
          type="number"
          defaultValue={initial?.no_shows}
        />
        <FormField
          label="Feedback themes"
          name="feedback_themes"
          textarea
          className="sm:col-span-2"
          placeholder="Price concerns, backyard size, competing inventory…"
          defaultValue={initial?.feedback_themes}
        />
        <FormField
          label="Open house details"
          name="open_house_details"
          textarea
          className="sm:col-span-2"
          placeholder="Sat 1–3 PM — 42 visitors"
          defaultValue={initial?.open_house_details}
        />
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Saving…" : "Save weekly stats"}
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
