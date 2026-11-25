"use server"

import { revalidatePath } from "next/cache"
import { redirect, RedirectType } from "next/navigation"
import { z } from "zod"

import { requireUser } from "@/lib/dal/auth"
import { getClient } from "@/lib/dal/clients"
import {
  deleteInvoiceRecord,
  getInvoiceRecord,
  logInvoiceEmail,
  markInvoicePaid,
  recordInvoiceSent,
  saveInvoiceRecord,
  type InvoiceRecord,
  type SaveInvoiceItem,
  type SaveInvoiceRow,
} from "@/lib/dal/invoices"
import { getProfile } from "@/lib/dal/profile"
import { expireInvoiceCheckouts, getMyStripeAccount, syncStripeAccount } from "@/lib/dal/stripe-accounts"
import { sendInvoiceEmail } from "@/lib/email/send-invoice"
import { calculateInvoice } from "@/lib/invoices/calc"
import { contentHash } from "@/lib/invoices/content-hash"
import { addDaysIso, defaultDueDate } from "@/lib/invoices/dates"
import { itemsToLines, toFormValues, type InvoiceItemRow, type InvoiceRow } from "@/lib/invoices/document"
import { invoiceSubject } from "@/lib/invoices/email-text"
import { vatBpToRate } from "@/lib/invoices/money"
import { senderName } from "@/lib/invoices/names"
import {
  clientColumns,
  clientFromRecord,
  clientFromRow,
  EMPTY_CLIENT_SNAPSHOT,
  hasClientDetails,
  senderColumns,
  senderFromProfile,
  senderFromRow,
  type ClientSnapshot,
  type SenderSnapshot,
} from "@/lib/invoices/snapshot"
import { NO_CLIENT_EMAIL, PROFILE_INCOMPLETE, todayUtc } from "@/lib/invoices/status"
import {
  INVOICE_ERRORS,
  invoiceFinalSchema,
  invoiceSchemaFor,
  SAVED_CLIENT,
  sendInvoiceSchema,
  type InvoiceValues,
} from "@/lib/validation/invoice"
import { ensureCurrentPdf, getCurrentPdf } from "@/lib/pdf/render"
import { appUrl } from "@/lib/stripe/index"
import { paymentLinkStatus } from "@/lib/stripe/payment-link"
import { newPaymentToken } from "@/lib/stripe/token"
import { isSenderComplete } from "@/lib/validation/profile"

const SAVE_FAILED = "Couldn't save the invoice. Please try again."
const NOT_FOUND = "This invoice no longer exists."
const PAID_LOCKED = "Paid invoices can't be changed."
const SEND_FAILED = "We couldn't send the email. Please try again."
const CLIENT_GONE = "This client no longer exists. Choose another one."

/** Paths whose pages show this invoice, or lists that include it. */
function revalidateInvoice(id: string, clientIds: (string | null)[] = []) {
  revalidatePath("/invoices")
  revalidatePath(`/invoices/${id}`)
  revalidatePath(`/invoices/${id}/edit`)
  revalidatePath("/dashboard")
  for (const clientId of new Set(clientIds)) {
    if (clientId) revalidatePath(`/clients/${clientId}`)
  }
  revalidatePath("/clients")
}

/** Zod issues as `{ "lines.0.price": "message" }`, first message per field. */
function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join(".")
    errors[path] ??= issue.message
  }
  return errors
}

function itemRows(lines: InvoiceValues["lines"]): SaveInvoiceItem[] {
  return calculateInvoice(lines).lines.map((line, position) => ({
    position,
    description: lines[position].description,
    unit: line.unit,
    quantity: line.quantity,
    unit_price_cents: line.unitPriceCents,
    vat_rate: vatBpToRate(line.vatRateBp),
    net_cents: line.netCents,
    vat_cents: line.vatCents,
  }))
}

/** The full row for `save_invoice`: snapshots, totals and the content hash. */
function invoiceRow({
  id,
  status,
  values,
  clientId,
  sender,
  client,
}: {
  id?: string
  status: "draft" | "unpaid"
  values: InvoiceValues
  clientId: string | null
  sender: SenderSnapshot
  client: ClientSnapshot
}): SaveInvoiceRow {
  const totals = calculateInvoice(values.lines)
  return {
    id,
    status,
    client_id: clientId,
    invoice_date: values.invoiceDate,
    due_date: values.dueDate,
    currency: values.currency,
    comments: values.comments,
    ...senderColumns(sender),
    ...clientColumns(client),
    subtotal_cents: totals.subtotalCents,
    tax_cents: totals.taxCents,
    total_cents: totals.totalCents,
    content_hash: contentHash({
      invoiceDate: values.invoiceDate,
      dueDate: values.dueDate,
      currency: values.currency,
      comments: values.comments,
      sender,
      client,
      lines: values.lines,
    }),
  }
}

/** Generates the PDF of a finished invoice. False if that failed (the save still counts, PRD §9). */
async function tryGeneratePdf(record: InvoiceRecord): Promise<boolean> {
  try {
    await ensureCurrentPdf(record)
    return true
  } catch (error) {
    console.error("[pdf] Couldn't generate the invoice PDF:", error)
    return false
  }
}

function toItemRows(items: SaveInvoiceItem[]): InvoiceItemRow[] {
  return items.map(({ position, description, unit, quantity, unit_price_cents, vat_rate }) => ({
    position,
    description,
    unit,
    quantity,
    unit_price_cents,
    vat_rate,
  }))
}

export type SaveInvoiceResult =
  | { ok: true; id: string; needsResendPrompt: boolean; pdfFailed: boolean }
  | { ok: false; fieldErrors?: Record<string, string>; message: string }

const saveInput = z.object({
  id: z.uuid().optional(),
  mode: z.enum(["draft", "final"]),
  values: z.unknown(),
  /** Re-copy the current profile and client details (PRD §6.5.5). */
  refreshDetails: z.boolean(),
})

/** Save as draft / Save invoice (PRD §6.5.4, Tech.md §8.2). */
export async function saveInvoice(input: unknown): Promise<SaveInvoiceResult> {
  await requireUser("/invoices")

  const request = saveInput.safeParse(input)
  if (!request.success) return { ok: false, message: SAVE_FAILED }
  const { id, mode, refreshDetails } = request.data

  const parsed = invoiceSchemaFor(mode).safeParse(request.data.values)
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrorsOf(parsed.error), message: SAVE_FAILED }
  const values = parsed.data

  try {
    const existing = id ? await getInvoiceRecord(id) : null
    if (id && !existing) return { ok: false, message: NOT_FOUND }
    if (existing?.row.status === "paid") return { ok: false, message: PAID_LOCKED }
    if (existing?.row.status === "unpaid" && mode === "draft") {
      return { ok: false, message: "A finished invoice can't go back to being a draft." }
    }

    const fresh = !existing || refreshDetails
    const sender = fresh ? senderFromProfile(await getProfile()) : senderFromRow(existing.row)

    // The client: a chosen one (fresh details when new, refreshed or changed), a
    // deleted one's saved details, or none.
    let clientId: string | null = null
    let client = EMPTY_CLIENT_SNAPSHOT
    if (values.clientId === SAVED_CLIENT) {
      const saved = existing && existing.row.client_id === null ? clientFromRow(existing.row) : null
      if (!saved || !hasClientDetails(saved)) {
        return { ok: false, fieldErrors: { clientId: INVOICE_ERRORS.client }, message: SAVE_FAILED }
      }
      client = saved
    } else if (values.clientId) {
      clientId = values.clientId
      if (fresh || existing.row.client_id !== clientId) {
        const record = await getClient(clientId)
        if (!record) return { ok: false, fieldErrors: { clientId: CLIENT_GONE }, message: SAVE_FAILED }
        client = clientFromRecord(record)
      } else {
        client = clientFromRow(existing.row)
      }
    }

    const items = itemRows(values.lines)
    const status = mode === "final" ? "unpaid" : "draft"
    const row = await saveInvoiceRecord(invoiceRow({ id, status, values, clientId, sender, client }), items)
    if (!row) return { ok: false, message: NOT_FOUND }

    const pdfFailed = row.status === "unpaid" ? !(await tryGeneratePdf({ row, items: toItemRows(items) })) : false

    // Only when this save changed the PDF of an invoice the client already has (PRD §6.8).
    const needsResendPrompt =
      row.first_sent_at !== null &&
      row.content_hash !== existing?.row.content_hash &&
      row.content_hash !== row.last_sent_content_hash

    revalidateInvoice(row.id, [clientId, existing?.row.client_id ?? null])
    return { ok: true, id: row.id, needsResendPrompt, pdfFailed }
  } catch (error) {
    console.error(error)
    return { ok: false, message: SAVE_FAILED }
  }
}

export type InvoiceActionResult = { ok: true } | { ok: false; message: string }

const duplicateInput = z.object({ id: z.uuid(), today: z.iso.date() })

/** A new draft from any invoice, with fresh details and dates (PRD §6.13). Redirects to its edit form. */
export async function duplicateInvoice(input: unknown): Promise<InvoiceActionResult> {
  await requireUser("/invoices")

  const parsed = duplicateInput.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Couldn't duplicate the invoice. Please try again." }

  // The browser's date, as long as it's within a day of the server's (time zones).
  const serverToday = todayUtc()
  const { today: browserToday } = parsed.data
  const today =
    browserToday >= addDaysIso(serverToday, -1) && browserToday <= addDaysIso(serverToday, 1) ? browserToday : serverToday

  let newId: string
  try {
    const source = await getInvoiceRecord(parsed.data.id)
    if (!source) return { ok: false, message: NOT_FOUND }
    const { row } = source

    // The same client with its current details; a deleted client keeps the saved ones.
    const current = row.client_id ? await getClient(row.client_id) : null
    const client = current ? clientFromRecord(current) : clientFromRow(row)

    const values: InvoiceValues = {
      clientId: current?.id ?? null,
      invoiceDate: today,
      dueDate: defaultDueDate(today),
      currency: row.currency,
      comments: row.comments,
      lines: itemsToLines(source.items),
    }

    const saved = await saveInvoiceRecord(
      invoiceRow({
        status: "draft",
        values,
        clientId: current?.id ?? null,
        sender: senderFromProfile(await getProfile()),
        client,
      }),
      itemRows(values.lines)
    )
    if (!saved) return { ok: false, message: NOT_FOUND }
    newId = saved.id
    revalidateInvoice(saved.id, [saved.client_id])
  } catch (error) {
    console.error(error)
    return { ok: false, message: "Couldn't duplicate the invoice. Please try again." }
  }

  redirect(`/invoices/${newId}/edit`)
}

const deleteInput = z.object({ id: z.uuid(), returnToList: z.boolean() })

/**
 * Deletes a Draft or Not paid invoice (PRD §6.14). With `returnToList` (on
 * the invoice's own page) it redirects, so that page never shows "not found".
 */
export async function deleteInvoice(input: unknown): Promise<InvoiceActionResult> {
  await requireUser("/invoices")

  const parsed = deleteInput.safeParse(input)
  if (!parsed.success) return { ok: false, message: "Couldn't delete the invoice. Please try again." }
  const { id, returnToList } = parsed.data

  let clientId: string | null = null
  try {
    const record = await getInvoiceRecord(id)
    if (!record) return { ok: false, message: NOT_FOUND }
    if (record.row.status === "paid") return { ok: false, message: "Paid invoices can't be deleted." }
    clientId = record.row.client_id

    if (!(await deleteInvoiceRecord(id))) return { ok: false, message: "This invoice can't be deleted." }
  } catch (error) {
    console.error(error)
    return { ok: false, message: "Couldn't delete the invoice. Please try again." }
  }

  revalidateInvoice(id, [clientId])
  if (returnToList) redirect("/invoices?deleted=1", RedirectType.replace)
  return { ok: true }
}

/** Mark as paid, after the user confirmed (PRD §6.10 AC2). Irreversible. */
export async function markInvoicePaidAction(id: unknown): Promise<InvoiceActionResult> {
  await requireUser("/invoices")

  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: NOT_FOUND }

  try {
    const record = await getInvoiceRecord(parsed.data)
    if (!record) return { ok: false, message: NOT_FOUND }
    if (record.row.status !== "unpaid") return { ok: false, message: "Only Not paid invoices can be marked as paid." }

    if (!(await markInvoicePaid(parsed.data))) {
      return { ok: false, message: "The invoice changed in the meantime. Reload the page and try again." }
    }
    revalidateInvoice(parsed.data, [record.row.client_id])
    return { ok: true }
  } catch (error) {
    console.error(error)
    return { ok: false, message: "Couldn't mark the invoice as paid. Please try again." }
  }
}

export type SendInvoiceResult =
  /** `paymentLink`: the email included a payment link. */
  | { ok: true; to: string; paymentLink: boolean }
  /** `needsEdit`: a draft that isn't finished. The dialog sends the user to the edit form. */
  | { ok: false; message: string; needsEdit?: boolean }

type PaymentLink = { token: string; url: string; amountCents: number; currency: InvoiceRow["currency"] }

/**
 * The payment link for this send, decided before anything is written (Tech.md
 * §10.1 step 5). Only when the user's Stripe account can take payments right
 * now (checked live with Stripe) and the total reaches Stripe's minimum
 * (PRD §6.7 AC5–6). The invoice keeps its token, so the client's link never changes.
 */
async function decidePaymentLink(row: InvoiceRow): Promise<PaymentLink | null> {
  const stored = await getMyStripeAccount()
  const account = stored ? await syncStripeAccount(stored) : null
  const status = paymentLinkStatus({
    connected: account?.chargesEnabled ?? false,
    totalCents: row.total_cents,
    currency: row.currency,
  })
  if (status !== "included") return null

  const token = row.payment_token ?? newPaymentToken()
  return { token, url: appUrl(`/pay/${token}`), amountCents: row.total_cents, currency: row.currency }
}

/** Finalizes a draft for Send (PRD §6.7 AC2): Not paid, PDF generated. Null if it isn't complete. */
async function finalizeDraft(record: InvoiceRecord): Promise<InvoiceRecord | null> {
  const parsed = invoiceFinalSchema.safeParse(toFormValues(record.row, record.items))
  if (!parsed.success) return null

  const { row } = record
  const items = itemRows(parsed.data.lines)
  const saved = await saveInvoiceRecord(
    invoiceRow({
      id: row.id,
      status: "unpaid",
      values: parsed.data,
      clientId: row.client_id,
      sender: senderFromRow(row),
      client: clientFromRow(row),
    }),
    items
  )
  return saved && { row: saved, items: toItemRows(items) }
}

/** Send / Resend (PRD §6.7, Tech.md §10.1). Nothing is recorded as sent unless the email went out. */
export async function sendInvoice(input: unknown): Promise<SendInvoiceResult> {
  await requireUser("/invoices")

  const parsed = sendInvoiceSchema.safeParse(input)
  if (!parsed.success) {
    const tooLong = parsed.error.issues.find((issue) => issue.path[0] === "message")
    return { ok: false, message: tooLong?.message ?? SEND_FAILED }
  }
  const { invoiceId, message, attemptId } = parsed.data

  let record: InvoiceRecord | null
  try {
    const [found, profile] = await Promise.all([getInvoiceRecord(invoiceId), getProfile()])
    record = found
    if (!record) return { ok: false, message: NOT_FOUND }
    if (record.row.status === "paid") return { ok: false, message: "Paid invoices can't be sent." }
    if (!isSenderComplete(profile)) return { ok: false, message: PROFILE_INCOMPLETE }
    if (!record.row.client_email) return { ok: false, message: NO_CLIENT_EMAIL }

    if (record.row.status === "draft") {
      record = await finalizeDraft(record)
      if (!record) return { ok: false, needsEdit: true, message: "Finish the invoice before sending it." }
      revalidateInvoice(invoiceId, [record.row.client_id])
    }

    const pdf = await getCurrentPdf(record)
    const { row } = record
    const link = await decidePaymentLink(row)
    const sender = senderName(profile)!
    const subject = invoiceSubject(row.invoice_number, sender)
    const to = row.client_email!

    const result = await sendInvoiceEmail({
      invoiceId,
      attemptId,
      invoiceNumber: row.invoice_number,
      to,
      replyTo: profile.email!,
      senderName: sender,
      subject,
      message,
      totalCents: row.total_cents,
      currency: row.currency,
      dueDate: row.due_date,
      pdf,
      paymentUrl: link?.url ?? null,
    })

    await logInvoiceEmail({
      invoiceId,
      to,
      subject,
      message,
      includedPaymentLink: link !== null,
      paymentAmountCents: link?.amountCents ?? null,
      result,
    })
    if (!result.ok) return { ok: false, message: SEND_FAILED }

    try {
      await recordInvoiceSent(row, link)
    } catch (error) {
      // The email went out; only the "Sent" date (and a new link's amount) is missing.
      console.error(error)
    }

    // A new amount: an unfinished checkout for the old one stops working, so the
    // client's next click charges what this email says (Tech.md §10.1 step 8).
    if (link && (row.payment_amount_cents !== link.amountCents || row.payment_currency !== link.currency)) {
      await expireInvoiceCheckouts([row.stripe_checkout_session_id])
    }

    revalidateInvoice(invoiceId, [row.client_id])
    return { ok: true, to, paymentLink: link !== null }
  } catch (error) {
    console.error(error)
    return { ok: false, message: SEND_FAILED }
  }
}
