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

function validateStep(step: number, data: Record<string, string>): string | null {
  if (step === 0) {
    if (!data.property_address?.trim()) return "Street address is required";
    if (!data.county?.trim()) return "County is required";
  }
  if (step === 1) {
    if (!data.seller_legal_name?.trim()) return "Seller legal name is required";
    if (!data.seller_email?.trim()) return "Seller email is required";
  }
  return null;
}

export function ListingWizard() {
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
    const payload: Record<string, unknown> = { ...merged };
    payload.has_hoa = merged.has_hoa === "yes";
    payload.mud_pid_sid = merged.mud_pid_sid === "yes";

    const res = await fetch("/api/intake/listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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
    <form onSubmit={handleSubmit} noValidate>
      <WizardSteps steps={STEPS} current={step} />

      <div className={step === 0 ? "block" : "hidden"} aria-hidden={step !== 0}>
        <WizardPanel>
          <FormSection
            title="Property details"
            description="Where is the home, and when are we targeting go-live?"
          >
            <FormField
              label="Street address"
              name="property_address"
              required={step === 0}
              className="sm:col-span-2"
              placeholder="413 Pecan Hollow Dr"
              hint="Full address as it will appear on MLS."
              defaultValue={formData.property_address}
            />
            <FormField label="City" name="city" defaultValue={formData.city} />
            <FormField label="ZIP" name="zip" defaultValue={formData.zip} />
            <FormField
              label="County"
              name="county"
              required={step === 0}
              options={COUNTIES}
              hint="Williamson & Hays often need MUD/PID disclosures."
              defaultValue={formData.county}
            />
            <FormField label="List price" name="list_price" type="number" defaultValue={formData.list_price} />
            <FormField label="Target list date" name="target_list_date" type="date" defaultValue={formData.target_list_date} />
            <FormField label="Square feet" name="sqft" type="number" defaultValue={formData.sqft} />
            <FormField label="Beds" name="beds" type="number" defaultValue={formData.beds} />
            <FormField label="Baths" name="baths" type="number" step="0.5" defaultValue={formData.baths} />
            <FormField
              label="HOA?"
              name="has_hoa"
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
              defaultValue={formData.has_hoa ?? "no"}
            />
            <FormField label="HOA name" name="hoa_name" defaultValue={formData.hoa_name} />
            <FormField
              label="MUD / PID / SID?"
              name="mud_pid_sid"
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
              defaultValue={formData.mud_pid_sid ?? "no"}
            />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 1 ? "block" : "hidden"} aria-hidden={step !== 1}>
        <WizardPanel>
          <FormSection title="Seller information" description="Who are we coordinating with?">
            <FormField
              label="Legal name"
              name="seller_legal_name"
              required={step === 1}
              className="sm:col-span-2"
              defaultValue={formData.seller_legal_name}
            />
            <FormField label="Preferred name" name="seller_preferred_name" defaultValue={formData.seller_preferred_name} />
            <FormField
              label="Email"
              name="seller_email"
              type="email"
              required={step === 1}
              defaultValue={formData.seller_email}
            />
            <FormField label="Phone" name="seller_phone" type="tel" defaultValue={formData.seller_phone} />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 2 ? "block" : "hidden"} aria-hidden={step !== 2}>
        <WizardPanel>
          <FormSection title="Showing & marketing" description="Photo package and showing rules.">
            <FormField
              label="Photo package"
              name="photo_package"
              className="sm:col-span-2"
              placeholder="Premium HDR, Drone…"
              defaultValue={formData.photo_package}
            />
            <FormField
              label="Showing instructions"
              name="showing_instructions"
              textarea
              className="sm:col-span-2"
              placeholder="1-hour notice, pets, alarm code…"
              defaultValue={formData.showing_instructions}
            />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 3 ? "block" : "hidden"} aria-hidden={step !== 3}>
        <WizardPanel>
          <h2 className="font-display text-lg font-semibold">Ready to submit?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            We&apos;ll create the file and queue the seller intro email for your review before
            anything sends.
          </p>
          <ul className="mt-6 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
            <li>
              <span className="text-ink-muted">Address: </span>
              <strong>{formData.property_address || "—"}</strong>
            </li>
            <li>
              <span className="text-ink-muted">County: </span>
              <strong>{formData.county || "—"}</strong>
            </li>
            <li>
              <span className="text-ink-muted">Seller: </span>
              <strong>{formData.seller_legal_name || "—"}</strong>
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
