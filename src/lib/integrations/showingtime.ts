import type { IntegrationAdapter, IntegrationResult } from "./types";

export const showingtimeAdapter: IntegrationAdapter = {
  provider: "showingtime",
  isLive() {
    return Boolean(process.env.SHOWINGTIME_API_KEY);
  },
  async scheduleShowing(payload: Record<string, unknown>): Promise<IntegrationResult> {
    if (!this.isLive()) {
      return {
        ok: true,
        provider: "showingtime",
        mode: "stub",
        data: { confirmationId: `st-${Date.now()}`, ...payload },
      };
    }
    return { ok: false, provider: "showingtime", mode: "live", error: "ShowingTime API pending" };
  },
};
