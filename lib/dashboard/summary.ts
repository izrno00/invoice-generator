/**
 * Pure dashboard logic (PRD §6.15, Tech.md §8.5): which currencies have
 * activity, which one is shown, the monthly paid series, the trend and the
 * setup checklist. No I/O, so it's unit tested.
 */

import type { CurrencyCode } from "@/lib/validation/profile"

/** One row of `dashboard_summary()`. */
export type SummaryRow = {
  currency: CurrencyCode
  outstandingCount: number
  outstandingCents: number
  overdueCount: number
  overdueCents: number
  paidThisMonthCents: number
}

/** One row of `dashboard_paid_by_month()`. `month` is the first day ("2026-11-01"). */
export type PaidMonthRow = {
  currency: CurrencyCode
  month: string
  paidCents: number
  paidToDateCents: number
}

export type MonthPoint = {
  /** "2026-11-01" */
  month: string
  /** "Nov" */
  label: string
  /** "November 2026" */
  longLabel: string
  paidCents: number
}

export type Trend = {
  /** Rounded, never negative; read it with `direction`. */
  percent: number
  direction: "up" | "down" | "flat"
}

/** Months in the chart's longest range (and in the RPC's window). */
export const CHART_MONTHS = 12

// en-US: en-GB shortens September to "Sept", which breaks the three-letter axis.
const SHORT_MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" })
const LONG_MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })

/** The first day of the month `offset` months from `now`'s month, in UTC, as "YYYY-MM-01". */
function monthStart(now: Date, offset = 0): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)).toISOString().slice(0, 10)
}

/** A SQL date plus `days`, in UTC. */
export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

/**
 * Currencies with activity (PRD §6.15 AC2): Not paid invoices or payments this
 * month (the summary), or payments in the last 12 months. Sorted, so the
 * switcher keeps its order.
 */
export function activeCurrencies(summary: readonly SummaryRow[], paid: readonly PaidMonthRow[]): CurrencyCode[] {
  const currencies = new Set<CurrencyCode>()
  for (const row of summary) {
    if (row.outstandingCount > 0 || row.paidThisMonthCents > 0) currencies.add(row.currency)
  }
  for (const row of paid) {
    if (row.paidCents > 0) currencies.add(row.currency)
  }
  return [...currencies].sort()
}

/**
 * The profile's default currency if it has activity, otherwise the busiest one
 * (Not paid invoices plus months with payments), otherwise the profile's.
 */
export function defaultDashboardCurrency(
  active: readonly CurrencyCode[],
  profileCurrency: CurrencyCode,
  summary: readonly SummaryRow[],
  paid: readonly PaidMonthRow[]
): CurrencyCode {
  if (active.length === 0 || active.includes(profileCurrency)) return profileCurrency

  const score = (currency: CurrencyCode) =>
    (summary.find((row) => row.currency === currency)?.outstandingCount ?? 0) +
    paid.filter((row) => row.currency === currency && row.paidCents > 0).length

  // `active` is sorted, so ties go to the first alphabetically.
  return active.reduce((best, currency) => (score(currency) > score(best) ? currency : best))
}

/** `?currency=` when it's one of the active currencies, otherwise the default. */
export function pickCurrency(
  requested: string | undefined,
  active: readonly CurrencyCode[],
  fallback: CurrencyCode
): CurrencyCode {
  const match = active.find((currency) => currency === requested)
  return match ?? fallback
}

/** The summary numbers for one currency, zeros when it has none. */
export function summaryFor(summary: readonly SummaryRow[], currency: CurrencyCode): SummaryRow {
  return (
    summary.find((row) => row.currency === currency) ?? {
      currency,
      outstandingCount: 0,
      outstandingCents: 0,
      overdueCount: 0,
      overdueCents: 0,
      paidThisMonthCents: 0,
    }
  )
}

/** The last `months` months, oldest first, ending with the current one; months without payments are 0. */
export function monthSeries(
  paid: readonly PaidMonthRow[],
  currency: CurrencyCode,
  now: Date = new Date(),
  months: number = CHART_MONTHS
): MonthPoint[] {
  return Array.from({ length: months }, (_, index) => {
    const month = monthStart(now, index - months + 1)
    const date = new Date(`${month}T00:00:00Z`)
    const row = paid.find((item) => item.currency === currency && item.month === month)
    return {
      month,
      label: SHORT_MONTH.format(date),
      longLabel: LONG_MONTH.format(date),
      paidCents: row?.paidCents ?? 0,
    }
  })
}

/**
 * This month so far against last month up to the same point (PRD §6.15 AC3).
 * Null when last month had nothing by then, since a percentage of zero means nothing.
 */
export function paidTrend(paid: readonly PaidMonthRow[], currency: CurrencyCode, now: Date = new Date()): Trend | null {
  const current = monthStart(now)
  const previous = monthStart(now, -1)
  const thisMonth = paid.find((row) => row.currency === currency && row.month === current)?.paidCents ?? 0
  const lastMonth = paid.find((row) => row.currency === currency && row.month === previous)?.paidToDateCents ?? 0
  if (lastMonth <= 0) return null

  const change = Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
  return {
    percent: Math.abs(change),
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
  }
}

/** The first word of the full name, for "Good morning, Ana". Null when there's no name. */
export function dashboardFirstName(fullName: string | null): string | null {
  const first = fullName?.trim().split(/\s+/)[0]
  return first ? first : null
}

/** The line under the greeting. Counts may be added across currencies; amounts may not. */
export function overdueStatusLine(overdueCount: number): string {
  if (overdueCount <= 0) return "Nothing overdue, you're all caught up"
  return overdueCount === 1 ? "1 invoice is overdue" : `${overdueCount} invoices are overdue`
}

/** "Due today", "Due tomorrow", "Due in 5 days". */
export function dueLabel(dueDate: string, today: string): string {
  const days = Math.round((Date.parse(`${dueDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000)
  if (days <= 0) return "Due today"
  if (days === 1) return "Due tomorrow"
  return `Due in ${days} days`
}

/** Up to two initials for the avatar: "Acme Studio" → "AS", "ana" → "A". */
export function initials(name: string | null): string {
  if (!name) return "?"
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
  return letters ? letters.toLocaleUpperCase("en") : "?"
}

export type SetupState = {
  profileComplete: boolean
  hasClient: boolean
  stripeConnected: boolean
  hasInvoice: boolean
}

export type SetupStep = {
  key: "profile" | "client" | "stripe" | "invoice"
  title: string
  description: string
  href: string
  action: string
  done: boolean
  optional: boolean
}

/** The welcome checklist (PRD §6.15 AC7), in order. */
export function setupSteps(state: SetupState): SetupStep[] {
  return [
    {
      key: "profile",
      title: "Complete your profile",
      description: "Your name or company and an email, so clients know who the invoice is from.",
      href: "/settings/profile",
      action: "Complete profile",
      done: state.profileComplete,
      optional: false,
    },
    {
      key: "client",
      title: "Add a client",
      description: "Save who you bill once and pick them on every invoice.",
      href: "/clients/new",
      action: "Add client",
      done: state.hasClient,
      optional: false,
    },
    {
      key: "stripe",
      title: "Connect Stripe",
      description: "Let clients pay by card straight from the invoice email.",
      href: "/settings/payments",
      action: "Connect Stripe",
      done: state.stripeConnected,
      optional: true,
    },
    {
      key: "invoice",
      title: "Create your first invoice",
      description: "Add line items, download the PDF and send it to your client.",
      href: "/invoices/new",
      action: "Create invoice",
      done: state.hasInvoice,
      optional: false,
    },
  ]
}
