import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  approveProblemReport,
  createProblemReport,
  transitionProblemReport,
  updateProblemReport,
} from "./repository";
import type { ProblemReportPlan } from "./types";

const databaseEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
const originalEnv = new Map<string, string | undefined>();

const plan: ProblemReportPlan = {
  title: "Fix the broken control",
  summary: "Correct the event handler and cover the regression.",
  steps: ["Reproduce the issue", "Fix the handler", "Run focused checks"],
  filesLikely: ["src/components/example.tsx"],
  riskLevel: "low",
  riskNotes: "Scoped UI change.",
  implementationPrompt: "Inspect the component and implement the smallest safe correction.",
};

before(() => {
  for (const key of databaseEnvKeys) {
    originalEnv.set(key, process.env[key]);
    delete process.env[key];
  }
});

after(() => {
  for (const key of databaseEnvKeys) {
    const value = originalEnv.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("problem report state transitions", () => {
  it("binds approval to the displayed plan version and rejects stale transitions", async () => {
    const report = await createProblemReport({
      profile: {
        id: "dev-user",
        email: "dev@example.com",
        organizationId: "org-test",
        role: "admin",
        fullName: "Dev User",
        agentId: null,
      },
      pageUrl: "/listings",
    });

    const claimed = await transitionProblemReport(
      report.id,
      report.organizationId,
      { status: "open", planVersion: 0 },
      { status: "analyzing" }
    );
    assert.equal(claimed?.status, "analyzing");

    const staleClaim = await transitionProblemReport(
      report.id,
      report.organizationId,
      { status: "open", planVersion: 0 },
      { status: "analyzing" }
    );
    assert.equal(staleClaim, null);

    const ready = await transitionProblemReport(
      report.id,
      report.organizationId,
      { status: "analyzing", planVersion: 0 },
      { status: "plan_ready", plan, planVersion: 1 }
    );
    assert.equal(ready?.planVersion, 1);

    const staleApproval = await approveProblemReport(
      report.id,
      report.organizationId,
      "dev-user",
      2
    );
    assert.equal(staleApproval, null);

    const approved = await approveProblemReport(
      report.id,
      report.organizationId,
      "dev-user",
      1
    );
    assert.equal(approved?.status, "approved");
    assert.match(approved?.cursorAgentId ?? "", /^bc-[0-9a-f-]{36}$/);

    const staleRejection = await transitionProblemReport(
      report.id,
      report.organizationId,
      { status: "plan_ready", planVersion: 1 },
      { status: "rejected" }
    );
    assert.equal(staleRejection, null);
  });

  it("uses a new Cursor agent id for an approved revision", async () => {
    const report = await createProblemReport({
      profile: {
        id: "dev-user",
        email: "dev@example.com",
        organizationId: "org-test",
        role: "admin",
        fullName: "Dev User",
        agentId: null,
      },
      pageUrl: "/reviews",
    });
    const ready = await transitionProblemReport(
      report.id,
      report.organizationId,
      { status: "open", planVersion: 0 },
      { status: "plan_ready", plan, planVersion: 1 }
    );
    assert.ok(ready);
    const firstApproval = await approveProblemReport(
      report.id,
      report.organizationId,
      "dev-user",
      1
    );
    assert.ok(firstApproval?.cursorAgentId);

    await updateProblemReport(report.id, report.organizationId, { status: "failed" });
    const revisionClaim = await transitionProblemReport(
      report.id,
      report.organizationId,
      { status: "failed", planVersion: 1 },
      {
        status: "analyzing",
        cursorAgentId: null,
        cursorRunId: null,
        prUrl: null,
        approvedAt: null,
        approvedBy: null,
      }
    );
    assert.ok(revisionClaim);
    const revisedPlan = await transitionProblemReport(
      report.id,
      report.organizationId,
      { status: "analyzing", planVersion: 1 },
      { status: "plan_ready", plan, planVersion: 2 }
    );
    assert.ok(revisedPlan);
    const secondApproval = await approveProblemReport(
      report.id,
      report.organizationId,
      "dev-user",
      2
    );
    assert.ok(secondApproval?.cursorAgentId);
    assert.notEqual(secondApproval.cursorAgentId, firstApproval.cursorAgentId);
  });
});
