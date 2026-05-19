import type { IntegrationAdapter, IntegrationResult } from "./types";

export const docusignAdapter: IntegrationAdapter = {
  provider: "docusign",
  isLive() {
    return Boolean(
      process.env.DOCUSIGN_INTEGRATION_KEY &&
        process.env.DOCUSIGN_ACCOUNT_ID &&
        process.env.DOCUSIGN_USER_ID
    );
  },
  async sendEnvelope(payload: Record<string, unknown>): Promise<IntegrationResult> {
    if (!this.isLive()) {
      return {
        ok: true,
        provider: "docusign",
        mode: "stub",
        data: { envelopeId: `stub-${Date.now()}`, status: "sent", ...payload },
      };
    }
    return {
      ok: false,
      provider: "docusign",
      mode: "live",
      error: "DocuSign live send not configured in this build",
    };
  },
};
