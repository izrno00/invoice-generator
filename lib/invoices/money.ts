/**
 * Parsing what the user types into integer minor units (Tech.md §7). String
 * maths only, so "0.29" is 29 cents, never 28.999… Both "." and "," are
 * accepted as the decimal separator. Thousands separators are not.
 */

/** Highest unit price: 9,999,999.99. Keeps every total well inside 2^53. */
export const MAX_PRICE_CENTS = 999_999_999
/** Highest quantity (hours) on one line. */
export const MAX_QUANTITY = 10_000
/** 100% in basis points. */
export const MAX_VAT_BP = 10_000

const DECIMAL = /^(\d+)(?:[.,](\d*))?$/

/** "12", "12.5", "12,50" → [whole, fraction padded to 2], or null. */
function parseTwoDecimals(input: string): [bigint, bigint] | null {
  const match = DECIMAL.exec(input.trim())
  if (!match) return null

  const [, whole, fraction = ""] = match
  if (fraction.length > 2 || whole.length > 15) return null
  return [BigInt(whole), BigInt(fraction.padEnd(2, "0"))]
}

/** A price as cents, or null if it isn't a number ≥ 0 with at most 2 decimals. */
export function parseMoneyInput(input: string): number | null {
  const parts = parseTwoDecimals(input)
  if (!parts) return null
  const cents = parts[0] * BigInt(100) + parts[1]
  return cents > BigInt(MAX_PRICE_CENTS) ? null : Number(cents)
}

/** A VAT rate as basis points (17.5% → 1750), or null if it isn't 0–100 with at most 2 decimals. */
export function parseVatInput(input: string): number | null {
  const parts = parseTwoDecimals(input)
  if (!parts) return null
  const bp = parts[0] * BigInt(100) + parts[1]
  return bp > BigInt(MAX_VAT_BP) ? null : Number(bp)
}

/** A whole number of hours, or null. */
export function parseQuantityInput(input: string): number | null {
  const value = input.trim()
  if (!/^\d{1,6}$/.test(value)) return null
  const quantity = Number(value)
  return quantity >= 1 && quantity <= MAX_QUANTITY ? quantity : null
}

/** Cents back into the price field: 1250 → "12.50". */
export function centsToInput(cents: number): string {
  const whole = Math.floor(cents / 100)
  return `${whole}.${String(cents % 100).padStart(2, "0")}`
}

/** Basis points back into the VAT field: 1750 → "17.5", 1700 → "17". */
export function vatBpToInput(bp: number): string {
  const whole = Math.floor(bp / 100)
  const fraction = String(bp % 100).padStart(2, "0").replace(/0+$/, "")
  return fraction ? `${whole}.${fraction}` : String(whole)
}

/** The DB stores VAT as numeric(5,2), which PostgREST returns as a number (17.5). */
export function vatRateToBp(rate: number): number {
  return Math.round(rate * 100)
}

export function vatBpToRate(bp: number): number {
  return bp / 100
}
