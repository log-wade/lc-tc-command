import { formatInTimeZone } from "date-fns-tz";
import type { Deadline } from "../types";

const CT = "America/Chicago";

export type KeyDateRow = {
  item: string;
  dueDate: string;
  days: string;
  completed: string;
  sendToNotes: string;
};

const TYPE_LABELS: Record<string, string> = {
  option_fee_due: "Option Fee Due",
  earnest_money_due: "Earnest Money Due",
  option_period_end: "Option Period Ends",
  loan_application: "Loan Application Due",
  buyer_approval: "Buyer Approval Deadline",
  title_commitment: "Title Commitment Due",
  survey: "Survey Delivery",
  t47_residential: "T-47 Residential Real Property Affidavit",
  hoa_docs: "HOA Documents Delivery",
  closing: "Closing Date",
  cd_issue: "Closing Disclosure Issue",
  da_to_title: "DA to Title",
};

const CLIENT_FACING_TYPES = [
  "option_fee_due",
  "earnest_money_due",
  "option_period_end",
  "loan_application",
  "buyer_approval",
  "title_commitment",
  "survey",
  "t47_residential",
  "hoa_docs",
  "closing",
] as const;

function daysLabel(deadlineType: string, optionDays?: number, financingDays?: number): string {
  switch (deadlineType) {
    case "option_fee_due":
      return "1 day";
    case "earnest_money_due":
      return "3 days";
    case "option_period_end":
      return `${optionDays ?? 10} days`;
    case "loan_application":
      return "5 days";
    case "buyer_approval":
      return `${financingDays ?? 21} days`;
    case "title_commitment":
      return "20 days";
    case "survey":
      return "20 days";
    case "t47_residential":
      return "With survey / per contract";
    case "hoa_docs":
      return "15 days";
    case "closing":
      return "Contractual";
    default:
      return "—";
  }
}

function notesForType(
  deadlineType: string,
  titleCompany?: string
): string {
  switch (deadlineType) {
    case "option_fee_due":
    case "earnest_money_due":
      return titleCompany ? `Send to: ${titleCompany}` : "Send to title / escrow";
    case "loan_application":
    case "buyer_approval":
      return "Via lender";
    case "title_commitment":
      return titleCompany ? `From: ${titleCompany}` : "From title company";
    case "survey":
      return "Buyer / surveyor per contract";
    case "t47_residential":
      return "Seller delivers with survey (if applicable)";
    case "hoa_docs":
      return "Seller / HOA management";
    case "closing":
      return titleCompany ? `At: ${titleCompany}` : "At title company";
    default:
      return "";
  }
}

export function buildKeyDateRows(params: {
  deadlines: Deadline[];
  optionDays?: number;
  financingDays?: number;
  hasHoa?: boolean;
  titleCompany?: string;
}): KeyDateRow[] {
  const { deadlines, optionDays, financingDays, hasHoa, titleCompany } = params;
  const byType = new Map(deadlines.map((d) => [d.deadline_type, d]));

  return CLIENT_FACING_TYPES.filter((type) => {
    if (type === "hoa_docs" && !hasHoa) return false;
    return byType.has(type) || type === "t47_residential";
  }).map((type) => {
    const d = byType.get(type);
    const dueDate = d
      ? formatInTimeZone(new Date(d.due_at), CT, "MMM d, yyyy")
      : "Per contract";
    const completed =
      d?.status === "met"
        ? formatInTimeZone(new Date(d.due_at), CT, "MMM d, yyyy")
        : d?.status === "waived"
          ? "Waived"
          : "—";

    return {
      item: TYPE_LABELS[type] ?? type,
      dueDate,
      days: daysLabel(type, optionDays, financingDays),
      completed: d?.status === "met" && d.notes ? d.notes : completed,
      sendToNotes: notesForType(type, titleCompany),
    };
  });
}

export function renderKeyDatesTableHtml(rows: KeyDateRow[]): string {
  if (rows.length === 0) {
    return "<p><em>Key dates will be confirmed from your executed contract.</em></p>";
  }

  const header =
    "<tr>" +
    ["Item", "Due date", "Days", "Completed", "Send to / Notes"]
      .map(
        (h) =>
          `<th style="border:1px solid #ddd;padding:8px;text-align:left;background:#f7f5f2;">${h}</th>`
      )
      .join("") +
    "</tr>";

  const body = rows
    .map(
      (r) =>
        "<tr>" +
        [r.item, r.dueDate, r.days, r.completed, r.sendToNotes]
          .map((c) => `<td style="border:1px solid #ddd;padding:8px;vertical-align:top;">${escapeHtml(c)}</td>`)
          .join("") +
        "</tr>"
    )
    .join("");

  return `<table style="border-collapse:collapse;width:100%;font-size:14px;margin:12px 0;">${header}${body}</table>`;
}

export function renderKeyDatesTableText(rows: KeyDateRow[]): string {
  if (rows.length === 0) {
    return "Key dates will be confirmed from your executed contract.";
  }
  return rows
    .map(
      (r) =>
        `• ${r.item}: Due ${r.dueDate} (${r.days}) | Completed: ${r.completed} | ${r.sendToNotes}`
    )
    .join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
