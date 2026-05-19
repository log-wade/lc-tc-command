/**
 * In-memory fallback when Supabase is not configured (local dev / demo).
 * Data resets on cold start — production uses Supabase.
 */
import type { Agent, DashboardStats, Deadline, Listing, Transaction } from "../types";

const agents: Agent[] = [
  {
    id: "agent-1",
    first_name: "Jamie",
    last_name: "Rivera",
    email: "jamie.rivera@kw.com",
    phone: "(512) 555-0100",
    trec_license: "654321-SA",
    role: "agent",
  },
  {
    id: "agent-admin",
    first_name: "Carly",
    last_name: "Bryant",
    email: "carly.bryant@kw.com",
    phone: "(512) 555-0184",
    trec_license: "723235-SA",
    role: "admin",
  },
];

const listings: Listing[] = [
  {
    id: "listing-1",
    property_address: "413 Pecan Hollow Dr",
    city: "Cedar Park",
    state: "TX",
    zip: "78613",
    county: "Williamson",
    status: "active",
    list_price: 485000,
    target_list_date: "2026-04-15",
    actual_list_date: "2026-04-18",
    listing_agent_id: "agent-1",
    compliance_status: "approved",
    go_live_approved: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "listing-2",
    property_address: "1204 Lakeline Blvd Unit 204",
    city: "Austin",
    state: "TX",
    zip: "78717",
    county: "Williamson",
    status: "intake",
    list_price: 325000,
    target_list_date: "2026-05-25",
    listing_agent_id: "agent-1",
    compliance_status: "pending",
    created_at: new Date().toISOString(),
  },
];

const transactions: Transaction[] = [
  {
    id: "txn-1",
    property_address: "892 Summit Ridge Ln",
    side: "buy",
    status: "pending",
    effective_date: "2026-05-01",
    closing_date: "2026-06-15",
    option_days: 10,
    option_fee_amount: 500,
    earnest_money_amount: 15000,
    financing_days: 21,
    supervising_agent_id: "agent-1",
    compliance_status: "submitted",
    created_at: new Date().toISOString(),
  },
];

const deadlines: Deadline[] = [];
const reviews: Array<Record<string, unknown>> = [];
const auditLogs: Array<Record<string, unknown>> = [];
const communications: Array<Record<string, unknown>> = [];

function seedDeadlines() {
  if (deadlines.length > 0) return;
  const now = new Date();
  const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x.toISOString();
  };
  const eff = new Date("2026-05-01");
  deadlines.push(
    {
      id: "dl-1",
      file_type: "transaction",
      file_id: "txn-1",
      deadline_type: "option_period_end",
      label: "Option Period Ends (5 PM)",
      due_at: addDays(eff, 10),
      status: "met",
    },
    {
      id: "dl-2",
      file_type: "transaction",
      file_id: "txn-1",
      deadline_type: "title_commitment",
      label: "Title Commitment Due",
      due_at: addDays(eff, 20),
      status: "pending",
    },
    {
      id: "dl-3",
      file_type: "transaction",
      file_id: "txn-1",
      deadline_type: "closing",
      label: "Closing Date",
      due_at: "2026-06-15T17:00:00.000Z",
      status: "pending",
    },
    {
      id: "dl-4",
      file_type: "listing",
      file_id: "listing-1",
      deadline_type: "tuesday_update",
      label: "Tuesday Client Update (3 PM CT)",
      due_at: new Date(now.getFullYear(), now.getMonth(), now.getDate() + ((2 - now.getDay() + 7) % 7 || 7), 20, 0).toISOString(),
      status: "pending",
    }
  );
}

seedDeadlines();

export const memoryStore = {
  agents: () => [...agents],
  getAgent: (id: string) => agents.find((a) => a.id === id),

  listings: () => [...listings],
  getListing: (id: string) => listings.find((l) => l.id === id),
  createListing: (data: Partial<Listing>) => {
    const id = `listing-${Date.now()}`;
    const listing: Listing = {
      id,
      property_address: data.property_address ?? "",
      status: "intake",
      ...data,
      created_at: new Date().toISOString(),
    };
    listings.push(listing);
    return listing;
  },
  updateListing: (id: string, patch: Partial<Listing>) => {
    const i = listings.findIndex((l) => l.id === id);
    if (i < 0) return null;
    listings[i] = { ...listings[i], ...patch };
    return listings[i];
  },

  transactions: () => [...transactions],
  getTransaction: (id: string) => transactions.find((t) => t.id === id),
  createTransaction: (data: Partial<Transaction>) => {
    const id = `txn-${Date.now()}`;
    const txn: Transaction = {
      id,
      property_address: data.property_address ?? "",
      side: data.side ?? "buy",
      status: "intake",
      ...data,
      created_at: new Date().toISOString(),
    };
    transactions.push(txn);
    return txn;
  },

  deadlines: (fileType?: string, fileId?: string) => {
    seedDeadlines();
    return deadlines.filter(
      (d) =>
        (!fileType || d.file_type === fileType) && (!fileId || d.file_id === fileId)
    );
  },
  createDeadlines: (items: Deadline[]) => {
    deadlines.push(...items);
    return items;
  },

  reviews: () => [...reviews],
  addReview: (item: Record<string, unknown>) => {
    const id = `review-${Date.now()}`;
    reviews.push({ id, status: "pending", created_at: new Date().toISOString(), ...item });
    return reviews[reviews.length - 1];
  },
  resolveReview: (id: string, approved: boolean, notes?: string) => {
    const r = reviews.find((x) => x.id === id);
    if (r) {
      r.status = approved ? "approved" : "rejected";
      r.resolved_at = new Date().toISOString();
      r.resolution_notes = notes;
    }
    return r;
  },

  auditLogs: () => [...auditLogs].reverse(),
  logAudit: (entry: Record<string, unknown>) => {
    auditLogs.push({ id: `audit-${Date.now()}`, created_at: new Date().toISOString(), ...entry });
  },

  communications: () => [...communications],
  addCommunication: (c: Record<string, unknown>) => {
    communications.push({ id: `comm-${Date.now()}`, created_at: new Date().toISOString(), ...c });
    return communications[communications.length - 1];
  },

  stats: (): DashboardStats => {
    seedDeadlines();
    const now = new Date();
    const pending = deadlines.filter((d) => d.status === "pending");
    return {
      activeListings: listings.filter((l) =>
        ["active", "coming_soon", "active_option", "active_contingent", "pending"].includes(l.status)
      ).length,
      activeTransactions: transactions.filter((t) =>
        ["active", "pending", "intake"].includes(t.status)
      ).length,
      pendingReviews: reviews.filter((r) => r.status === "pending").length,
      overdueDeadlines: pending.filter((d) => new Date(d.due_at) < now).length,
      dueToday: pending.filter((d) => {
        const due = new Date(d.due_at);
        return due.toDateString() === now.toDateString();
      }).length,
      openEscalations: 0,
    };
  },
};
