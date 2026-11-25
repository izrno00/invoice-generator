import { describe, expect, it } from "vitest"

import { calculateInvoice, lineVatCents } from "@/lib/invoices/calc"

describe("lineVatCents", () => {
  it("rounds half up per line", () => {
    // 0.10 × 5% = 0.005 → 0.01
    expect(lineVatCents(10, 500)).toBe(1)
    // 0.09 × 5% = 0.0045 → 0.00
    expect(lineVatCents(9, 500)).toBe(0)
    expect(lineVatCents(20000, 1700)).toBe(3400)
  })

  it("stays exact for large amounts", () => {
    expect(lineVatCents(999_999_999 * 10_000, 10_000)).toBe(999_999_999 * 10_000)
  })
})

describe("calculateInvoice", () => {
  it("adds up lines and groups VAT by rate", () => {
    const totals = calculateInvoice([
      { unit: "hours", quantity: 10, unitPriceCents: 5000, vatRateBp: 1700 },
      { unit: "flat", quantity: 1, unitPriceCents: 20000, vatRateBp: 1700 },
      { unit: "hours", quantity: 2, unitPriceCents: 1000, vatRateBp: 0 },
    ])

    expect(totals.subtotalCents).toBe(72000)
    expect(totals.taxCents).toBe(11900)
    expect(totals.totalCents).toBe(83900)
    expect(totals.vatBreakdown).toEqual([
      { rateBp: 0, netCents: 2000, vatCents: 0 },
      { rateBp: 1700, netCents: 70000, vatCents: 11900 },
    ])
  })

  it("rounds each line, not the sum", () => {
    // Two lines of 0.10 at 5%: 0.01 + 0.01, not round(0.01) = 0.01.
    const totals = calculateInvoice([
      { unit: "flat", quantity: 1, unitPriceCents: 10, vatRateBp: 500 },
      { unit: "flat", quantity: 1, unitPriceCents: 10, vatRateBp: 500 },
    ])
    expect(totals.taxCents).toBe(2)
  })

  it("treats a flat line as one unit", () => {
    const totals = calculateInvoice([{ unit: "flat", quantity: 5, unitPriceCents: 1000, vatRateBp: 0 }])
    expect(totals.lines[0].quantity).toBe(1)
    expect(totals.totalCents).toBe(1000)
  })

  it("lists a zero rate even when its VAT is zero", () => {
    const totals = calculateInvoice([{ unit: "hours", quantity: 1, unitPriceCents: 100, vatRateBp: 0 }])
    expect(totals.vatBreakdown).toEqual([{ rateBp: 0, netCents: 100, vatCents: 0 }])
  })

  it("handles no lines", () => {
    expect(calculateInvoice([])).toEqual({
      lines: [],
      vatBreakdown: [],
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
    })
  })
})
