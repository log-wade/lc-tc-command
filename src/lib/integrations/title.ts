import type { IntegrationAdapter, IntegrationResult } from "./types";

export const titleAdapter: IntegrationAdapter = {
  provider: "title",
  isLive() {
    return Boolean(process.env.TITLE_API_URL && process.env.TITLE_API_KEY);
  },
  async orderTitle(payload: Record<string, unknown>): Promise<IntegrationResult> {
    if (!this.isLive()) {
      return {
        ok: true,
        provider: "title",
        mode: "stub",
        data: { orderId: `title-${Date.now()}`, status: "queued", ...payload },
      };
    }
    return { ok: false, provider: "title", mode: "live", error: "Title API pending" };
  },
};
