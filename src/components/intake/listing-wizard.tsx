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
    if (!data.year_built) return "Year built is required for ECAD screening";
    if (!data.in_austin_city_limits) return "Select whether the property is in Austin city limits";
    if (!data.austin_energy_service) return "Select whether Austin Energy serves the property";
  }
  if (step === 1) {
    if (!data.seller_legal_name?.trim()) return "Seller legal name is required";
    if (!data.seller_email?.trim()) return "Seller email is required";
    if (!data.survey_on_file) return "Select whether the seller has a current survey";
  }
  if (step === 2 && Boolean(data.photo_date) !== Boolean(data.photo_time)) {
    return "Photoshoot date and start time must be entered together";
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
    payload.in_austin_city_limits = merged.in_austin_city_limits === "yes";
    payload.austin_energy_service = merged.austin_energy_service === "yes";
    payload.survey_on_file = merged.survey_on_file === "yes";

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
              label="Year built"
              name="year_built"
              type="number"
              required={step === 0}
              defaultValue={formData.year_built}
              hint="Used with the Austin location/service answers to determine ECAD applicability."
            />
            <FormField
              label="Inside Austin city limits?"
              name="in_austin_city_limits"
              required={step === 0}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              defaultValue={formData.in_austin_city_limits}
            />
            <FormField
              label="Austin Energy service area?"
              name="austin_energy_service"
              required={step === 0}
              options={[
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              defaultValue={formData.austin_energy_service}
            />
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
            <FormField
              label="Current survey on file?"
              name="survey_on_file"
              required={step === 1}
              options={[
                { value: "yes", label: "Yes — request survey and notarized T-47" },
                { value: "no", label: "No / unknown" },
              ]}
              defaultValue={formData.survey_on_file}
              hint="T-47 must be wet-ink signed and notarized; it cannot be e-signed."
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
              defaultValue={formData.disclosure_status ?? "needed"}
            />
            <FormField
              label="Spare lockbox key"
              name="spare_key_status"
              options={[
                { value: "needed", label: "Needed" },
                { value: "received", label: "Received" },
                { value: "not_applicable", label: "Not applicable" },
              ]}
              defaultValue={formData.spare_key_status ?? "needed"}
            />
          </FormSection>
        </WizardPanel>
      </div>

      <div className={step === 2 ? "block" : "hidden"} aria-hidden={step !== 2}>
        <WizardPanel>
          <FormSection title="Showing & marketing" description="Photo package and showing rules.">
            <FormField
              label="Staging status"
              name="staging_status"
              options={[
                { value: "needed", label: "Needs scheduling" },
                { value: "scheduled", label: "Scheduled" },
                { value: "completed", label: "Completed" },
                { value: "not_applicable", label: "Not applicable" },
              ]}
              defaultValue={formData.staging_status ?? "needed"}
            />
            <FormField
              label="Photo package"
              name="photo_package"
              className="sm:col-span-2"
              placeholder="Premium HDR, Drone…"
              defaultValue={formData.photo_package}
            />
            <FormField
              label="Photoshoot date"
              name="photo_date"
              type="date"
              defaultValue={formData.photo_date}
              hint="Enter this with a start time to queue the photoshoot confirmation for review."
            />
            <FormField
              label="Photoshoot start time"
              name="photo_time"
              type="time"
              defaultValue={formData.photo_time}
            />
            <FormField
              label="Showing instructions"
              name="showing_instructions"
              textarea
              className="sm:col-span-2"
              placeholder="1-hour notice, pets, alarm code…"
              defaultValue={formData.showing_instructions}
            />
            <FormField
              label="Showing restrictions"
              name="showing_restrictions"
              textarea
              className="sm:col-span-2"
              placeholder="No showings before 10 AM; block Sundays; occupied — prefer evenings…"
              defaultValue={formData.showing_restrictions}
            />
            <FormField
              label="Showing notifications"
              name="showing_notification_preference"
              options={[
                { value: "both", label: "Text + email" },
                { value: "text", label: "Text only" },
                { value: "email", label: "Email only" },
              ]}
              defaultValue={formData.showing_notification_preference ?? "both"}
            />
            <FormField
              label="Open house details (optional)"
              name="open_house_details"
              textarea
              className="sm:col-span-2"
              placeholder="First weekend OH Sat 1–3 PM if scheduled…"
              defaultValue={formData.open_house_details}
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
          <ul className="mt-6 space-y-2 rounded-xl bg-brand-bg p-4 text-sm">
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
