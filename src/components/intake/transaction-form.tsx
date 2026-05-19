"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TransactionIntakeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    const res = await fetch("/api/intake/transaction", {
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
    router.push(`/transactions/${data.transaction.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <section className="space-y-4">
        <h2 className="font-semibold text-stone-900">Property & Parties</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-stone-600">
              Property Address *
            </span>
            <input
              name="property_address"
              required
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-stone-600">Side *</span>
            <select name="side" required className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm">
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="both">Both</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-stone-600">MLS #</span>
            <input name="mls_number" className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-stone-600">Buyer Name(s)</span>
            <input name="buyer_names" className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-stone-600">Seller Name(s)</span>
            <input name="seller_names" className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-stone-900">Contract Dates & Terms</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-medium text-stone-600">
              Effective Date *
            </span>
            <input
              name="effective_date"
              type="date"
              required
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-stone-600">
              Closing Date *
            </span>
            <input
              name="closing_date"
              type="date"
              required
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-stone-600">
              Option Period (days)
            </span>
            <input
              name="option_days"
              type="number"
              defaultValue={10}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-stone-600">
              Financing Days
            </span>
            <input
              name="financing_days"
              type="number"
              defaultValue={21}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-stone-600">
              Option Fee ($)
            </span>
            <input
              name="option_fee_amount"
              type="number"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-stone-600">
              Earnest Money ($)
            </span>
            <input
              name="earnest_money_amount"
              type="number"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-stone-600">Loan Type</span>
            <input name="loan_type" placeholder="Conventional, FHA, VA..." className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-stone-600">
              Title File #
            </span>
            <input name="title_file_number" className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" />
          </label>
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#1a2332] px-6 py-3 text-sm font-medium text-white hover:bg-[#243044] disabled:opacity-50"
      >
        {loading ? "Computing deadlines..." : "Submit Contract Intake"}
      </button>
    </form>
  );
}
