import { formatInTimeZone } from "date-fns-tz";
import type { Deadline } from "../types";
import {
  CENTRAL_TZ,
  addBusinessDays,
  addCalendarDays,
  addContractDays,
  centralInstant,
  toCalendarDate,
  type CalendarDate,
} from "./calendar";

const CT = CENTRAL_TZ;

/** Default contract write-ins when intake does not capture them. */
export const DEFAULT_OPTION_DAYS = 10;
export const DEFAULT_FINANCING_DAYS = 21;
export const DEFAULT_TITLE_COMMITMENT_DAYS = 20;
export const DEFAULT_SURVEY_DAYS = 5;
export const DEFAULT_HOA_DAYS = 15;

/** Option fee and earnest money are both due within 3 days of execution. */
const FUNDS_CONTRACT_DAYS = 3;
/** TRID: the CD must be issued at least 3 business days before consummation. */
const CD_BUSINESS_DAYS_BEFORE_CLOSE = 3;
/** Title needs the disbursement authorization the last business day before closing at the latest. */
const DA_BUSINESS_DAYS_BEFORE_CLOSE = 1;

export interface TransactionDeadlineInput {
  transactionId: string;
  /** Contract effective (execution) date as a calendar date, e.g. "2026-08-13". */
  effectiveDate: string | Date;
  closingDate: string | Date;
  optionDays: number;
  financingDays: number;
  titleCommitmentDays?: number;
  /** Days after execution for survey + T-47 delivery per contract; omit when no survey applies. */
  surveyDays?: number | null;
  hasHoa?: boolean;
}

export interface ComputedDeadline {
  deadline_type: string;
  label: string;
  due_at: Date;
}

/**
 * Texas residential deadlines, all pinned to 5:00 PM Central. Performance dates
 * count forward from the effective date, where the execution day itself is day 0,
 * and most roll to the next open day when they land on a weekend or banking holiday
 * (TREC ¶5A for option fee / earnest money delivery).
 *
 * Two notice deadlines never roll — they end on their calendar day even on a
 * weekend or holiday, and ¶5E makes time of the essence with no grace:
 * - Option period end (¶5B)
 * - Buyer financing approval notice (Third Party Financing Addendum ¶2B)
 *
 * Showing either one day late would quietly extend a hard buyer termination /
 * notice right past the true deadline.
 */
export function computeTransactionDeadlines(
  input: TransactionDeadlineInput
): ComputedDeadline[] {
  const effective: CalendarDate = toCalendarDate(input.effectiveDate);
  const closing: CalendarDate = toCalendarDate(input.closingDate);
  const optionDays = positiveOr(input.optionDays, DEFAULT_OPTION_DAYS);
  const financingDays = positiveOr(input.financingDays, DEFAULT_FINANCING_DAYS);
  const titleDays = positiveOr(input.titleCommitmentDays, DEFAULT_TITLE_COMMITMENT_DAYS);
  const surveyDays =
    input.surveyDays == null ? null : positiveOr(input.surveyDays, DEFAULT_SURVEY_DAYS);

  const fundsDue = addContractDays(effective, FUNDS_CONTRACT_DAYS);

  const deadlines: ComputedDeadline[] = [
    {
      deadline_type: "option_fee_due",
      label: "Option Fee Due (3 days from execution, next business day if closed)",
      due_at: centralInstant(fundsDue),
    },
    {
      deadline_type: "earnest_money_due",
      label: "Earnest Money Due (3 days from execution, next business day if closed)",
      due_at: centralInstant(fundsDue),
    },
    {
      deadline_type: "option_period_end",
      label: `Option Period Ends (${optionDays} days from execution — 5:00 PM CT)`,
      due_at: centralInstant(addCalendarDays(effective, optionDays)),
    },
  ];

  if (surveyDays != null) {
    const surveyDue = addContractDays(effective, surveyDays);
    deadlines.push(
      {
        deadline_type: "survey",
        label: `Survey Delivery (${surveyDays} days from execution)`,
        due_at: centralInstant(surveyDue),
      },
      {
        deadline_type: "t47_residential",
        label: `T-47 Affidavit (with survey — ${surveyDays} days from execution)`,
        due_at: centralInstant(surveyDue),
      }
    );
  }

  if (input.hasHoa) {
    deadlines.push({
      deadline_type: "hoa_docs",
      label: `HOA Documents Delivery (${DEFAULT_HOA_DAYS} days from execution)`,
      due_at: centralInstant(addContractDays(effective, DEFAULT_HOA_DAYS)),
    });
  }

  deadlines.push(
    {
      deadline_type: "title_commitment",
      label: `Title Commitment Due (${titleDays} days from execution)`,
      due_at: centralInstant(addContractDays(effective, titleDays)),
    },
    {
      deadline_type: "buyer_approval",
      label: `Buyer Financing Approval Notice (${financingDays} days from execution — calendar days, no extension)`,
      due_at: centralInstant(addCalendarDays(effective, financingDays)),
    },
    {
      deadline_type: "cd_issue",
      label: "Closing Disclosure Issued (3 business days before closing)",
      due_at: centralInstant(addBusinessDays(closing, -CD_BUSINESS_DAYS_BEFORE_CLOSE)),
    },
    {
      deadline_type: "da_to_title",
      label: "DA to Title (last business day before closing)",
      due_at: centralInstant(addBusinessDays(closing, -DA_BUSINESS_DAYS_BEFORE_CLOSE)),
    },
    {
      deadline_type: "closing",
      label: "Closing Date",
      due_at: centralInstant(closing),
    }
  );

  return deadlines;
}

function positiveOr(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.trunc(value)
    : fallback;
}

/** End of next business day (Mon–Fri) in America/Chicago for weekend intakes. */
export function introEmailDueBy(from = new Date()): Date {
  const day = from.getDay(); // 0 Sun … 6 Sat
  const due = new Date(from);

  if (day === 0) {
    // Sunday → Monday EOD
    due.setDate(due.getDate() + 1);
  } else if (day === 6) {
    // Saturday → Monday EOD
    due.setDate(due.getDate() + 2);
  } else {
    // Weekday → 24 hours from now
    return new Date(from.getTime() + 24 * 60 * 60 * 1000);
  }

  due.setHours(17, 0, 0, 0);
  return due;
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
