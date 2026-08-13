export const PROBLEM_REPORT_STATUSES = [
  "open",
  "analyzing",
  "plan_ready",
  "approved",
  "implementing",
  "pr_open",
  "merged",
  "deployed",
  "failed",
  "rejected",
] as const;

export type ProblemReportStatus = (typeof PROBLEM_REPORT_STATUSES)[number];

export type ProblemReportMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

export type ProblemReportPlan = {
  title: string;
  summary: string;
  steps: string[];
  filesLikely: string[];
  riskLevel: "low" | "medium" | "high";
  riskNotes: string;
  implementationPrompt: string;
};

export type ProblemReport = {
  id: string;
  organizationId: string;
  reporterId: string | null;
  pageUrl: string;
  status: ProblemReportStatus;
  messages: ProblemReportMessage[];
  plan: ProblemReportPlan | null;
  planVersion: number;
  cursorAgentId: string | null;
  cursorRunId: string | null;
  prUrl: string | null;
  error: string | null;
  metadata: Record<string, unknown>;
  approvedAt: string | null;
  approvedBy: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProblemReportPatch = Partial<
  Pick<
    ProblemReport,
    | "status"
    | "messages"
    | "plan"
    | "planVersion"
    | "cursorAgentId"
    | "cursorRunId"
    | "prUrl"
    | "error"
    | "metadata"
    | "approvedAt"
    | "approvedBy"
    | "nextRetryAt"
  >
>;
