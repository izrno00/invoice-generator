import { describe, expect, it } from "vitest"

import { defaultSendMessage, emailAddressOf, invoiceFromHeader, invoiceSubject } from "@/lib/invoices/email-text"
import { greetingName, senderName } from "@/lib/invoices/names"

describe("names", () => {
  it("uses the company as the sender, else the full name", () => {
    expect(senderName({ companyName: "Acme Studio", fullName: "Jane Doe" })).toBe("Acme Studio")
    expect(senderName({ companyName: "  ", fullName: "Jane Doe" })).toBe("Jane Doe")
    expect(senderName({ companyName: null, fullName: null })).toBeNull()
  })

  it("greets a person first, then the company", () => {
    expect(greetingName({ fullName: "Jane Doe", companyName: "Acme" })).toBe("Jane Doe")
    expect(greetingName({ fullName: null, companyName: "Acme" })).toBe("Acme")
    expect(greetingName({ fullName: null, companyName: null })).toBeNull()
  })
})

describe("email texts", () => {
  const base = { invoiceNumber: "2026-001", totalCents: 123456, currency: "EUR", dueDate: "2026-12-08" }

  it("builds the subject", () => {
    expect(invoiceSubject("2026-001", "Acme Studio")).toBe("Invoice 2026-001 from Acme Studio")
  })

  it("builds the default message (PRD §6.7)", () => {
    expect(defaultSendMessage({ ...base, greeting: "Jane Doe" })).toBe(
      "Hi Jane Doe, please find attached invoice 2026-001 for EUR 1,234.56, due on 8 Dec 2026. Thank you!"
    )
  })

  it("says 'updated' for a changed invoice, and 'Hi,' without a name", () => {
    expect(defaultSendMessage({ ...base, greeting: null, updated: true })).toBe(
      "Hi, please find attached the updated invoice 2026-001 for EUR 1,234.56, due on 8 Dec 2026. Thank you!"
    )
  })

  it("builds a safe From header", () => {
    expect(emailAddressOf("Payable <invoices@example.com>")).toBe("invoices@example.com")
    expect(emailAddressOf("invoices@example.com")).toBe("invoices@example.com")
    expect(invoiceFromHeader('Acme "Best" <Studio>', "Payable <invoices@example.com>")).toBe(
      '"Acme Best Studio via Payable" <invoices@example.com>'
    )
  })
})
