/**
 * Invoice totals (PRD §6.5.2, Tech.md §7). Pure integer maths, shared by the
 * form (live totals) and the server (the totals that get stored).
 */

export type LineUnit = "hours" | "flat"

export type LineInput = {
  unit: LineUnit
  quantity: number
  unitPriceCents: number
  /** 17.5% → 1750 */
  vatRateBp: number
}

export type LineResult = LineInput & { netCents: number; vatCents: number }

export type VatBreakdownRow = { rateBp: number; netCents: number; vatCents: number }

export type Totals = {
  lines: LineResult[]
  /** One row per distinct rate, lowest rate first. */
  vatBreakdown: VatBreakdownRow[]
  subtotalCents: number
  taxCents: number
  totalCents: number
}

/** net × rate ÷ 100%, rounded half up. BigInt, because net × rate can pass 2^53. */
export function lineVatCents(netCents: number, vatRateBp: number): number {
  return Number((BigInt(netCents) * BigInt(vatRateBp) + BigInt(5000)) / BigInt(10000))
}

export function calculateLine(line: LineInput): LineResult {
  // Flat lines are always one unit.
  const quantity = line.unit === "flat" ? 1 : line.quantity
  const netCents = quantity * line.unitPriceCents
  return { ...line, quantity, netCents, vatCents: lineVatCents(netCents, line.vatRateBp) }
}

export function calculateInvoice(lines: readonly LineInput[]): Totals {
  const results = lines.map(calculateLine)
  const byRate = new Map<number, VatBreakdownRow>()

  for (const line of results) {
    const row = byRate.get(line.vatRateBp) ?? { rateBp: line.vatRateBp, netCents: 0, vatCents: 0 }
    row.netCents += line.netCents
    row.vatCents += line.vatCents
    byRate.set(line.vatRateBp, row)
  }

  const subtotalCents = results.reduce((sum, line) => sum + line.netCents, 0)
  const taxCents = results.reduce((sum, line) => sum + line.vatCents, 0)

  return {
    lines: results,
    vatBreakdown: [...byRate.values()].sort((a, b) => a.rateBp - b.rateBp),
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
  }
}
