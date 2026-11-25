import { addDays, format, isValid, parseISO } from "date-fns"

/** Default payment term (PRD §6.5.1). */
export const DUE_IN_DAYS = 14

/** A Date as a SQL date in local time: "2026-11-24". */
export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

/** A SQL date as a local Date (midnight), or null if it isn't one. */
export function fromIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = parseISO(value)
  return isValid(date) ? date : null
}

/** The browser's (or server's) local date today. */
export function localToday(now: Date = new Date()): string {
  return toIsoDate(now)
}

/** "2026-11-24" + 14 → "2026-12-08". */
export function addDaysIso(value: string, days: number): string {
  const date = fromIsoDate(value)
  if (!date) throw new Error(`Not a date: ${value}`)
  return toIsoDate(addDays(date, days))
}

export function defaultDueDate(invoiceDate: string): string {
  return addDaysIso(invoiceDate, DUE_IN_DAYS)
}
