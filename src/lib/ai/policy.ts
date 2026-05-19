export type PolicyCheck = {
  action: string;
  toolName?: string;
  fileType?: string;
  fileId?: string;
  userRole?: string;
};

export type PolicyResult = {
  allowed: boolean;
  reason?: string;
  level: "allowed" | "warn" | "blocked";
};

const BLOCKED_ACTIONS = new Set([
  "delete_all",
  "export_pii_bulk",
  "wire_funds",
]);

const BROKER_ONLY = new Set(["broker_dashboard_export", "org_settings_write"]);

export function enforcePolicy(check: PolicyCheck): PolicyResult {
  if (BLOCKED_ACTIONS.has(check.action) || (check.toolName && BLOCKED_ACTIONS.has(check.toolName))) {
    return { allowed: false, reason: "Action blocked by compliance policy", level: "blocked" };
  }

  if (check.toolName && BROKER_ONLY.has(check.toolName)) {
    const role = check.userRole ?? "coordinator";
    if (!["broker", "mca", "admin"].includes(role)) {
      return { allowed: false, reason: "Broker or admin role required", level: "blocked" };
    }
  }

  if (check.action.startsWith("workflow:") && check.action.includes("delete")) {
    return { allowed: false, reason: "Destructive workflows are disabled", level: "blocked" };
  }

  return { allowed: true, level: "allowed" };
}
