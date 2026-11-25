/**
 * Fixed English formats for the UI, PDF and emails (PRD §8, Tech.md §7).
 */

import type { LineUnit } from "@/lib/invoices/calc"

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

const HUNDRED = BigInt(100)
const GROUPING = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

/**
 * "24 Nov 2026". Takes a SQL date ("2026-11-24") or a timestamp. Dates are
 * read as UTC so they never shift a day with the time zone.
 */
export function formatDate(value: string | Date): string {
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00Z`) : new Date(value)
  return DATE_FORMAT.format(date)
}

/** The amount alone: 123456 → "1,234.56". String maths, so large amounts stay exact. */
export function formatAmount(cents: number): string {
  const negative = cents < 0
  const abs = BigInt(Math.abs(cents))
  const whole = GROUPING.format(abs / HUNDRED)
  const fraction = String(abs % HUNDRED).padStart(2, "0")
  return `${negative ? "-" : ""}${whole}.${fraction}`
}

/** "EUR 1,234.56" */
export function formatMoney(cents: number, currency: string): string {
  return `${currency} ${formatAmount(cents)}`
}

/** "10 h" or "Flat" */
export function formatQuantity(quantity: number, unit: LineUnit): string {
  return unit === "flat" ? "Flat" : `${quantity} h`
}

/** 1750 → "17.5%", 1700 → "17%" */
export function formatVatRate(rateBp: number): string {
  const whole = Math.floor(rateBp / 100)
  const fraction = String(rateBp % 100).padStart(2, "0").replace(/0+$/, "")
  return `${fraction ? `${whole}.${fraction}` : whole}%`
}

/** "Invoice-2026-001.pdf" */
export function invoiceFileName(invoiceNumber: string): string {
  return `Invoice-${invoiceNumber}.pdf`
}
