"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WizardSteps, WizardPanel } from "@/components/ui/wizard";
import { FormField, FormSection } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  { id: "property", label: "Property" },
  { id: "dates", label: "Contract dates" },
  { id: "parties", label: "Parties" },
  { id: "review", label: "Submit" },
];

function validateStep(step: number, data: Record<string, string>): string | null {
  if (step === 0) {
    if (!data.property_address?.trim()) return "Property address is required";
    if (!data.side?.trim()) return "Side is required";
  }
  if (step === 1) {
    if (!data.effective_date) return "Effective date is required";
    if (!data.closing_date) return "Closing date is required";
    if (!data.survey_required) return "Select the survey / T-47 delivery terms";
  }
  if (step === 2) {
    if (!data.client_email?.trim()) return "Client email is required for outbound templates";
  }
  return null;
}

export function TransactionWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const partial = Object.fromEntries(fd.entries()) as Record<string, string>;
    const merged = { ...formData, ...partial };

    if (step < STEPS.length - 1) {
      const error = validateStep(step, merged);
      if (error) {
        toast.error(error);
        return;
      }
      setFormData(merged);
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/intake/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(merged),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error ?? "Could not save contract");
      return;
    }
    toast.success("Contract saved — deadlines computed; congrats + title intro queued");
    router.push(`/transactions/${json.transaction.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <WizardSteps steps={STEPS} current={step} />

      <div className={step === 0 ? "block" : "hidden"} aria-hidden={step !== 0}>
        <WizardPanel>
          <FormSection title="Property" description="Which file is this contract for?">
            <FormField
              label="Property address"
              name="property_address"
              required={step === 0}
              className="sm:col-span-2"
              defaultValue={formData.property_address}
            />
            <FormField
              label="Side"
              name="side"
              required={step === 0}
              options={[
                { value: "buy", label: "Buy" },
                { value: "sell", label: "Sell" },
                { value: "both", label: "Both" },
              ]}
              defaultValue={formData.side ?? "buy"}
            />
            <FormField label="MLS number" name="mls_number" defaultValue={formData.mls_number} />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 1 ? "block" : "hidden"} aria-hidden={step !== 1}>
        <WizardPanel>
          <FormSection
            title="Contract dates & terms"
            description="The deadline engine pins every milestone from the effective date."
          >
            <FormField
              label="Effective date"
              name="effective_date"
              type="date"
              required={step === 1}
              defaultValue={formData.effective_date}
            />
            <FormField
              label="Closing date"
              name="closing_date"
              type="date"
              required={step === 1}
              defaultValue={formData.closing_date}
            />
            <FormField
              label="Option period (days)"
              name="option_days"
              type="number"
              defaultValue={formData.option_days ?? "10"}
              hint="Calendar days after the effective date. Ends at 5:00 PM CT on the last day."
            />
            <FormField
              label="Financing days"
              name="financing_days"
              type="number"
              defaultValue={formData.financing_days ?? "21"}
              hint="Buyer financing approval notice only — not appraisal / property approval."
            />
            <FormField
              label="Title commitment (days)"
              name="title_commitment_days"
              type="number"
              defaultValue={formData.title_commitment_days ?? "20"}
              hint="Per contract paragraph 6A. Default 20 days."
            />
            <FormField
              label="Survey / T-47 delivery?"
              name="survey_required"
              options={[
                { value: "yes", label: "Yes — seller delivers existing survey + T-47" },
                { value: "no", label: "Not applicable (for example, a condominium)" },
              ]}
              defaultValue={formData.survey_required}
              required={step === 1}
            />
            <FormField
              label="Survey / T-47 delivery (days after execution)"
              name="survey_days"
              type="number"
              defaultValue={formData.survey_days ?? "5"}
              hint="Use the write-in from paragraph 6C. Miss it and the seller is in breach and may owe a new survey."
            />
            <FormField label="Option fee ($)" name="option_fee_amount" type="number" defaultValue={formData.option_fee_amount} />
            <FormField label="Earnest money ($)" name="earnest_money_amount" type="number" defaultValue={formData.earnest_money_amount} />
            <FormField label="Loan type" name="loan_type" placeholder="Conventional, FHA, VA…" defaultValue={formData.loan_type} />
            <FormField label="Title file #" name="title_file_number" defaultValue={formData.title_file_number} />
            <FormField label="Title company" name="title_company" defaultValue={formData.title_company} />
            <FormField
              label="HOA?"
              name="has_hoa"
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
              defaultValue={formData.has_hoa ?? "no"}
              hint="Adds HOA document delivery to the key-dates table."
            />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 2 ? "block" : "hidden"} aria-hidden={step !== 2}>
        <WizardPanel>
          <FormSection title="Parties" description="Buyer and seller names for templates and third-party intros.">
            <FormField
              label="Client first name (for emails)"
              name="client_first_name"
              defaultValue={formData.client_first_name}
            />
            <FormField
              label="Client email"
              name="client_email"
              type="email"
              required={step === 2}
              defaultValue={formData.client_email}
              hint="Approved client emails (congrats, weekly, closing) go here."
            />
            <FormField label="Buyer name(s)" name="buyer_names" className="sm:col-span-2" defaultValue={formData.buyer_names} />
            <FormField label="Seller name(s)" name="seller_names" className="sm:col-span-2" defaultValue={formData.seller_names} />
            <FormField
              label="Title / lender contact name"
              name="third_party_name"
              defaultValue={formData.third_party_name}
            />
            <FormField
              label="Title / lender email"
              name="third_party_email"
              type="email"
              defaultValue={formData.third_party_email}
              hint="Used for Template 6 (title + lender intro)."
            />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 3 ? "block" : "hidden"} aria-hidden={step !== 3}>
        <WizardPanel>
          <h2 className="font-display text-lg font-semibold">Ready to submit?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            All Texas residential deadlines will be calculated automatically. Template 5 (Congrats)
            and Template 6 (Title + lender intro) queue for your review — you can skip the intro
            if an agent already sent the executed contract.
          </p>
          <ul className="mt-6 space-y-2 rounded-xl bg-brand-bg p-4 text-sm">
            <li>
              <span className="text-ink-muted">Property: </span>
              <strong>{formData.property_address || "—"}</strong>
            </li>
            <li>
              <span className="text-ink-muted">Effective: </span>
              <strong>{formData.effective_date || "—"}</strong>
            </li>
            <li>
              <span className="text-ink-muted">Closing: </span>
              <strong>{formData.closing_date || "—"}</strong>
            </li>
          </ul>
        </WizardPanel>
      </div>

      <div className="mt-6 flex justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button type="submit" disabled={loading}>
          {step < STEPS.length - 1 ? (
            <>
              Continue
              <ChevronRight className="h-4 w-4" />
            </>
          ) : loading ? (
            "Computing deadlines…"
          ) : (
            "Submit contract intake"
          )}
        </Button>
      </div>
    </form>
  );
}
