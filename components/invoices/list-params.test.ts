import { describe, expect, it } from "vitest"

import { hasFilters, invoicesListHref, parseInvoiceListParams, showingLabel } from "@/components/invoices/list-params"

const CLIENT = "5b0a2f0e-3c5d-4b8e-9a51-1f2d3c4b5a69"

describe("parseInvoiceListParams", () => {
  it("reads valid filters", () => {
    expect(
      parseInvoiceListParams({ q: " 2026 ", status: "overdue", client: CLIENT, from: "2026-01-01", to: "2026-12-31", page: "3" })
    ).toEqual({ q: "2026", status: "overdue", client: CLIENT, from: "2026-01-01", to: "2026-12-31", page: 3 })
  })

  it("ignores anything unusable", () => {
    expect(
      parseInvoiceListParams({ q: ["a", "b"], status: "late", client: "x", from: "2026-13-01", to: "yesterday", page: "-1" })
    ).toEqual({ q: "", status: null, client: null, from: null, to: null, page: 1 })
  })
})

describe("invoicesListHref", () => {
  it("keeps filters and drops page 1", () => {
    expect(invoicesListHref({ q: "acme", status: "paid", page: 1 })).toBe("/invoices?q=acme&status=paid")
    expect(invoicesListHref({ client: CLIENT, page: 2 })).toBe(`/invoices?client=${CLIENT}&page=2`)
    expect(invoicesListHref({})).toBe("/invoices")
    expect(invoicesListHref({ page: 2 }, "/clients/abc")).toBe("/clients/abc?page=2")
  })
})

describe("labels", () => {
  it("shows the range on the page", () => {
    expect(showingLabel(1, 20, 57)).toBe("Showing 1–20 of 57")
    expect(showingLabel(3, 20, 57)).toBe("Showing 41–57 of 57")
  })

  it("knows when filters are set", () => {
    expect(hasFilters({ q: "", status: null, client: null, from: null, to: null })).toBe(false)
    expect(hasFilters({ q: "", status: "draft", client: null, from: null, to: null })).toBe(true)
  })
})
