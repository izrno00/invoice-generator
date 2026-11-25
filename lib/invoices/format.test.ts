import { describe, expect, it } from "vitest"

import { addDaysIso, defaultDueDate, fromIsoDate } from "@/lib/invoices/dates"
import {
  formatAmount,
  formatDate,
  formatMoney,
  formatQuantity,
  formatVatRate,
  invoiceFileName,
} from "@/lib/invoices/format"

describe("formatDate", () => {
  it("formats SQL dates without shifting the day", () => {
    expect(formatDate("2026-11-24")).toBe("24 Nov 2026")
    expect(formatDate("2026-01-01")).toBe("1 Jan 2026")
  })

  it("formats timestamps (in UTC)", () => {
    expect(formatDate("2026-11-24T23:30:00Z")).toBe("24 Nov 2026")
  })
})

describe("formatMoney", () => {
  it("uses the code, thousands separators and 2 decimals", () => {
    expect(formatMoney(123456, "EUR")).toBe("EUR 1,234.56")
    expect(formatMoney(0, "BAM")).toBe("BAM 0.00")
    expect(formatMoney(5, "GBP")).toBe("GBP 0.05")
    expect(formatMoney(100_000_000_00, "USD")).toBe("USD 100,000,000.00")
  })

  it("stays exact for very large amounts", () => {
    expect(formatAmount(2_000_000_000_000_001)).toBe("20,000,000,000,000.01")
  })
})

describe("other formats", () => {
  it("formats quantities, VAT rates and file names", () => {
    expect(formatQuantity(10, "hours")).toBe("10 h")
    expect(formatQuantity(1, "flat")).toBe("Flat")
    expect(formatVatRate(1700)).toBe("17%")
    expect(formatVatRate(750)).toBe("7.5%")
    expect(formatVatRate(725)).toBe("7.25%")
    expect(formatVatRate(0)).toBe("0%")
    expect(invoiceFileName("2026-001")).toBe("Invoice-2026-001.pdf")
  })
})

describe("dates", () => {
  it("adds days across months and years", () => {
    expect(defaultDueDate("2026-11-24")).toBe("2026-12-08")
    expect(addDaysIso("2026-12-25", 14)).toBe("2027-01-08")
  })

  it("rejects things that aren't dates", () => {
    expect(fromIsoDate("2026-13-01")).toBeNull()
    expect(fromIsoDate("24.11.2026")).toBeNull()
  })
})
