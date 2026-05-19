export type IntegrationProvider = "mls" | "docusign" | "showingtime" | "supra" | "title" | "resend";

export type IntegrationStatus = "inactive" | "active" | "error";

export type IntegrationResult<T = unknown> = {
  ok: boolean;
  provider: IntegrationProvider;
  mode: "live" | "stub";
  data?: T;
  error?: string;
};

export interface IntegrationAdapter {
  provider: IntegrationProvider;
  isLive(): boolean;
  syncListing?(mlsNumber: string): Promise<IntegrationResult>;
  sendEnvelope?(payload: Record<string, unknown>): Promise<IntegrationResult>;
  scheduleShowing?(payload: Record<string, unknown>): Promise<IntegrationResult>;
  orderTitle?(payload: Record<string, unknown>): Promise<IntegrationResult>;
}
