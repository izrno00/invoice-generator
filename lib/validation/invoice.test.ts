import { describe, expect, it } from "vitest"

import {
  INVOICE_ERRORS,
  INVOICE_LIMITS,
  invoiceDraftSchema,
  invoiceFinalSchema,
  LINE_ERRORS,
  newLine,
  SAVED_CLIENT,
  sendInvoiceSchema,
  type InvoiceFormValues,
} from "@/lib/validation/invoice"

const CLIENT_ID = "5b0a2f0e-3c5d-4b8e-9a51-1f2d3c4b5a69"

const valid: InvoiceFormValues = {
  clientId: CLIENT_ID,
  invoiceDate: "2026-11-24",
  dueDate: "2026-12-08",
  currency: "EUR",
  comments: "  Thanks!  ",
  lines: [{ description: " Design  work ", unit: "hours", quantity: "10", price: "50,00", vatRate: "17" }],
}

function errors(schema: typeof invoiceDraftSchema, values: InvoiceFormValues) {
  const result = schema.safeParse(values)
  return result.success ? [] : result.error.issues.map((issue) => [issue.path.join("."), issue.message])
}

describe("invoiceFinalSchema", () => {
  it("parses a complete invoice into DB values", () => {
    expect(invoiceFinalSchema.parse(valid)).toEqual({
      clientId: CLIENT_ID,
      invoiceDate: "2026-11-24",
      dueDate: "2026-12-08",
      currency: "EUR",
      comments: "Thanks!",
      lines: [{ description: "Design work", unit: "hours", quantity: 10, unitPriceCents: 5000, vatRateBp: 1700 }],
    })
  })

  it("requires a client, lines, descriptions, prices and a total above 0", () => {
    expect(errors(invoiceFinalSchema, { ...valid, clientId: null })).toEqual([["clientId", INVOICE_ERRORS.client]])
    expect(errors(invoiceFinalSchema, { ...valid, lines: [] })).toEqual([["lines", INVOICE_ERRORS.noLines]])
    expect(errors(invoiceFinalSchema, { ...valid, lines: [{ ...valid.lines[0], description: "  " }] })).toEqual([
      ["lines.0.description", LINE_ERRORS.description],
    ])
    expect(errors(invoiceFinalSchema, { ...valid, lines: [{ ...valid.lines[0], price: "" }] })).toEqual([
      ["lines.0.price", LINE_ERRORS.priceMissing],
    ])
    expect(errors(invoiceFinalSchema, { ...valid, lines: [{ ...valid.lines[0], price: "0" }] })).toEqual([
      ["lines", INVOICE_ERRORS.zeroTotal],
    ])
  })

  it("accepts the saved details of a deleted client", () => {
    expect(invoiceFinalSchema.safeParse({ ...valid, clientId: SAVED_CLIENT }).success).toBe(true)
  })
})

describe("invoiceDraftSchema", () => {
  it("allows a draft without client or lines", () => {
    expect(invoiceDraftSchema.safeParse({ ...valid, clientId: null, lines: [] }).success).toBe(true)
  })

  it("treats an empty price and VAT as 0 and an empty description as fine", () => {
    const parsed = invoiceDraftSchema.parse({
      ...valid,
      lines: [{ description: "", unit: "hours", quantity: "1", price: "", vatRate: "" }],
    })
    expect(parsed.lines[0]).toEqual({ description: "", unit: "hours", quantity: 1, unitPriceCents: 0, vatRateBp: 0 })
  })

  it("still checks dates and line shapes", () => {
    expect(errors(invoiceDraftSchema, { ...valid, dueDate: "2026-11-23" })).toEqual([
      ["dueDate", INVOICE_ERRORS.dueBeforeInvoice],
    ])
    expect(
      errors(invoiceDraftSchema, {
        ...valid,
        lines: [{ description: "", unit: "hours", quantity: "1.5", price: "1.234", vatRate: "101" }],
      })
    ).toEqual([
      ["lines.0.quantity", LINE_ERRORS.quantity],
      ["lines.0.price", LINE_ERRORS.price],
      ["lines.0.vatRate", LINE_ERRORS.vat],
    ])
  })

  it("forces flat lines to quantity 1", () => {
    const parsed = invoiceDraftSchema.parse({ ...valid, lines: [{ ...valid.lines[0], unit: "flat", quantity: "" }] })
    expect(parsed.lines[0].quantity).toBe(1)
  })

  it(`allows at most ${INVOICE_LIMITS.lines} lines`, () => {
    const lines = Array.from({ length: INVOICE_LIMITS.lines + 1 }, () => valid.lines[0])
    expect(errors(invoiceDraftSchema, { ...valid, lines })).toEqual([["lines", INVOICE_ERRORS.tooManyLines]])
  })
})

describe("newLine", () => {
  it("starts with Hours / 1 / VAT 0 and then copies the previous unit and VAT", () => {
    expect(newLine()).toEqual({ description: "", unit: "hours", quantity: "1", price: "", vatRate: "0" })
    expect(newLine({ unit: "flat", vatRate: "17" })).toMatchObject({ unit: "flat", vatRate: "17", price: "" })
  })
})

describe("sendInvoiceSchema", () => {
  it("limits the message and needs ids", () => {
    const input = { invoiceId: CLIENT_ID, attemptId: CLIENT_ID, message: "Hi\r\nthere " }
    expect(sendInvoiceSchema.parse(input).message).toBe("Hi\nthere")
    expect(sendInvoiceSchema.safeParse({ ...input, message: "x".repeat(5001) }).success).toBe(false)
    expect(sendInvoiceSchema.safeParse({ ...input, attemptId: "1" }).success).toBe(false)
  })
})
