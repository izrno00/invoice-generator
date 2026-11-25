import "server-only"

import { cache } from "react"
import { z } from "zod"

import { requireUser } from "@/lib/dal/auth"
import { getProfile } from "@/lib/dal/profile"
import { expireInvoiceCheckouts, getMyStripeAccount } from "@/lib/dal/stripe-accounts"
import {
  isComplete,
  ITEM_COLUMNS,
  savedClientName,
  toDocumentData,
  toFormValues,
  type InvoiceDocumentData,
  type InvoiceItemRow,
  type InvoiceRow,
} from "@/lib/invoices/document"
import { defaultSendMessage, invoiceSubject } from "@/lib/invoices/email-text"
import { invoiceFileName } from "@/lib/invoices/format"
import { paymentLinkNote, paymentLinkStatus, type PaymentLinkStatus } from "@/lib/stripe/payment-link"
import { greetingName, senderName } from "@/lib/invoices/names"
import { clientFromRow } from "@/lib/invoices/snapshot"
import {
  allowedActions,
  isOverdue,
  todayUtc,
  type InvoiceActions,
  type InvoiceStatus,
  type StatusFilter,
} from "@/lib/invoices/status"
import type { Json } from "@/lib/supabase/database.types"
import { containsAnyOf } from "@/lib/supabase/filters"
import { createClient } from "@/lib/supabase/server"
import type { InvoiceFormValues } from "@/lib/validation/invoice"
import { isSenderComplete, type Profile } from "@/lib/validation/profile"

export const INVOICES_PAGE_SIZE = 20
export const PDF_BUCKET = "invoice-pdfs"


const SEARCH_COLUMNS = ["invoice_number", "client_display_name", "client_full_name"] as const

/** What the list, its row actions and the send dialog need. */
const LIST_COLUMNS =
  "id, invoice_number, status, invoice_date, due_date, currency, total_cents, comments, client_id, client_full_name, client_company_name, client_email, client_address, client_vat_id, client_display_name, first_sent_at, last_sent_at, content_hash, last_sent_content_hash"

type ListRow = Pick<
  InvoiceRow,
  | "id"
  | "invoice_number"
  | "status"
  | "invoice_date"
  | "due_date"
  | "currency"
  | "total_cents"
  | "comments"
  | "client_id"
  | "client_full_name"
  | "client_company_name"
  | "client_email"
  | "client_address"
  | "client_vat_id"
  | "client_display_name"
  | "first_sent_at"
  | "last_sent_at"
  | "content_hash"
  | "last_sent_content_hash"
>

/** Everything the send dialog shows (PRD §6.7). */
export type SendDetails = {
  invoiceId: string
  invoiceNumber: string
  to: string
  subject: string
  defaultMessage: string
  fileName: string
  /** Sent before: the dialog says "Resend". */
  resend: boolean
  /** Whether the email will have a payment link, as far as the stored Stripe status says (PRD §6.7). */
  payment: { status: PaymentLinkStatus; note: string }
}

export type InvoiceSummary = {
  id: string
  invoiceNumber: string
  status: InvoiceStatus
  invoiceDate: string
  dueDate: string
  currency: string
  totalCents: number
  /** Null for a draft without a client. */
  clientName: string | null
  /** The client was deleted; the invoice keeps its saved details. */
  clientDeleted: boolean
  clientEmail: string | null
  lastSentAt: string | null
  overdue: boolean
  actions: InvoiceActions
  /** Null when Send can't open the dialog. */
  send: SendDetails | null
}

export type InvoiceList = {
  rows: InvoiceSummary[]
  total: number
  page: number
  pageCount: number
}

export type InvoiceDetails = InvoiceSummary & {
  document: InvoiceDocumentData
  formValues: InvoiceFormValues
  /** Shown as "<name> (deleted client)" on the form. */
  savedClientName: string | null
  /** The PDF matches the invoice (no regeneration needed). */
  pdfCurrent: boolean
}

export type InvoiceRecord = { row: InvoiceRow; items: InvoiceItemRow[] }

export type InvoiceFilters = {
  q?: string
  status?: StatusFilter
  clientId?: string
  from?: string
  to?: string
  page: number
}

function isUuid(id: string) {
  return z.uuid().safeParse(id).success
}

function sendDetails(row: ListRow, profile: Profile, paymentsEnabled: boolean): SendDetails | null {
  if (!row.client_email) return null
  const client = clientFromRow(row)
  const paymentStatus = paymentLinkStatus({
    connected: paymentsEnabled,
    totalCents: row.total_cents,
    currency: row.currency,
  })

  return {
    invoiceId: row.id,
    invoiceNumber: row.invoice_number,
    to: row.client_email,
    subject: invoiceSubject(row.invoice_number, senderName(profile) ?? ""),
    defaultMessage: defaultSendMessage({
      greeting: greetingName(client),
      invoiceNumber: row.invoice_number,
      totalCents: row.total_cents,
      currency: row.currency,
      dueDate: row.due_date,
      updated: row.first_sent_at !== null && row.content_hash !== row.last_sent_content_hash,
    }),
    fileName: invoiceFileName(row.invoice_number),
    resend: row.first_sent_at !== null,
    payment: { status: paymentStatus, note: paymentLinkNote(paymentStatus, row.currency) },
  }
}

function toSummary(
  row: ListRow,
  {
    profile,
    draftComplete,
    today,
    paymentsEnabled,
  }: {
    profile: Profile
    draftComplete: boolean
    today: string
    /** The user's Stripe account can accept payments (stored flag; Send re-checks with Stripe). */
    paymentsEnabled: boolean
  }
): InvoiceSummary {
  const actions = allowedActions({
    status: row.status,
    sent: row.first_sent_at !== null,
    clientEmail: row.client_email,
    senderComplete: isSenderComplete(profile),
    draftComplete,
  })

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    currency: row.currency,
    totalCents: row.total_cents,
    clientName: row.client_display_name ?? savedClientName(row),
    clientDeleted: row.client_id === null && savedClientName(row) !== null,
    clientEmail: row.client_email,
    lastSentAt: row.last_sent_at,
    overdue: isOverdue({ status: row.status, dueDate: row.due_date }, today),
    actions,
    send: actions.send.kind === "dialog" ? sendDetails(row, profile, paymentsEnabled) : null,
  }
}

/** Items of the given drafts, to tell whether Send can finalize them. */
async function draftItems(supabase: Awaited<ReturnType<typeof createClient>>, draftIds: string[]) {
  const byInvoice = new Map<string, InvoiceItemRow[]>()
  if (draftIds.length === 0) return byInvoice

  const { data, error } = await supabase
    .from("invoice_items")
    .select(`invoice_id, ${ITEM_COLUMNS}`)
    .in("invoice_id", draftIds)
  if (error) throw new Error(`Couldn't load invoice items: ${error.message}`)

  for (const item of data) {
    byInvoice.set(item.invoice_id, [...(byInvoice.get(item.invoice_id) ?? []), item])
  }
  return byInvoice
}

/** One page of the user's invoices, newest first (PRD §6.11). */
export async function listInvoices(filters: InvoiceFilters): Promise<InvoiceList> {
  const user = await requireUser()
  const supabase = await createClient()
  const today = todayUtc()
  const { q, status, clientId, from: dateFrom, to: dateTo, page } = filters

  function filtered(head: boolean) {
    let query = supabase
      .from("invoices")
      .select(LIST_COLUMNS, { count: "exact", head })
      .eq("user_id", user.id)

    if (status === "overdue") query = query.eq("status", "unpaid").lt("due_date", today)
    else if (status) query = query.eq("status", status)
    if (clientId) query = query.eq("client_id", clientId)
    if (dateFrom) query = query.gte("invoice_date", dateFrom)
    if (dateTo) query = query.lte("invoice_date", dateTo)
    if (q) query = query.or(containsAnyOf(SEARCH_COLUMNS, q))
    return query
  }

  const start = (page - 1) * INVOICES_PAGE_SIZE
  const [{ data, error, count }, profile, stripeAccount] = await Promise.all([
    filtered(false)
      .order("invoice_date", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id")
      .range(start, start + INVOICES_PAGE_SIZE - 1),
    getProfile(),
    getMyStripeAccount(),
  ])

  let total = count ?? 0
  if (error) {
    // PGRST103: the page starts past the last row. The total is still needed.
    if (error.code !== "PGRST103") throw new Error(`Couldn't load invoices: ${error.message}`)
    const counted = await filtered(true)
    if (counted.error) throw new Error(`Couldn't count invoices: ${counted.error.message}`)
    total = counted.count ?? 0
  }

  const rows = data ?? []
  const items = await draftItems(
    supabase,
    rows.filter((row) => row.status === "draft").map((row) => row.id)
  )

  return {
    rows: rows.map((row) =>
      toSummary(row, {
        profile,
        today,
        draftComplete: row.status === "draft" && isComplete(row, items.get(row.id) ?? []),
        paymentsEnabled: stripeAccount?.charges_enabled ?? false,
      })
    ),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / INVOICES_PAGE_SIZE)),
  }
}

/**
 * An invoice with its items, or null if it doesn't exist or belongs to
 * someone else (RLS). Not cached: actions read it again after writing.
 */
export async function getInvoiceRecord(id: string): Promise<InvoiceRecord | null> {
  await requireUser()
  if (!isUuid(id)) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("invoices")
    .select(`*, invoice_items(${ITEM_COLUMNS})`)
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(`Couldn't load invoice: ${error.message}`)
  if (!data) return null

  const { invoice_items: items, ...row } = data
  return { row, items }
}

/** One invoice for the details and edit pages. */
export const getInvoice = cache(async (id: string): Promise<InvoiceDetails | null> => {
  const [record, profile, stripeAccount] = await Promise.all([getInvoiceRecord(id), getProfile(), getMyStripeAccount()])
  if (!record) return null
  const { row, items } = record

  return {
    ...toSummary(row, {
      profile,
      today: todayUtc(),
      draftComplete: row.status === "draft" && isComplete(row, items),
      paymentsEnabled: stripeAccount?.charges_enabled ?? false,
    }),
    document: toDocumentData(row, items),
    formValues: toFormValues(row, items),
    savedClientName: row.client_id === null ? savedClientName(row) : null,
    pdfCurrent: row.pdf_path !== null && row.pdf_content_hash === row.content_hash,
  }
})

export type SaveInvoiceRow = Pick<
  InvoiceRow,
  | "client_id"
  | "status"
  | "invoice_date"
  | "due_date"
  | "currency"
  | "comments"
  | "sender_full_name"
  | "sender_company_name"
  | "sender_email"
  | "sender_address"
  | "sender_vat_id"
  | "sender_website"
  | "client_full_name"
  | "client_company_name"
  | "client_email"
  | "client_address"
  | "client_vat_id"
  | "client_display_name"
  | "subtotal_cents"
  | "tax_cents"
  | "total_cents"
  | "content_hash"
> & { id?: string }

export type SaveInvoiceItem = InvoiceItemRow & { net_cents: number; vat_cents: number }

/**
 * Creates or updates an invoice and replaces its items in one transaction
 * (`save_invoice`, DB.md §4). Null if the invoice to update doesn't exist.
 */
export async function saveInvoiceRecord(invoice: SaveInvoiceRow, items: SaveInvoiceItem[]): Promise<InvoiceRow | null> {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("save_invoice", {
    p_invoice: invoice as unknown as Json,
    p_items: items as unknown as Json,
  })

  if (error?.code === "P0002") return null
  if (error) throw new Error(`Couldn't save invoice: ${error.message}`)
  return data as InvoiceRow
}

/** Records the stored PDF's path and the content it was made from. */
export async function setPdfInfo(id: string, pdf: { path: string; contentHash: string }) {
  await requireUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from("invoices")
    .update({ pdf_path: pdf.path, pdf_content_hash: pdf.contentHash, pdf_generated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(`Couldn't record the PDF: ${error.message}`)
}

/** Not paid → Paid, by hand (PRD §6.10 AC2). False if it isn't Not paid (or isn't the user's). */
export async function markInvoicePaid(id: string): Promise<boolean> {
  await requireUser()
  const supabase = await createClient()

  const record = await getInvoiceRecord(id)
  if (!record || record.row.status !== "unpaid") return false

  const { data, error } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_method: "manual",
      paid_amount_cents: record.row.total_cents,
      paid_currency: record.row.currency,
    })
    .eq("id", id)
    .eq("status", "unpaid")
    // An edit in between changes the total: then nothing is updated and the user tries again.
    .eq("total_cents", record.row.total_cents)
    .eq("currency", record.row.currency)
    .select("id")
    .maybeSingle()

  if (error) throw new Error(`Couldn't mark the invoice as paid: ${error.message}`)
  if (!data) return false

  // The client's payment link stops accepting payments (PRD §6.10 AC2).
  await expireInvoiceCheckouts([record.row.stripe_checkout_session_id])
  return true
}

/**
 * Deletes a Draft or Not paid invoice and its PDF (PRD §6.14). Items and the
 * email log go with it (FK cascade). False if there's no such deletable invoice.
 */
export async function deleteInvoiceRecord(id: string): Promise<boolean> {
  await requireUser()
  if (!isUuid(id)) return false
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .in("status", ["draft", "unpaid"])
    .select("id, pdf_path, stripe_checkout_session_id")
    .maybeSingle()

  if (error) throw new Error(`Couldn't delete invoice: ${error.message}`)
  if (!data) return false

  // The row is gone, so removing its file is best effort.
  if (data.pdf_path) {
    const { error: storageError } = await supabase.storage.from(PDF_BUCKET).remove([data.pdf_path])
    if (storageError) console.error(`Couldn't delete invoice PDF: ${storageError.message}`)
  }

  // Any unfinished checkout is cancelled; the payment link itself is gone with the row (PRD §6.14 AC4).
  await expireInvoiceCheckouts([data.stripe_checkout_session_id])
  return true
}

/** One row of the send log (`invoice_emails`). Best effort: a log failure never hides the send result. */
export async function logInvoiceEmail(entry: {
  invoiceId: string
  to: string
  subject: string
  message: string
  includedPaymentLink: boolean
  paymentAmountCents: number | null
  result: { ok: true; id: string } | { ok: false; error: string }
}) {
  await requireUser()
  const supabase = await createClient()

  const { error } = await supabase.from("invoice_emails").insert({
    invoice_id: entry.invoiceId,
    to_email: entry.to,
    subject: entry.subject,
    message: entry.message,
    included_payment_link: entry.includedPaymentLink,
    payment_amount_cents: entry.paymentAmountCents,
    status: entry.result.ok ? "sent" : "failed",
    resend_email_id: entry.result.ok ? entry.result.id : null,
    error: entry.result.ok ? null : entry.result.error.slice(0, 2000),
  })
  if (error) console.error(`Couldn't log the invoice email: ${error.message}`)
}

/** After a successful send (Tech.md §10.1 step 8). */
export async function recordInvoiceSent(
  row: Pick<InvoiceRow, "id" | "first_sent_at" | "content_hash">,
  /** Set when the email had a payment link: the link now charges this amount (PRD §6.8 AC5). */
  link: { token: string; amountCents: number; currency: InvoiceRow["currency"] } | null = null
) {
  await requireUser()
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("invoices")
    .update({
      first_sent_at: row.first_sent_at ?? now,
      last_sent_at: now,
      last_sent_content_hash: row.content_hash,
      ...(link
        ? { payment_token: link.token, payment_amount_cents: link.amountCents, payment_currency: link.currency }
        : {}),
    })
    .eq("id", row.id)
    .eq("status", "unpaid")
  if (error) throw new Error(`Couldn't record the send: ${error.message}`)
}
