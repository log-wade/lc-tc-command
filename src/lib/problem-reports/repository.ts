import {
  createServiceClient,
  isDatabaseConfigured,
  useMemoryStore as shouldUseMemoryStore,
} from "@/lib/supabase/server";
import type { SessionProfile } from "@/lib/supabase/server-auth";
import type {
  ProblemReport,
  ProblemReportMessage,
  ProblemReportPatch,
  ProblemReportPlan,
  ProblemReportStatus,
} from "./types";

type ProblemReportRow = {
  id: string;
  organization_id: string;
  reporter_id: string | null;
  page_url: string;
  status: ProblemReportStatus;
  messages: ProblemReportMessage[];
  plan: ProblemReportPlan | null;
  plan_version: number;
  cursor_agent_id: string | null;
  cursor_run_id: string | null;
  pr_url: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
  approved_at: string | null;
  approved_by: string | null;
  next_retry_at: string | null;
  created_at: string;
  updated_at: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const memoryReports = new Map<string, ProblemReport>();
const ACTIVE_IMPLEMENTATION_STATUSES: ProblemReportStatus[] = [
  "approved",
  "implementing",
  "pr_open",
];

function normalizeUserId(id: string | null | undefined): string | null {
  return id && UUID_RE.test(id) ? id : null;
}

function fromRow(row: ProblemReportRow): ProblemReport {
  return {
    id: row.id,
    organizationId: row.organization_id,
    reporterId: row.reporter_id,
    pageUrl: row.page_url,
    status: row.status,
    messages: row.messages ?? [],
    plan: row.plan,
    planVersion: row.plan_version,
    cursorAgentId: row.cursor_agent_id,
    cursorRunId: row.cursor_run_id,
    prUrl: row.pr_url,
    error: row.error,
    metadata: row.metadata ?? {},
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    nextRetryAt: row.next_retry_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRowPatch(patch: ProblemReportPatch): Record<string, unknown> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (patch.status !== undefined) row.status = patch.status;
  if (patch.messages !== undefined) row.messages = patch.messages;
  if (patch.plan !== undefined) row.plan = patch.plan;
  if (patch.planVersion !== undefined) row.plan_version = patch.planVersion;
  if (patch.cursorAgentId !== undefined) row.cursor_agent_id = patch.cursorAgentId;
  if (patch.cursorRunId !== undefined) row.cursor_run_id = patch.cursorRunId;
  if (patch.prUrl !== undefined) row.pr_url = patch.prUrl;
  if (patch.error !== undefined) row.error = patch.error;
  if (patch.metadata !== undefined) row.metadata = patch.metadata;
  if (patch.approvedAt !== undefined) row.approved_at = patch.approvedAt;
  if (patch.approvedBy !== undefined) row.approved_by = normalizeUserId(patch.approvedBy);
  if (patch.nextRetryAt !== undefined) row.next_retry_at = patch.nextRetryAt;

  return row;
}

function assertMemoryStoreAvailable(): void {
  if (!shouldUseMemoryStore()) {
    throw new Error("Problem report storage is not configured.");
  }
}

export async function createProblemReport(input: {
  profile: SessionProfile;
  pageUrl: string;
  metadata?: Record<string, unknown>;
  messages?: ProblemReportMessage[];
}): Promise<ProblemReport> {
  const now = new Date().toISOString();
  const values = {
    organization_id: input.profile.organizationId,
    reporter_id: normalizeUserId(input.profile.id),
    page_url: input.pageUrl,
    status: "open" satisfies ProblemReportStatus,
    messages: input.messages ?? [],
    metadata: input.metadata ?? {},
  };

  if (isDatabaseConfigured()) {
    const client = createServiceClient();
    if (!client) throw new Error("Problem report storage is unavailable.");
    const { data, error } = await client
      .from("problem_reports")
      .insert(values)
      .select("*")
      .single();
    if (error) throw new Error(`Could not create problem report: ${error.message}`);
    return fromRow(data as ProblemReportRow);
  }

  assertMemoryStoreAvailable();
  const report: ProblemReport = {
    id: crypto.randomUUID(),
    organizationId: input.profile.organizationId,
    reporterId: normalizeUserId(input.profile.id),
    pageUrl: input.pageUrl,
    status: "open",
    messages: input.messages ?? [],
    plan: null,
    planVersion: 0,
    cursorAgentId: null,
    cursorRunId: null,
    prUrl: null,
    error: null,
    metadata: input.metadata ?? {},
    approvedAt: null,
    approvedBy: null,
    nextRetryAt: null,
    createdAt: now,
    updatedAt: now,
  };
  memoryReports.set(report.id, report);
  return report;
}

export async function getProblemReport(
  id: string,
  organizationId: string
): Promise<ProblemReport | null> {
  if (isDatabaseConfigured()) {
    const client = createServiceClient();
    if (!client) throw new Error("Problem report storage is unavailable.");
    const { data, error } = await client
      .from("problem_reports")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (error) throw new Error(`Could not load problem report: ${error.message}`);
    return data ? fromRow(data as ProblemReportRow) : null;
  }

  assertMemoryStoreAvailable();
  const report = memoryReports.get(id);
  return report?.organizationId === organizationId ? structuredClone(report) : null;
}

export async function updateProblemReport(
  id: string,
  organizationId: string,
  patch: ProblemReportPatch
): Promise<ProblemReport> {
  if (isDatabaseConfigured()) {
    const client = createServiceClient();
    if (!client) throw new Error("Problem report storage is unavailable.");
    const { data, error } = await client
      .from("problem_reports")
      .update(toRowPatch(patch))
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select("*")
      .single();
    if (error) throw new Error(`Could not update problem report: ${error.message}`);
    return fromRow(data as ProblemReportRow);
  }

  assertMemoryStoreAvailable();
  const current = memoryReports.get(id);
  if (!current || current.organizationId !== organizationId) {
    throw new Error("Problem report not found.");
  }
  const next: ProblemReport = {
    ...current,
    ...patch,
    approvedBy:
      patch.approvedBy === undefined ? current.approvedBy : normalizeUserId(patch.approvedBy),
    updatedAt: new Date().toISOString(),
  };
  memoryReports.set(id, next);
  return structuredClone(next);
}

export async function transitionProblemReport(
  id: string,
  organizationId: string,
  expected: { status: ProblemReportStatus; planVersion: number },
  patch: ProblemReportPatch
): Promise<ProblemReport | null> {
  if (isDatabaseConfigured()) {
    const client = createServiceClient();
    if (!client) throw new Error("Problem report storage is unavailable.");
    const { data, error } = await client
      .from("problem_reports")
      .update(toRowPatch(patch))
      .eq("id", id)
      .eq("organization_id", organizationId)
      .eq("status", expected.status)
      .eq("plan_version", expected.planVersion)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Could not transition problem report: ${error.message}`);
    return data ? fromRow(data as ProblemReportRow) : null;
  }

  assertMemoryStoreAvailable();
  const current = memoryReports.get(id);
  if (
    !current ||
    current.organizationId !== organizationId ||
    current.status !== expected.status ||
    current.planVersion !== expected.planVersion
  ) {
    return null;
  }
  return updateProblemReport(id, organizationId, patch);
}

export async function approveProblemReport(
  id: string,
  organizationId: string,
  approverId: string,
  planVersion: number
): Promise<ProblemReport | null> {
  const now = new Date().toISOString();
  const cursorAgentId = `bc-${crypto.randomUUID()}`;
  const patch: ProblemReportPatch = {
    status: "approved",
    approvedAt: now,
    approvedBy: approverId,
    cursorAgentId,
    cursorRunId: null,
    prUrl: null,
    nextRetryAt: null,
    error: null,
  };
  return transitionProblemReport(
    id,
    organizationId,
    { status: "plan_ready", planVersion },
    patch
  );
}

export async function listActiveProblemReports(): Promise<ProblemReport[]> {
  if (isDatabaseConfigured()) {
    const client = createServiceClient();
    if (!client) throw new Error("Problem report storage is unavailable.");
    const { data, error } = await client
      .from("problem_reports")
      .select("*")
      .in("status", ACTIVE_IMPLEMENTATION_STATUSES)
      .order("updated_at", { ascending: true })
      .limit(25);
    if (error) throw new Error(`Could not list active problem reports: ${error.message}`);
    return ((data ?? []) as ProblemReportRow[]).map(fromRow);
  }

  assertMemoryStoreAvailable();
  return [...memoryReports.values()]
    .filter((report) => ACTIVE_IMPLEMENTATION_STATUSES.includes(report.status))
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    .slice(0, 25)
    .map((report) => structuredClone(report));
}
