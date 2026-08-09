"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, FormSection } from "@/components/ui/form-field";

export function WeeklyNotesForm({
  transactionId,
  initial,
}: {
  transactionId: string;
  initial?: {
    status_summary?: string;
    action_needed?: string;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch(`/api/transactions/${transactionId}/weekly-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Could not save notes");
      return;
    }
    toast.success("Weekly notes saved — Tuesday update will use these");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <FormSection
        title="Weekly transaction notes"
        description="Optional overrides for Template 7. Leave blank to auto-suggest status from deadlines."
      >
        <FormField
          label="Status summary"
          name="status_summary"
          textarea
          className="sm:col-span-2"
          placeholder='e.g. In option period — survey ordered, title commitment expected Mar 12'
          defaultValue={initial?.status_summary}
        />
        <FormField
          label="Action needed"
          name="action_needed"
          textarea
          className="sm:col-span-2"
          placeholder="Buyer to return signed HOA docs by Friday…"
          defaultValue={initial?.action_needed}
        />
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Saving…" : "Save notes"}
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
