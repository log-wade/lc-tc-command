import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatInTimeZone } from "date-fns-tz";
import {
  addBusinessDays,
  addCalendarDays,
  addContractDays,
  centralInstant,
  isBankingHoliday,
} from "./calendar";
import { computeTransactionDeadlines, type TransactionDeadlineInput } from "./engine";

const CT = "America/Chicago";

function ctDate(due: Date): string {
  return formatInTimeZone(due, CT, "yyyy-MM-dd");
}

function ctTime(due: Date): string {
  return formatInTimeZone(due, CT, "HH:mm");
}

/** Contract from the Aug 13 intake: 7-day option, 21-day financing, Sep 14 close. */
const contract: TransactionDeadlineInput = {
  transactionId: "txn-test",
  effectiveDate: "2026-08-13",
  closingDate: "2026-09-14",
  optionDays: 7,
  financingDays: 21,
  titleCommitmentDays: 21,
  surveyDays: 5,
};

function byType(input = contract) {
  return new Map(computeTransactionDeadlines(input).map((d) => [d.deadline_type, d]));
}

describe("computeTransactionDeadlines", () => {
  it("counts option period as calendar days from the effective date, ending 5 PM CT", () => {
    const optionEnd = byType().get("option_period_end")!;
    assert.equal(ctDate(optionEnd.due_at), "2026-08-20");
    assert.equal(ctTime(optionEnd.due_at), "17:00");
  });

  it("does not shift dates when the process runs outside Central time", () => {
    const original = process.env.TZ;
    process.env.TZ = "UTC";
    try {
      assert.equal(ctDate(byType().get("closing")!.due_at), "2026-09-14");
    } finally {
      process.env.TZ = original;
    }
  });

  it("makes option fee and earnest money due on the same day, 3 days out", () => {
    const map = byType();
    const optionFee = map.get("option_fee_due")!;
    const earnest = map.get("earnest_money_due")!;
    // Thu Aug 13 + 3 days lands on Sun Aug 16, so performance moves to Mon Aug 17.
    assert.equal(ctDate(optionFee.due_at), "2026-08-17");
    assert.equal(ctDate(earnest.due_at), "2026-08-17");
    assert.match(optionFee.label, /3 days from execution/);
  });

  it("skips a banking holiday when funds land on one", () => {
    // Executed Fri Jul 3 2026: +3 days is Mon Jul 6, but Jul 3 is the observed
    // Independence Day and the weekend follows, so Monday is the first open day.
    const map = byType({ ...contract, effectiveDate: "2026-07-01" });
    // Jul 1 + 3 = Sat Jul 4 → Jul 3 is the observed holiday → Mon Jul 6.
    assert.equal(ctDate(map.get("option_fee_due")!.due_at), "2026-07-06");
  });

  it("never extends the option period end past its calendar day", () => {
    // Aug 15 2026 is a Saturday and must stay a Saturday: the right to terminate
    // does not get quietly pushed to Monday.
    const map = byType({ ...contract, effectiveDate: "2026-08-08", optionDays: 7 });
    assert.equal(ctDate(map.get("option_period_end")!.due_at), "2026-08-15");
  });

  it("never extends financing approval notice past its calendar day", () => {
    // Third Party Financing Addendum ¶2B is time of the essence — same strict
    // calendar-day rule as the option period. Thu Aug 13 + 17 lands on Sun Aug 30.
    const map = byType({ ...contract, financingDays: 17 });
    assert.equal(ctDate(map.get("buyer_approval")!.due_at), "2026-08-30");
  });

  it("never emits a loan application deadline", () => {
    assert.equal(byType().has("loan_application"), false);
  });

  it("uses the contract write-in for title commitment days", () => {
    const titleCommitment = byType().get("title_commitment")!;
    assert.equal(ctDate(titleCommitment.due_at), "2026-09-03");
    assert.match(titleCommitment.label, /21 days/);
  });

  it("pins survey and T-47 to the contract delivery window, not the title window", () => {
    const map = byType();
    assert.equal(ctDate(map.get("survey")!.due_at), "2026-08-18");
    assert.equal(ctDate(map.get("t47_residential")!.due_at), "2026-08-18");
  });

  it("omits survey and T-47 when no survey applies", () => {
    const map = byType({ ...contract, surveyDays: null });
    assert.equal(map.has("survey"), false);
    assert.equal(map.has("t47_residential"), false);
  });

  it("puts buyer financing approval at the financing day count", () => {
    const approval = byType().get("buyer_approval")!;
    assert.equal(ctDate(approval.due_at), "2026-09-03");
    assert.match(approval.label, /Buyer Financing Approval Notice/);
  });

  it("backs the CD and DA off the closing date by business days", () => {
    const map = byType();
    // Closing is Mon Sep 14: three business days back is Wed Sep 9, one is Fri Sep 11.
    assert.equal(ctDate(map.get("cd_issue")!.due_at), "2026-09-09");
    assert.equal(ctDate(map.get("da_to_title")!.due_at), "2026-09-11");
  });

  it("adds HOA delivery only when the property has an HOA", () => {
    assert.equal(byType().has("hoa_docs"), false);
    assert.equal(byType({ ...contract, hasHoa: true }).has("hoa_docs"), true);
  });
});

describe("central calendar helpers", () => {
  it("adds calendar days across a month boundary", () => {
    assert.equal(addCalendarDays("2026-08-13", 21), "2026-09-03");
  });

  it("skips weekends in both directions", () => {
    assert.equal(addBusinessDays("2026-08-13", 3), "2026-08-18");
    assert.equal(addBusinessDays("2026-09-14", -1), "2026-09-11");
    assert.equal(addBusinessDays("2026-09-14", -3), "2026-09-09");
  });

  it("treats banking holidays as closed, including weekend observances", () => {
    assert.equal(isBankingHoliday("2026-01-01"), true); // New Year's Day
    assert.equal(isBankingHoliday("2026-01-19"), true); // MLK Jr. Day
    assert.equal(isBankingHoliday("2026-05-25"), true); // Memorial Day
    assert.equal(isBankingHoliday("2026-06-19"), true); // Juneteenth
    assert.equal(isBankingHoliday("2026-07-03"), true); // Jul 4 falls Saturday
    assert.equal(isBankingHoliday("2026-09-07"), true); // Labor Day
    assert.equal(isBankingHoliday("2026-11-26"), true); // Thanksgiving
    assert.equal(isBankingHoliday("2026-12-25"), true); // Christmas Day
    assert.equal(isBankingHoliday("2026-08-17"), false);
  });

  it("rolls contract days past a holiday weekend", () => {
    // Wed Nov 25 + 1 day is Thanksgiving, so performance lands on Fri Nov 27.
    assert.equal(addContractDays("2026-11-25", 1), "2026-11-27");
    // Labor Day weekend: Fri Sep 4 + 3 days is Mon Sep 7 → Tue Sep 8.
    assert.equal(addContractDays("2026-09-04", 3), "2026-09-08");
  });

  it("skips holidays when counting business days back from closing", () => {
    // Closing Tue Sep 8 2026: back three business days crosses Labor Day (Sep 7).
    assert.equal(addBusinessDays("2026-09-08", -3), "2026-09-02");
  });

  it("survives the fall daylight saving transition", () => {
    const before = centralInstant("2026-10-31");
    const after = centralInstant("2026-11-02");
    assert.equal(ctTime(before), "17:00");
    assert.equal(ctTime(after), "17:00");
  });
});
