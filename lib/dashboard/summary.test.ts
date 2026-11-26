import { describe, expect, it } from "vitest"

import {
  activeCurrencies,
  addDays,
  dashboardFirstName,
  defaultDashboardCurrency,
  dueLabel,
  initials,
  monthSeries,
  overdueStatusLine,
  paidTrend,
  pickCurrency,
  setupSteps,
  summaryFor,
  type PaidMonthRow,
  type SummaryRow,
} from "@/lib/dashboard/summary"

const NOW = new Date("2026-11-26T10:00:00Z")

function summary(row: Partial<SummaryRow> & Pick<SummaryRow, "currency">): SummaryRow {
  return { outstandingCount: 0, outstandingCents: 0, overdueCount: 0, overdueCents: 0, paidThisMonthCents: 0, ...row }
}

function paid(currency: PaidMonthRow["currency"], month: string, paidCents: number, paidToDateCents = paidCents): PaidMonthRow {
  return { currency, month, paidCents, paidToDateCents }
}

describe("activeCurrencies", () => {
  it("combines the summary and the paid history, sorted and without duplicates", () => {
    const result = activeCurrencies(
      [summary({ currency: "USD", outstandingCount: 1, outstandingCents: 100 }), summary({ currency: "EUR", paidThisMonthCents: 5 })],
      [paid("GBP", "2026-06-01", 10), paid("EUR", "2026-10-01", 20)]
    )
    expect(result).toEqual(["EUR", "GBP", "USD"])
  })

  it("is empty with no activity", () => {
    expect(activeCurrencies([], [])).toEqual([])
  })
})

describe("defaultDashboardCurrency", () => {
  it("prefers the profile's currency when it has activity", () => {
    expect(defaultDashboardCurrency(["EUR", "USD"], "USD", [], [])).toBe("USD")
  })

  it("falls back to the profile's currency with no activity at all", () => {
    expect(defaultDashboardCurrency([], "GBP", [], [])).toBe("GBP")
  })

  it("otherwise picks the busiest currency", () => {
    const rows = [summary({ currency: "EUR", outstandingCount: 1 }), summary({ currency: "USD", outstandingCount: 3 })]
    expect(defaultDashboardCurrency(["EUR", "USD"], "GBP", rows, [])).toBe("USD")
    expect(
      defaultDashboardCurrency(["EUR", "USD"], "GBP", rows, [
        paid("EUR", "2026-09-01", 1),
        paid("EUR", "2026-10-01", 1),
        paid("EUR", "2026-11-01", 1),
      ])
    ).toBe("EUR")
  })
})

describe("pickCurrency", () => {
  it("accepts only active currencies", () => {
    expect(pickCurrency("USD", ["EUR", "USD"], "EUR")).toBe("USD")
    expect(pickCurrency("GBP", ["EUR", "USD"], "EUR")).toBe("EUR")
    expect(pickCurrency("usd", ["EUR", "USD"], "EUR")).toBe("EUR")
    expect(pickCurrency(undefined, ["EUR"], "EUR")).toBe("EUR")
  })
})

describe("summaryFor", () => {
  it("returns zeros for a currency without a row", () => {
    expect(summaryFor([], "EUR")).toEqual(summary({ currency: "EUR" }))
  })
})

describe("monthSeries", () => {
  it("ends with the current month and fills gaps with zero", () => {
    const series = monthSeries([paid("EUR", "2026-11-01", 500), paid("EUR", "2026-09-01", 200), paid("USD", "2026-10-01", 9)], "EUR", NOW, 3)
    expect(series).toEqual([
      { month: "2026-09-01", label: "Sep", longLabel: "September 2026", paidCents: 200 },
      { month: "2026-10-01", label: "Oct", longLabel: "October 2026", paidCents: 0 },
      { month: "2026-11-01", label: "Nov", longLabel: "November 2026", paidCents: 500 },
    ])
  })

  it("crosses the year boundary", () => {
    const series = monthSeries([], "EUR", new Date("2027-01-15T00:00:00Z"), 12)
    expect(series).toHaveLength(12)
    expect(series[0].month).toBe("2026-02-01")
    expect(series.at(-1)?.longLabel).toBe("January 2027")
  })
})

describe("paidTrend", () => {
  it("compares this month with last month up to the same point", () => {
    const rows = [paid("EUR", "2026-10-01", 50_000, 10_000), paid("EUR", "2026-11-01", 12_000)]
    expect(paidTrend(rows, "EUR", NOW)).toEqual({ percent: 20, direction: "up" })
  })

  it("goes down, and down to zero", () => {
    expect(paidTrend([paid("EUR", "2026-10-01", 900, 400), paid("EUR", "2026-11-01", 300)], "EUR", NOW)).toEqual({
      percent: 25,
      direction: "down",
    })
    expect(paidTrend([paid("EUR", "2026-10-01", 900, 400)], "EUR", NOW)).toEqual({ percent: 100, direction: "down" })
  })

  it("is flat when equal", () => {
    expect(paidTrend([paid("EUR", "2026-10-01", 900, 400), paid("EUR", "2026-11-01", 400)], "EUR", NOW)).toEqual({
      percent: 0,
      direction: "flat",
    })
  })

  it("is null when last month had nothing by this point", () => {
    expect(paidTrend([paid("EUR", "2026-10-01", 900, 0), paid("EUR", "2026-11-01", 400)], "EUR", NOW)).toBeNull()
    expect(paidTrend([paid("USD", "2026-10-01", 900)], "EUR", NOW)).toBeNull()
  })

  it("looks at December when it's January", () => {
    const rows = [paid("EUR", "2026-12-01", 100, 100), paid("EUR", "2027-01-01", 150)]
    expect(paidTrend(rows, "EUR", new Date("2027-01-10T00:00:00Z"))).toEqual({ percent: 50, direction: "up" })
  })
})

describe("names and labels", () => {
  it("takes the first word of the full name", () => {
    expect(dashboardFirstName("  Ana  Horvat ")).toBe("Ana")
    expect(dashboardFirstName("")).toBeNull()
    expect(dashboardFirstName(null)).toBeNull()
  })

  it("words the overdue line", () => {
    expect(overdueStatusLine(0)).toBe("Nothing overdue, you're all caught up")
    expect(overdueStatusLine(1)).toBe("1 invoice is overdue")
    expect(overdueStatusLine(4)).toBe("4 invoices are overdue")
  })

  it("words the due date", () => {
    expect(dueLabel("2026-11-26", "2026-11-26")).toBe("Due today")
    expect(dueLabel("2026-11-27", "2026-11-26")).toBe("Due tomorrow")
    expect(dueLabel("2026-12-03", "2026-11-26")).toBe("Due in 7 days")
  })

  it("adds days across months", () => {
    expect(addDays("2026-11-26", 7)).toBe("2026-12-03")
  })

  it("makes initials", () => {
    expect(initials("Acme Studio Ltd")).toBe("AS")
    expect(initials("ana")).toBe("A")
    expect(initials("Željko Šarić")).toBe("ŽŠ")
    expect(initials(null)).toBe("?")
    expect(initials("  ")).toBe("?")
  })
})

describe("setupSteps", () => {
  it("lists the four steps in order and marks finished ones", () => {
    const steps = setupSteps({ profileComplete: true, hasClient: false, stripeConnected: true, hasInvoice: false })
    expect(steps.map((step) => step.key)).toEqual(["profile", "client", "stripe", "invoice"])
    expect(steps.map((step) => step.done)).toEqual([true, false, true, false])
    expect(steps.find((step) => step.key === "stripe")?.optional).toBe(true)
  })
})
