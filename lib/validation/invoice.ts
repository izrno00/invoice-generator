import { z } from "zod"

import { calculateInvoice, type LineInput } from "@/lib/invoices/calc"
import { parseMoneyInput, parseQuantityInput, parseVatInput } from "@/lib/invoices/money"
import { optionalText, tooLong } from "@/lib/validation/fields"
import { CURRENCIES, type CurrencyCode } from "@/lib/validation/profile"

/** Matches the `char_length` checks on `invoices` / `invoice_items` (DB.md §3.4–3.5). */
export const INVOICE_LIMITS = {
  comments: 2000,
  description: 500,
  message: 5000,
  lines: 100,
} as const

export const LINE_UNITS = ["hours", "flat"] as const

/**
 * `clientId` value meaning "keep the client details saved on this invoice":
 * its client was deleted (PRD §6.4 AC6), so there's no id to point at.
 */
export const SAVED_CLIENT = "saved"

export const LINE_ERRORS = {
  description: "Enter a description",
  quantity: "Enter a whole number of hours, at least 1",
  price: "Enter a price of 0 or more, with up to 2 decimals",
  priceMissing: "Enter a price",
  vat: "Enter a VAT rate from 0 to 100, with up to 2 decimals",
} as const

export const INVOICE_ERRORS = {
  invoiceDate: "Choose an invoice date",
  dueDate: "Choose a due date",
  dueBeforeInvoice: "Due date can't be before the invoice date",
  client: "Choose a client",
  noLines: "Add at least one line item",
  tooManyLines: `An invoice can have at most ${INVOICE_LIMITS.lines} line items`,
  zeroTotal: "The invoice total must be more than 0",
} as const

export type SaveMode = "draft" | "final"

/** Accepts the form's strings and returns DB-ready values. `final` adds the finalize rules (PRD §7). */
function lineSchema(mode: SaveMode) {
  return z
    .object({
      description: z
        .string()
        .overwrite((value) => value.replace(/\s+/g, " "))
        .trim()
        .max(INVOICE_LIMITS.description, tooLong("Description", INVOICE_LIMITS.description)),
      unit: z.enum(LINE_UNITS),
      quantity: z.string(),
      price: z.string(),
      vatRate: z.string(),
    })
    .transform((line, ctx) => {
      if (mode === "final" && !line.description) {
        ctx.addIssue({ code: "custom", path: ["description"], message: LINE_ERRORS.description })
      }

      // Flat lines are always one unit, whatever the (locked) field says.
      const quantity = line.unit === "flat" ? 1 : parseQuantityInput(line.quantity)
      if (quantity === null) ctx.addIssue({ code: "custom", path: ["quantity"], message: LINE_ERRORS.quantity })

      // An empty price is 0 on a draft; a finished invoice needs one.
      const priceText = line.price.trim()
      let unitPriceCents: number | null = 0
      if (priceText) {
        unitPriceCents = parseMoneyInput(priceText)
        if (unitPriceCents === null) ctx.addIssue({ code: "custom", path: ["price"], message: LINE_ERRORS.price })
      } else if (mode === "final") {
        ctx.addIssue({ code: "custom", path: ["price"], message: LINE_ERRORS.priceMissing })
      }

      // An empty VAT rate is the default, 0.
      const vatText = line.vatRate.trim()
      const vatRateBp = vatText ? parseVatInput(vatText) : 0
      if (vatRateBp === null) ctx.addIssue({ code: "custom", path: ["vatRate"], message: LINE_ERRORS.vat })

      if (quantity === null || unitPriceCents === null || vatRateBp === null) return z.NEVER
      return { description: line.description, unit: line.unit, quantity, unitPriceCents, vatRateBp }
    })
}

function invoiceSchema(mode: SaveMode) {
  return z
    .object({
      clientId: z.union([z.uuid(), z.literal(SAVED_CLIENT)]).nullable(),
      invoiceDate: z.iso.date(INVOICE_ERRORS.invoiceDate),
      dueDate: z.iso.date(INVOICE_ERRORS.dueDate),
      currency: z.enum(CURRENCIES, { error: "Choose a currency" }),
      comments: optionalText("Comments", INVOICE_LIMITS.comments, { multiline: true }),
      lines: z.array(lineSchema(mode)).max(INVOICE_LIMITS.lines, INVOICE_ERRORS.tooManyLines),
    })
    .superRefine((invoice, ctx) => {
      if (invoice.dueDate < invoice.invoiceDate) {
        ctx.addIssue({ code: "custom", path: ["dueDate"], message: INVOICE_ERRORS.dueBeforeInvoice })
      }
      if (mode === "draft") return

      if (invoice.clientId === null) {
        ctx.addIssue({ code: "custom", path: ["clientId"], message: INVOICE_ERRORS.client })
      }
      if (invoice.lines.length === 0) {
        ctx.addIssue({ code: "custom", path: ["lines"], message: INVOICE_ERRORS.noLines })
      } else if (calculateInvoice(invoice.lines).totalCents <= 0) {
        ctx.addIssue({ code: "custom", path: ["lines"], message: INVOICE_ERRORS.zeroTotal })
      }
    })
}

/** Save as draft: relaxed (PRD §7). */
export const invoiceDraftSchema = invoiceSchema("draft")
/** Save invoice / Send: everything a finished invoice needs (PRD §7). */
export const invoiceFinalSchema = invoiceSchema("final")

export function invoiceSchemaFor(mode: SaveMode) {
  return mode === "draft" ? invoiceDraftSchema : invoiceFinalSchema
}

/** What the form holds: plain strings. */
export type InvoiceFormValues = z.input<typeof invoiceDraftSchema>
export type LineFormValues = InvoiceFormValues["lines"][number]
/** What gets stored. */
export type InvoiceValues = z.output<typeof invoiceDraftSchema>
export type LineValues = InvoiceValues["lines"][number] & LineInput

/** A new line: the first is Hours / 1 / VAT 0; later ones reuse the previous unit and VAT rate. */
export function newLine(previous?: Pick<LineFormValues, "unit" | "vatRate">): LineFormValues {
  return {
    description: "",
    unit: previous?.unit ?? "hours",
    quantity: "1",
    price: "",
    vatRate: previous?.vatRate ?? "0",
  }
}

export function emptyInvoiceValues({
  today,
  dueDate,
  currency,
}: {
  today: string
  dueDate: string
  currency: CurrencyCode
}): InvoiceFormValues {
  return {
    clientId: null,
    invoiceDate: today,
    dueDate,
    currency,
    comments: "",
    lines: [newLine()],
  }
}

/** Send dialog → `sendInvoice` (Tech.md §8.1). */
export const sendInvoiceSchema = z.object({
  invoiceId: z.uuid(),
  message: z
    .string()
    .overwrite((value) => value.replace(/\r\n?/g, "\n"))
    .trim()
    .max(INVOICE_LIMITS.message, tooLong("Message", INVOICE_LIMITS.message)),
  /** Made once when the dialog opens and reused on Retry, so nothing is sent twice. */
  attemptId: z.uuid(),
})

export type SendInvoiceInput = z.input<typeof sendInvoiceSchema>
