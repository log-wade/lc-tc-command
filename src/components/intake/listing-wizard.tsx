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
  { id: "seller", label: "Seller" },
  { id: "showing", label: "Showing" },
  { id: "review", label: "Submit" },
];

const COUNTIES = ["Travis", "Williamson", "Hays", "Bastrop", "Caldwell", "Other"].map(
  (c) => ({ value: c, label: c })
);

export function ListingWizard() {
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
        toast.error("Street address is required");
        return;
      }
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(fd.entries());
    payload.has_hoa = fd.get("has_hoa") === "yes";
    payload.mud_pid_sid = fd.get("mud_pid_sid") === "yes";

    const res = await fetch("/api/intake/listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(json.error ?? "Could not save listing");
      return;
    }
    toast.success("Listing saved — intro email queued for your review");
    router.push(`/listings/${json.listing.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <WizardSteps steps={STEPS} current={step} />

      <div className={step === 0 ? "block" : "hidden"}>
        <WizardPanel>
          <FormSection
            title="Property details"
            description="Where is the home, and when are we targeting go-live?"
          >
            <FormField
              label="Street address"
              name="property_address"
              required
              className="sm:col-span-2"
              placeholder="413 Pecan Hollow Dr"
              hint="Full address as it will appear on MLS."
            />
            <FormField label="City" name="city" />
            <FormField label="ZIP" name="zip" />
            <FormField
              label="County"
              name="county"
              required
              options={COUNTIES}
              hint="Williamson & Hays often need MUD/PID disclosures."
            />
            <FormField label="List price" name="list_price" type="number" />
            <FormField label="Target list date" name="target_list_date" type="date" />
            <FormField label="Square feet" name="sqft" type="number" />
            <FormField label="Beds" name="beds" type="number" />
            <FormField label="Baths" name="baths" type="number" step="0.5" />
            <FormField
              label="HOA?"
              name="has_hoa"
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
            />
            <FormField label="HOA name" name="hoa_name" />
            <FormField
              label="MUD / PID / SID?"
              name="mud_pid_sid"
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
            />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 1 ? "block" : "hidden"}>
        <WizardPanel>
          <FormSection title="Seller information" description="Who are we coordinating with?">
            <FormField label="Legal name" name="seller_legal_name" required className="sm:col-span-2" />
            <FormField label="Preferred name" name="seller_preferred_name" />
            <FormField label="Email" name="seller_email" type="email" required />
            <FormField label="Phone" name="seller_phone" type="tel" />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 2 ? "block" : "hidden"}>
        <WizardPanel>
          <FormSection title="Showing & marketing" description="Photo package and showing rules.">
            <FormField
              label="Photo package"
              name="photo_package"
              className="sm:col-span-2"
              placeholder="Premium HDR, Drone…"
            />
            <FormField
              label="Showing instructions"
              name="showing_instructions"
              textarea
              className="sm:col-span-2"
              placeholder="1-hour notice, pets, alarm code…"
            />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 3 ? "block" : "hidden"}>
        <WizardPanel>
          <h2 className="font-display text-lg font-semibold">Ready to submit?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            We&apos;ll create the file and queue the seller intro email for your review before
            anything sends.
          </p>
          <ul className="mt-6 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
            <li>
              <span className="text-ink-muted">Address: </span>
              <strong>{preview.property_address || "—"}</strong>
            </li>
            <li>
              <span className="text-ink-muted">County: </span>
              <strong>{preview.county || "—"}</strong>
            </li>
            <li>
              <span className="text-ink-muted">Seller: </span>
              <strong>{preview.seller_legal_name || "—"}</strong>
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
            "Submitting…"
          ) : (
            "Submit listing intake"
          )}
        </Button>
      </div>
    </form>
  );
}
