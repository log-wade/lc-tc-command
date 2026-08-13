"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField, FormSection } from "@/components/ui/form-field";

export type ContractTermsFields = {
  effective_date?: string;
  closing_date?: string;
  option_days?: number;
  financing_days?: number;
  title_commitment_days?: number;
  survey_required?: boolean;
  survey_days?: number;
  option_fee_amount?: number;
  earnest_money_amount?: number;
  loan_type?: string;
  title_file_number?: string;
};

export function ContractTermsForm({
  transactionId,
  initial,
}: {
  transactionId: string;
  initial: ContractTermsFields;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/transactions/${transactionId}/contract-terms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(fd.entries())),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json.error ?? "Could not save contract terms");
      return;
    }
    toast.success("Contract terms saved — deadlines recomputed");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <FormSection
        title="Edit contract terms"
        description="Enter an executed amendment or correct an intake typo. Saving recomputes the deadline timeline; items already marked met or waived keep their dates."
      >
        <FormField
          label="Effective date"
          name="effective_date"
          type="date"
          required
          defaultValue={initial.effective_date}
          hint="Execution day is day 0 — every deadline counts forward from here."
        />
        <FormField
          label="Closing date"
          name="closing_date"
          type="date"
          required
          defaultValue={initial.closing_date}
        />
        <FormField
          label="Option period (days)"
          name="option_days"
          type="number"
          defaultValue={initial.option_days}
          hint="Ends at 5:00 PM CT on the last day. Never extended for weekends."
        />
        <FormField
          label="Financing days"
          name="financing_days"
          type="number"
          defaultValue={initial.financing_days}
          hint="Buyer financing approval notice only — not appraisal / property approval."
        />
        <FormField
          label="Title commitment (days)"
          name="title_commitment_days"
          type="number"
          defaultValue={initial.title_commitment_days}
        />
        <FormField
          label="Survey / T-47 delivery?"
          name="survey_required"
          options={[
            { value: "yes", label: "Yes — seller delivers existing survey + T-47" },
            { value: "no", label: "Not applicable (for example, a condominium)" },
          ]}
          defaultValue={
            initial.survey_required === true
              ? "yes"
              : initial.survey_required === false
                ? "no"
                : undefined
          }
          required
          hint="Legacy files must be confirmed before their deadlines can be recomputed."
        />
        <FormField
          label="Survey / T-47 delivery (days after execution)"
          name="survey_days"
          type="number"
          defaultValue={initial.survey_days}
          hint="Use the write-in from paragraph 6C."
        />
        <FormField
          label="Option fee ($)"
          name="option_fee_amount"
          type="number"
          defaultValue={initial.option_fee_amount}
        />
        <FormField
          label="Earnest money ($)"
          name="earnest_money_amount"
          type="number"
          defaultValue={initial.earnest_money_amount}
        />
        <FormField label="Loan type" name="loan_type" defaultValue={initial.loan_type} />
        <FormField
          label="Title file #"
          name="title_file_number"
          defaultValue={initial.title_file_number}
        />
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={loading} size="sm">
            {loading ? "Recomputing deadlines…" : "Save terms & recompute"}
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
