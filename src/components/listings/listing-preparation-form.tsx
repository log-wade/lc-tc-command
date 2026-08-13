"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, FormSection } from "@/components/ui/form-field";

export type ListingPreparationFields = {
  year_built?: number;
  in_austin_city_limits?: boolean;
  austin_energy_service?: boolean;
  survey_on_file?: boolean;
  t47_status?: string;
  staging_status?: string;
  disclosure_status?: string;
  spare_key_status?: string;
  photo_date?: string;
  photo_time?: string;
};

function yesNo(value: boolean | undefined): string | undefined {
  if (value === true) return "yes";
  if (value === false) return "no";
  return undefined;
}

export function ListingPreparationForm({
  listingId,
  initial,
}: {
  listingId: string;
  initial: ListingPreparationFields;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch(`/api/listings/${listingId}/preparation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget).entries())),
    });
    setLoading(false);

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      toast.error(json.error ?? "Could not save listing preparation");
      return;
    }

    toast.success("Listing preparation saved");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <FormSection
        title="Make-ready & document tracking"
        description="Update survey/T-47, ECAD, staging, disclosure, key, and photography status. A newly scheduled photoshoot queues its confirmation email."
      >
        <FormField
          label="Year built"
          name="year_built"
          type="number"
          required
          defaultValue={initial.year_built}
        />
        <FormField
          label="Inside Austin city limits?"
          name="in_austin_city_limits"
          required
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          defaultValue={yesNo(initial.in_austin_city_limits)}
        />
        <FormField
          label="Austin Energy service area?"
          name="austin_energy_service"
          required
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]}
          defaultValue={yesNo(initial.austin_energy_service)}
        />
        <FormField
          label="Current survey on file?"
          name="survey_on_file"
          required
          options={[
            { value: "yes", label: "Yes" },
            { value: "no", label: "No / unknown" },
          ]}
          defaultValue={yesNo(initial.survey_on_file)}
        />
        <FormField
          label="T-47 status"
          name="t47_status"
          options={[
            { value: "needed", label: "Needed" },
            { value: "sent", label: "Instructions sent" },
            { value: "received", label: "Notarized T-47 received" },
            { value: "not_applicable", label: "Not applicable" },
          ]}
          defaultValue={initial.t47_status ?? "needed"}
        />
        <FormField
          label="Staging status"
          name="staging_status"
          options={[
            { value: "needed", label: "Needs scheduling" },
            { value: "scheduled", label: "Scheduled" },
            { value: "completed", label: "Completed" },
            { value: "not_applicable", label: "Not applicable" },
          ]}
          defaultValue={initial.staging_status ?? "needed"}
        />
        <FormField
          label="Seller disclosure status"
          name="disclosure_status"
          options={[
            { value: "needed", label: "Needed" },
            { value: "sent", label: "Sent through Sellers Shield" },
            { value: "received", label: "Received" },
            { value: "not_applicable", label: "Not applicable" },
          ]}
          defaultValue={initial.disclosure_status ?? "needed"}
        />
        <FormField
          label="Spare lockbox key"
          name="spare_key_status"
          options={[
            { value: "needed", label: "Needed" },
            { value: "received", label: "Received" },
            { value: "not_applicable", label: "Not applicable" },
          ]}
          defaultValue={initial.spare_key_status ?? "needed"}
        />
        <FormField
          label="Photoshoot date"
          name="photo_date"
          type="date"
          defaultValue={initial.photo_date}
        />
        <FormField
          label="Photoshoot start time"
          name="photo_time"
          type="time"
          defaultValue={initial.photo_time}
        />
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Saving…" : "Save preparation"}
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
