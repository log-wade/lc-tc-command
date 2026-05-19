import { mlsAdapter } from "./mls";
import { docusignAdapter } from "./docusign";
import { showingtimeAdapter } from "./showingtime";
import { titleAdapter } from "./title";
import type { IntegrationAdapter, IntegrationProvider } from "./types";

const adapters: Record<IntegrationProvider, IntegrationAdapter> = {
  mls: mlsAdapter,
  docusign: docusignAdapter,
  showingtime: showingtimeAdapter,
  supra: showingtimeAdapter,
  title: titleAdapter,
  resend: {
    provider: "resend",
    isLive: () => Boolean(process.env.RESEND_API_KEY),
  },
};

export function getAdapter(provider: IntegrationProvider): IntegrationAdapter {
  return adapters[provider];
}

export function integrationStatus(): { provider: IntegrationProvider; mode: "live" | "stub" }[] {
  return (Object.keys(adapters) as IntegrationProvider[]).map((provider) => ({
    provider,
    mode: adapters[provider].isLive() ? "live" : "stub",
  }));
}
