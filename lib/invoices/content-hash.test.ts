import { describe, expect, it } from "vitest"

import { contentHash, type InvoiceContent } from "@/lib/invoices/content-hash"

const content: InvoiceContent = {
  invoiceDate: "2026-11-24",
  dueDate: "2026-12-08",
  currency: "EUR",
  comments: "Thanks!",
  sender: {
    fullName: "Jane Doe",
    companyName: null,
    email: "jane@example.com",
    address: "Street 1",
    vatId: null,
    website: null,
  },
  client: { fullName: null, companyName: "Acme", email: "acme@example.com", address: null, vatId: "BA123" },
  lines: [{ description: "Design", unit: "hours", quantity: 10, unitPriceCents: 5000, vatRateBp: 1700 }],
}

describe("contentHash", () => {
  it("is stable for equal content, whatever the key order", () => {
    const reordered = {
      lines: content.lines,
      client: { ...content.client },
      sender: { ...content.sender },
      comments: content.comments,
      currency: content.currency,
      dueDate: content.dueDate,
      invoiceDate: content.invoiceDate,
    }
    expect(contentHash(reordered)).toBe(contentHash(content))
    expect(contentHash(content)).toMatch(/^[0-9a-f]{64}$/)
  })

  it.each<[string, Partial<InvoiceContent>]>([
    ["invoice date", { invoiceDate: "2026-11-25" }],
    ["due date", { dueDate: "2026-12-09" }],
    ["currency", { currency: "BAM" }],
    ["comments", { comments: null }],
    ["sender", { sender: { ...content.sender, address: "Street 2" } }],
    ["client", { client: { ...content.client, vatId: null } }],
    ["line price", { lines: [{ ...content.lines[0], unitPriceCents: 5001 }] }],
    ["line order", { lines: [...content.lines, { ...content.lines[0], description: "Dev" }] }],
  ])("changes when the %s changes", (_, change) => {
    expect(contentHash({ ...content, ...change })).not.toBe(contentHash(content))
  })

  it("ignores the quantity field of a flat line", () => {
    const flat = { ...content, lines: [{ ...content.lines[0], unit: "flat" as const, quantity: 1 }] }
    const flatOdd = { ...content, lines: [{ ...content.lines[0], unit: "flat" as const, quantity: 3 }] }
    expect(contentHash(flatOdd)).toBe(contentHash(flat))
  })
})
