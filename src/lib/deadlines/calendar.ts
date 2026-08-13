import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const CENTRAL_TZ = "America/Chicago";

/**
 * A contract date with no time and no zone, "YYYY-MM-DD".
 *
 * Contract dates are calendar days in Texas, not instants. Keeping them as
 * strings until the last moment avoids the UTC-midnight trap, where
 * `new Date("2026-08-13")` renders as Aug 12 in Central time.
 */
export type CalendarDate = string;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function isCalendarDate(value: string): boolean {
  return DATE_ONLY.test(value.trim()) && !Number.isNaN(Date.parse(`${value.trim()}T00:00:00Z`));
}

/** Normalizes any date input to the Central-time calendar day it falls on. */
export function toCalendarDate(value: string | Date): CalendarDate {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (DATE_ONLY.test(trimmed)) return trimmed;
    return formatInTimeZone(new Date(trimmed), CENTRAL_TZ, "yyyy-MM-dd");
  }
  return formatInTimeZone(value, CENTRAL_TZ, "yyyy-MM-dd");
}

function utcAnchor(date: CalendarDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const anchor = utcAnchor(date);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return anchor.toISOString().slice(0, 10);
}

export function isWeekend(date: CalendarDate): boolean {
  const day = utcAnchor(date).getUTCDay();
  return day === 0 || day === 6;
}

/** Banking holidays — the days title, escrow, and lenders are closed. */
export function isBankingHoliday(date: CalendarDate): boolean {
  return bankingHolidays(Number(date.slice(0, 4))).has(date);
}

/** A day title and escrow can actually perform: not a weekend, not a bank holiday. */
export function isBusinessDay(date: CalendarDate): boolean {
  return !isWeekend(date) && !isBankingHoliday(date);
}

/** Rolls a weekend or holiday forward to the next open day; business dates pass through. */
export function nextBusinessDay(date: CalendarDate): CalendarDate {
  let cursor = date;
  while (!isBusinessDay(cursor)) cursor = addCalendarDays(cursor, 1);
  return cursor;
}

/** Adds (or subtracts, when negative) business days, skipping weekends and holidays. */
export function addBusinessDays(date: CalendarDate, count: number): CalendarDate {
  const step = count >= 0 ? 1 : -1;
  let remaining = Math.abs(count);
  let cursor = date;
  while (remaining > 0) {
    cursor = addCalendarDays(cursor, step);
    if (isBusinessDay(cursor)) remaining -= 1;
  }
  return cursor;
}

/**
 * Counts contract days from an effective date (execution day is day 0), then
 * applies the TREC extension: if the last day to perform is a Saturday, Sunday,
 * or legal holiday, performance is due the end of the next day that is not.
 */
export function addContractDays(date: CalendarDate, days: number): CalendarDate {
  return nextBusinessDay(addCalendarDays(date, days));
}

const holidayCache = new Map<number, Set<CalendarDate>>();

function bankingHolidays(year: number): Set<CalendarDate> {
  const cached = holidayCache.get(year);
  if (cached) return cached;

  const holidays = new Set<CalendarDate>([
    observed(`${year}-01-01`), // New Year's Day
    nthWeekdayOfMonth(year, 1, 1, 3), // MLK Jr. Day
    nthWeekdayOfMonth(year, 2, 1, 3), // Washington's Birthday
    lastWeekdayOfMonth(year, 5, 1), // Memorial Day
    observed(`${year}-06-19`), // Juneteenth
    observed(`${year}-07-04`), // Independence Day
    nthWeekdayOfMonth(year, 9, 1, 1), // Labor Day
    nthWeekdayOfMonth(year, 10, 1, 2), // Columbus Day
    observed(`${year}-11-11`), // Veterans Day
    nthWeekdayOfMonth(year, 11, 4, 4), // Thanksgiving
    observed(`${year}-12-25`), // Christmas Day
    // A Jan 1 that falls on Saturday is observed the previous Friday, i.e. Dec 31.
    observed(`${year + 1}-01-01`),
  ]);

  holidayCache.set(year, holidays);
  return holidays;
}

/** Federal observance: Saturday holidays shift back to Friday, Sunday holidays to Monday. */
function observed(date: CalendarDate): CalendarDate {
  const day = utcAnchor(date).getUTCDay();
  if (day === 6) return addCalendarDays(date, -1);
  if (day === 0) return addCalendarDays(date, 1);
  return date;
}

function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  nth: number
): CalendarDate {
  const first = `${year}-${String(month).padStart(2, "0")}-01`;
  const offset = (weekday - utcAnchor(first).getUTCDay() + 7) % 7;
  return addCalendarDays(first, offset + (nth - 1) * 7);
}

function lastWeekdayOfMonth(year: number, month: number, weekday: number): CalendarDate {
  const firstOfNext =
    month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  let cursor = addCalendarDays(firstOfNext, -1);
  while (utcAnchor(cursor).getUTCDay() !== weekday) cursor = addCalendarDays(cursor, -1);
  return cursor;
}

/** Pins a calendar date to a wall-clock time in Central and returns the instant. */
export function centralInstant(date: CalendarDate, hour = 17, minute = 0): Date {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return fromZonedTime(`${date}T${hh}:${mm}:00`, CENTRAL_TZ);
}

export function formatCalendarDate(date: CalendarDate): string {
  return formatInTimeZone(centralInstant(date, 12), CENTRAL_TZ, "MMM d, yyyy");
}
