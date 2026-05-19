import type { IntegrationAdapter, IntegrationResult } from "./types";

export const mlsAdapter: IntegrationAdapter = {
  provider: "mls",
  isLive() {
    return Boolean(process.env.MLS_API_KEY && process.env.MLS_API_URL);
  },
  async syncListing(mlsNumber: string): Promise<IntegrationResult> {
    if (!this.isLive()) {
      return {
        ok: true,
        provider: "mls",
        mode: "stub",
        data: { mlsNumber, status: "Active", listPrice: null, syncedAt: new Date().toISOString() },
      };
    }
    const res = await fetch(`${process.env.MLS_API_URL}/listings/${mlsNumber}`, {
      headers: { Authorization: `Bearer ${process.env.MLS_API_KEY}` },
    });
    if (!res.ok) {
      return { ok: false, provider: "mls", mode: "live", error: res.statusText };
    }
    return { ok: true, provider: "mls", mode: "live", data: await res.json() };
  },
};
