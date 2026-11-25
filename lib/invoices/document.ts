/**
 * The invoice as it appears on the PDF and the details page (PRD §6.6, §6.12),
 * built from a stored invoice row and its items. Pure: no I/O.
 */

import { calculateInvoice, type LineResult, type VatBreakdownRow } from "@/lib/invoices/calc"
import { centsToInput, vatBpToInput, vatRateToBp } from "@/lib/invoices/money"
import {
  clientFromRow,
  hasClientDetails,
  senderFromRow,
  snapshotDisplayName,
  type ClientSnapshot,
  type SenderSnapshot,
} from "@/lib/invoices/snapshot"
import type { Database } from "@/lib/supabase/database.types"
import { invoiceFinalSchema, SAVED_CLIENT, type InvoiceFormValues } from "@/lib/validation/invoice"

export type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"]
export type InvoiceItemRow = Pick<
  Database["public"]["Tables"]["invoice_items"]["Row"],
  "position" | "description" | "unit" | "quantity" | "unit_price_cents" | "vat_rate"
>

export const ITEM_COLUMNS = "position, description, unit, quantity, unit_price_cents, vat_rate"

/** The columns the form (and the completeness check) needs. */
export type FormRow = Pick<
  InvoiceRow,
  | "client_id"
  | "client_full_name"
  | "client_company_name"
  | "client_email"
  | "client_address"
  | "client_vat_id"
  | "client_display_name"
  | "invoice_date"
  | "due_date"
  | "currency"
  | "comments"
>

export type DocumentLine = LineResult & { description: string }

export type InvoiceDocumentData = {
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  currency: string
  sender: SenderSnapshot
  /** Null when there's no client yet (drafts). */
  client: ClientSnapshot | null
  lines: DocumentLine[]
  vatBreakdown: VatBreakdownRow[]
  subtotalCents: number
  taxCents: number
  totalCents: number
  comments: string | null
}

function sortedItems(items: readonly InvoiceItemRow[]) {
  return [...items].sort((a, b) => a.position - b.position)
}

export function itemsToLines(items: readonly InvoiceItemRow[]) {
  return sortedItems(items).map((item) => ({
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    unitPriceCents: item.unit_price_cents,
    vatRateBp: vatRateToBp(item.vat_rate),
  }))
}

export function toDocumentData(row: InvoiceRow, items: readonly InvoiceItemRow[]): InvoiceDocumentData {
  const lines = itemsToLines(items)
  const totals = calculateInvoice(lines)
  const client = clientFromRow(row)

  return {
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    currency: row.currency,
    sender: senderFromRow(row),
    client: hasClientDetails(client) ? client : null,
    lines: totals.lines.map((line, index) => ({ ...line, description: lines[index].description })),
    vatBreakdown: totals.vatBreakdown,
    subtotalCents: totals.subtotalCents,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
    comments: row.comments,
  }
}

/**
 * The client a stored invoice points at: its id, or SAVED_CLIENT when the
 * client was deleted but its details are still on the invoice.
 */
export function formClientId(row: FormRow): string | null {
  if (row.client_id) return row.client_id
  return hasClientDetails(clientFromRow(row)) ? SAVED_CLIENT : null
}

/** The name shown for a deleted client's saved details. */
export function savedClientName(row: FormRow): string | null {
  return snapshotDisplayName(clientFromRow(row))
}

export function toFormValues(row: FormRow, items: readonly InvoiceItemRow[]): InvoiceFormValues {
  return {
    clientId: formClientId(row),
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    currency: row.currency,
    comments: row.comments ?? "",
    lines: sortedItems(items).map((item) => ({
      description: item.description,
      unit: item.unit,
      quantity: String(item.quantity),
      price: centsToInput(item.unit_price_cents),
      vatRate: vatBpToInput(vatRateToBp(item.vat_rate)),
    })),
  }
}

/** A draft passes full validation, so Save invoice / Send can finalize it (PRD §7). */
export function isComplete(row: FormRow, items: readonly InvoiceItemRow[]): boolean {
  return invoiceFinalSchema.safeParse(toFormValues(row, items)).success
}

export type PartyLines = {
  /** Company name, or the full name when there's no company. */
  primary: string | null
  /** The full name under the company name. */
  secondary: string | null
  address: string | null
  vatId: string | null
  email: string | null
  website: string | null
}

/** The "From" / "Bill to" block, in print order. Empty fields are left out by the renderers. */
export function partyLines(party: (ClientSnapshot & { website?: string | null }) | SenderSnapshot): PartyLines {
  const company = party.companyName?.trim() || null
  const name = party.fullName?.trim() || null

  return {
    primary: company ?? name,
    secondary: company ? name : null,
    address: party.address?.trim() || null,
    vatId: party.vatId?.trim() || null,
    email: party.email?.trim() || null,
    website: ("website" in party && party.website?.trim()) || null,
  }
}
