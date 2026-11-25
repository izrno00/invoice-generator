import "server-only"

import { getStripeAccountByUserId } from "@/lib/dal/stripe-accounts"
import { formatDate, formatMoney } from "@/lib/invoices/format"
import { senderName } from "@/lib/invoices/names"
import { isPaidSession, retrieveCheckoutSession } from "@/lib/stripe/checkout"
import { isPaymentTokenShape } from "@/lib/stripe/payment-link"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/database.types"

/**
 * The public pay page (PRD §6.9, Tech.md §11.3). The client isn't logged in,
 * so this uses the admin client: always by `payment_token`, and only the
 * columns the page and checkout need.
 */

const PAY_COLUMNS =
  "id, user_id, invoice_number, invoice_date, due_date, status, payment_amount_cents, payment_currency, client_email, stripe_checkout_session_id, sender_full_name, sender_company_name"

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"]

export type PayInvoice = Pick<
  InvoiceRow,
  | "id"
  | "user_id"
  | "invoice_number"
  | "invoice_date"
  | "due_date"
  | "status"
  | "client_email"
  | "stripe_checkout_session_id"
  | "sender_full_name"
  | "sender_company_name"
> & {
  payment_amount_cents: number
  payment_currency: InvoiceRow["currency"]
}

/** The invoice behind a payment link, or null when the link is unknown (never sent with a link, or deleted). */
export async function getPayInvoice(token: string): Promise<PayInvoice | null> {
  if (!isPaymentTokenShape(token)) return null

  const { data, error } = await createAdminClient()
    .from("invoices")
    .select(PAY_COLUMNS)
    .eq("payment_token", token)
    .maybeSingle()

  if (error) throw new Error(`Couldn't load the invoice: ${error.message}`)
  if (!data || data.payment_amount_cents === null || data.payment_currency === null) return null
  return { ...data, payment_amount_cents: data.payment_amount_cents, payment_currency: data.payment_currency }
}

/** Remembers the latest checkout, so the next one can reuse or cancel it. Only while the invoice is Not paid. */
export async function savePayCheckoutSession(invoiceId: string, sessionId: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("invoices")
    .update({ stripe_checkout_session_id: sessionId })
    .eq("id", invoiceId)
    .eq("status", "unpaid")
  if (error) throw new Error(`Couldn't save the checkout session: ${error.message}`)
}

export type PaySummary = {
  senderName: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string
  amount: string
}

export type PayPageState =
  | { kind: "invalid" }
  | { kind: "paid" }
  | { kind: "unavailable" }
  | { kind: "payable"; summary: PaySummary }

/** The checkout before this one was paid. Until the webhook has marked the invoice Paid, this stops a second payment. */
export async function hasPaidCheckout(accountId: string, sessionId: string | null): Promise<boolean> {
  if (!sessionId) return false
  try {
    return isPaidSession(await retrieveCheckoutSession(accountId, sessionId))
  } catch (error) {
    console.error("[stripe] Couldn't check the last checkout session:", error)
    return false
  }
}

/** What the pay page shows (PRD §6.9 AC5). Uses the stored account flag; Pay now checks Stripe live. */
export async function getPayPageState(token: string): Promise<PayPageState> {
  const invoice = await getPayInvoice(token)
  if (!invoice || invoice.status === "draft") return { kind: "invalid" }
  if (invoice.status === "paid") return { kind: "paid" }

  const account = await getStripeAccountByUserId(invoice.user_id)
  if (account && (await hasPaidCheckout(account.stripe_account_id, invoice.stripe_checkout_session_id))) {
    return { kind: "paid" }
  }
  if (!account?.charges_enabled) return { kind: "unavailable" }

  return {
    kind: "payable",
    summary: {
      senderName: senderName({ fullName: invoice.sender_full_name, companyName: invoice.sender_company_name }) ?? "",
      invoiceNumber: invoice.invoice_number,
      invoiceDate: formatDate(invoice.invoice_date),
      dueDate: formatDate(invoice.due_date),
      amount: formatMoney(invoice.payment_amount_cents, invoice.payment_currency),
    },
  }
}

/**
 * For the success page: the invoice number and the amount paid, when the
 * checkout session really belongs to this link's invoice and is paid. Null
 * otherwise (the page then just says thank you). Marks nothing as paid.
 */
export async function getPaidCheckoutSummary(
  token: string,
  sessionId: string
): Promise<{ invoiceNumber: string; amount: string } | null> {
  if (!/^cs_[A-Za-z0-9_]{1,200}$/.test(sessionId)) return null
  const invoice = await getPayInvoice(token)
  if (!invoice) return null
  const account = await getStripeAccountByUserId(invoice.user_id)
  if (!account) return null

  const session = await retrieveCheckoutSession(account.stripe_account_id, sessionId)
  if (session.metadata?.invoice_id !== invoice.id || !isPaidSession(session) || session.amount_total === null) {
    return null
  }
  return {
    invoiceNumber: invoice.invoice_number,
    amount: formatMoney(session.amount_total, session.currency?.toUpperCase() ?? invoice.payment_currency),
  }
}
