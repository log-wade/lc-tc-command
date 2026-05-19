import { addBusinessDays, addDays, setHours, setMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import type { Deadline } from "../types";

const CT = "America/Chicago";

export interface TransactionDeadlineInput {
  transactionId: string;
  effectiveDate: Date;
  closingDate: Date;
  optionDays: number;
  financingDays: number;
}

export interface ComputedDeadline {
  deadline_type: string;
  label: string;
  due_at: Date;
}

/** Texas residential standard deadlines from effective date (design doc §5.4) */
export function computeTransactionDeadlines(
  input: TransactionDeadlineInput
): ComputedDeadline[] {
  const { effectiveDate, closingDate, optionDays, financingDays } = input;
  const eff = effectiveDate;

  const optionEnd = setMinutes(setHours(addDays(eff, optionDays), 17), 0);

  return [
    {
      deadline_type: "option_fee_due",
      label: "Option Fee Due (1 day after effective)",
      due_at: addDays(eff, 1),
    },
    {
      deadline_type: "earnest_money_due",
      label: "Earnest Money Due (3 days after effective)",
      due_at: addDays(eff, 3),
    },
    {
      deadline_type: "option_period_end",
      label: "Option Period Ends (5:00 PM CT)",
      due_at: optionEnd,
    },
    {
      deadline_type: "loan_application",
      label: "Loan Application Due (per TREC 40-10)",
      due_at: addDays(eff, 5),
    },
    {
      deadline_type: "buyer_approval",
      label: "Buyer Approval Notice Deadline",
      due_at: addDays(eff, financingDays),
    },
    {
      deadline_type: "title_commitment",
      label: "Title Commitment Due (20 days)",
      due_at: addDays(eff, 20),
    },
    {
      deadline_type: "hoa_docs",
      label: "HOA Documents Delivery",
      due_at: addDays(eff, 15),
    },
    {
      deadline_type: "survey",
      label: "Survey Delivery",
      due_at: addDays(eff, 20),
    },
    {
      deadline_type: "cd_issue",
      label: "Closing Disclosure Issue (3 business days pre-close)",
      due_at: addBusinessDays(closingDate, -3),
    },
    {
      deadline_type: "closing",
      label: "Closing Date",
      due_at: setMinutes(setHours(closingDate, 17), 0),
    },
    {
      deadline_type: "da_to_title",
      label: "DA to Title (day before closing)",
      due_at: addDays(closingDate, -1),
    },
  ];
}

export function formatDeadlineCt(d: Date): string {
  return formatInTimeZone(d, CT, "MMM d, yyyy h:mm a zzz");
}

export function deadlinesToRecords(
  fileType: "transaction",
  fileId: string,
  computed: ComputedDeadline[]
): Omit<Deadline, "id">[] {
  return computed.map((c) => ({
    file_type: fileType,
    file_id: fileId,
    deadline_type: c.deadline_type,
    label: c.label,
    due_at: c.due_at.toISOString(),
    status: "pending",
  }));
}

export function getReminderWindows(dueAt: Date, now = new Date()) {
  const ms = dueAt.getTime() - now.getTime();
  const hours = ms / (1000 * 60 * 60);
  return {
    t7d: hours <= 24 * 7 && hours > 24 * 6,
    t2d: hours <= 48 && hours > 24,
    t1d: hours <= 24 && hours > 4,
    t4h: hours <= 4 && hours > 0,
    t0: hours <= 0,
  };
}
