import type { EmailTemplate } from "../templates/catalog";

export type RecipientInputs = {
  template: EmailTemplate;
  sellerEmail?: string;
  clientEmail?: string;
  thirdPartyEmail?: string;
  agentEmail?: string;
  /** Carly / ops inbox — always CC'd on client sends when different from `to`. */
  alertEmail?: string;
};

export type ResolvedRecipients = {
  to: string[];
  cc: string[];
  /** True when we had to send to ALERT_EMAIL because the client address was missing. */
  usedAlertFallback: boolean;
  reason?: string;
};

function normalizeEmail(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || !trimmed.includes("@")) return undefined;
  return trimmed.toLowerCase();
}

function uniqueEmails(emails: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const email of emails) {
    const normalized = normalizeEmail(email);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

/**
 * Pick To/CC for an approved template send.
 * Client-facing mail goes to the seller/client (or title/lender for tpl-6);
 * ALERT_EMAIL is CC'd so Carly still sees every outbound message.
 */
export function resolveSendRecipients(input: RecipientInputs): ResolvedRecipients {
  const alert = normalizeEmail(input.alertEmail);
  const seller = normalizeEmail(input.sellerEmail);
  const client = normalizeEmail(input.clientEmail);
  const thirdParty = normalizeEmail(input.thirdPartyEmail);
  const agent = normalizeEmail(input.agentEmail);

  const withAlertCc = (to: string[]): ResolvedRecipients => {
    const cc = alert && !to.includes(alert) ? [alert] : [];
    return { to, cc, usedAlertFallback: false };
  };

  const alertOnly = (reason: string): ResolvedRecipients => {
    if (!alert) {
      return {
        to: [],
        cc: [],
        usedAlertFallback: true,
        reason: `${reason}; ALERT_EMAIL also missing`,
      };
    }
    return { to: [alert], cc: [], usedAlertFallback: true, reason };
  };

  switch (input.template.category) {
    case "Internal": {
      if (agent) return withAlertCc([agent]);
      return alertOnly("agent email missing for internal template");
    }
    case "Listing": {
      if (seller) return withAlertCc([seller]);
      return alertOnly("seller_email missing on listing");
    }
    case "Transaction": {
      // Title + lender intro goes to the third party when we have their address.
      if (input.template.id === "tpl-6") {
        if (thirdParty) {
          const to = [thirdParty];
          const cc = uniqueEmails([client, alert].filter((e) => e && !to.includes(e)));
          return { to, cc, usedAlertFallback: false };
        }
        if (client) return withAlertCc([client]);
        return alertOnly("third_party_email and client_email missing for tpl-6");
      }
      if (client) return withAlertCc([client]);
      return alertOnly("client_email missing on transaction");
    }
    default: {
      const _exhaustive: never = input.template.category;
      return alertOnly(`unknown template category: ${_exhaustive}`);
    }
  }
}
