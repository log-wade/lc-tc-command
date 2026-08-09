"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, FormSection } from "@/components/ui/form-field";

export type ClosingPrepFields = {
  closing_day?: string;
  closing_time?: string;
  signing_method?: string;
  utilities_reminder?: string;
  final_walkthrough?: string;
  keys_and_access?: string;
  closer_name?: string;
  closer_phone?: string;
  title_company?: string;
};

const SIGNING_METHOD_OPTIONS = [
  { value: "In person", label: "In person" },
  { value: "Mobile notary", label: "Mobile notary" },
  { value: "Other", label: "Other" },
];

export function ClosingPrepForm({
  transactionId,
  initial,
}: {
  transactionId: string;
  initial?: ClosingPrepFields;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const res = await fetch(`/api/transactions/${transactionId}/closing-prep`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Could not save closing prep");
      return;
    }
    toast.success("Closing prep saved — Closing confirmation (Template 8) will use these");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <FormSection
        title="Closing confirmation prep"
        description="Fields for Template 8 (Closing confirmation). Leave blank to use defaults or contract closing date."
      >
        <FormField
          label="Closing day"
          name="closing_day"
          placeholder="e.g. Friday, March 14"
          defaultValue={initial?.closing_day}
        />
        <FormField
          label="Closing time"
          name="closing_time"
          placeholder="e.g. 2:00 PM"
          defaultValue={initial?.closing_time}
        />
        <FormField
          label="Signing method"
          name="signing_method"
          options={SIGNING_METHOD_OPTIONS}
          defaultValue={initial?.signing_method}
        />
        <FormField
          label="Title company"
          name="title_company"
          placeholder="Title company name / location"
          defaultValue={initial?.title_company}
        />
        <FormField
          label="Closer name"
          name="closer_name"
          defaultValue={initial?.closer_name}
        />
        <FormField
          label="Closer phone"
          name="closer_phone"
          type="tel"
          defaultValue={initial?.closer_phone}
        />
        <FormField
          label="Utilities reminder"
          name="utilities_reminder"
          textarea
          className="sm:col-span-2"
          placeholder="Arrange start/stop of utilities effective on the closing date…"
          defaultValue={initial?.utilities_reminder}
        />
        <FormField
          label="Final walkthrough"
          name="final_walkthrough"
          textarea
          className="sm:col-span-2"
          placeholder="Walkthrough scheduled for…"
          defaultValue={initial?.final_walkthrough}
        />
        <FormField
          label="Keys and access"
          name="keys_and_access"
          textarea
          className="sm:col-span-2"
          placeholder="Keys, remotes, and access devices…"
          defaultValue={initial?.keys_and_access}
        />
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Saving…" : "Save closing prep"}
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
