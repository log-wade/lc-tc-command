"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COUNTIES = ["Travis", "Williamson", "Hays", "Bastrop", "Caldwell", "Other"];

export function ListingIntakeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(fd.entries());
    payload.has_hoa = fd.get("has_hoa") === "yes";
    payload.mud_pid_sid = fd.get("mud_pid_sid") === "yes";

    const res = await fetch("/api/intake/listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Submission failed");
      return;
    }
    router.push(`/listings/${data.listing.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <section className="space-y-4">
        <h2 className="font-semibold text-stone-900">Property</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Street Address *" name="property_address" required className="sm:col-span-2" />
          <Field label="City" name="city" />
          <Field label="ZIP" name="zip" />
          <SelectField label="County *" name="county" options={COUNTIES} required />
          <Field label="List Price" name="list_price" type="number" />
          <Field label="Target List Date" name="target_list_date" type="date" />
          <Field label="Sq Ft" name="sqft" type="number" />
          <Field label="Beds" name="beds" type="number" />
          <Field label="Baths" name="baths" type="number" step="0.5" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="HOA?" name="has_hoa" options={["no", "yes"]} />
          <Field label="HOA Name" name="hoa_name" />
          <SelectField label="MUD/PID/SID?" name="mud_pid_sid" options={["no", "yes"]} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-stone-900">Seller</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Seller Legal Name *" name="seller_legal_name" required />
          <Field label="Preferred Name" name="seller_preferred_name" />
          <Field label="Email *" name="seller_email" type="email" required />
          <Field label="Phone" name="seller_phone" type="tel" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-stone-900">Showing & Marketing</h2>
        <Field label="Photo Package" name="photo_package" placeholder="e.g. Premium HDR + Drone" />
        <Field
          label="Showing Instructions"
          name="showing_instructions"
          textarea
          placeholder="Notice required, pet warnings, alarm codes..."
        />
      </section>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#1a2332] px-6 py-3 text-sm font-medium text-white hover:bg-[#243044] disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Listing Intake"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  className,
  placeholder,
  textarea,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  textarea?: boolean;
  step?: string;
}) {
  const cls =
    "w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500";
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium text-stone-600">{label}</span>
      {textarea ? (
        <textarea name={name} required={required} className={cls} rows={3} placeholder={placeholder} />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          className={cls}
          placeholder={placeholder}
          step={step}
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-medium text-stone-600">{label}</span>
      <select
        name={name}
        required={required}
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
