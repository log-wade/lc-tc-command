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

export function TransactionWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      const fd = new FormData(e.currentTarget);
      const partial = Object.fromEntries(fd.entries()) as Record<string, string>;
      setPreview((prev) => ({ ...prev, ...partial }));
      if (step === 0 && !partial.property_address?.trim()) {
        toast.error("Property address is required");
        return;
      }
      if (step === 1 && (!partial.effective_date || !partial.closing_date)) {
        toast.error("Effective date and closing date are required");
        return;
      }
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/intake/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error ?? "Could not save contract");
      return;
    }
    toast.success("Contract saved — deadlines computed & congrats email queued");
    router.push(`/transactions/${json.transaction.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <WizardSteps steps={STEPS} current={step} />

      <div className={step === 0 ? "block" : "hidden"}>
        <WizardPanel>
          <FormSection title="Property" description="Which file is this contract for?">
            <FormField
              label="Property address"
              name="property_address"
              required
              className="sm:col-span-2"
            />
            <FormField
              label="Side"
              name="side"
              required
              options={[
                { value: "buy", label: "Buy" },
                { value: "sell", label: "Sell" },
                { value: "both", label: "Both" },
              ]}
            />
            <FormField label="MLS number" name="mls_number" />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 1 ? "block" : "hidden"}>
        <WizardPanel>
          <FormSection
            title="Contract dates & terms"
            description="The deadline engine pins every milestone from the effective date."
          >
            <FormField label="Effective date" name="effective_date" type="date" required />
            <FormField label="Closing date" name="closing_date" type="date" required />
            <FormField
              label="Option period (days)"
              name="option_days"
              type="number"
              defaultValue={10}
            />
            <FormField
              label="Financing days"
              name="financing_days"
              type="number"
              defaultValue={21}
            />
            <FormField label="Option fee ($)" name="option_fee_amount" type="number" />
            <FormField label="Earnest money ($)" name="earnest_money_amount" type="number" />
            <FormField label="Loan type" name="loan_type" placeholder="Conventional, FHA, VA…" />
            <FormField label="Title file #" name="title_file_number" />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 2 ? "block" : "hidden"}>
        <WizardPanel>
          <FormSection title="Parties" description="Buyer and seller names for templates and third-party intros.">
            <FormField label="Buyer name(s)" name="buyer_names" className="sm:col-span-2" />
            <FormField label="Seller name(s)" name="seller_names" className="sm:col-span-2" />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 3 ? "block" : "hidden"}>
        <WizardPanel>
          <h2 className="font-display text-lg font-semibold">Ready to submit?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            All Texas residential deadlines will be calculated automatically. Template 6 (Congrats
            &amp; What to Expect) queues for your review.
          </p>
          <ul className="mt-6 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
            <li>
              <span className="text-ink-muted">Property: </span>
              <strong>{preview.property_address || "—"}</strong>
            </li>
            <li>
              <span className="text-ink-muted">Effective: </span>
              <strong>{preview.effective_date || "—"}</strong>
            </li>
            <li>
              <span className="text-ink-muted">Closing: </span>
              <strong>{preview.closing_date || "—"}</strong>
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
