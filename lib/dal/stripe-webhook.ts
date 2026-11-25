import "server-only"

import { syncStripeAccount } from "@/lib/dal/stripe-accounts"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/database.types"

/**
 * Database writes for the Stripe webhook (Tech.md §11.4). Stripe calls it, not
 * a user, so everything goes through the admin client and filters explicitly.
 */

type Currency = Database["public"]["Enums"]["currency_code"]

const CURRENCIES: readonly Currency[] = ["EUR", "USD", "GBP", "BAM"]

/**
 * Records the event and says whether it still needs handling. False when an
 * earlier delivery of the same event was already handled.
 */
export async function beginStripeEvent(event: { id: string; type: string; account?: string }): Promise<boolean> {
  const admin = createAdminClient()

  const { error } = await admin
    .from("stripe_events")
    .upsert(
      { id: event.id, type: event.type, account: event.account ?? null },
      { onConflict: "id", ignoreDuplicates: true }
    )
  if (error) throw new Error(`Couldn't record the Stripe event: ${error.message}`)

  const { data, error: readError } = await admin
    .from("stripe_events")
    .select("processed_at")
    .eq("id", event.id)
    .single()
  if (readError) throw new Error(`Couldn't load the Stripe event: ${readError.message}`)
  return data.processed_at === null
}

/** Marks the event as handled, so later deliveries of it are skipped. */
export async function finishStripeEvent(eventId: string): Promise<void> {
  const { error } = await createAdminClient()
    .from("stripe_events")
    .update({ processed_at: new Date().toISOString() })
    .eq("id", eventId)
  if (error) throw new Error(`Couldn't mark the Stripe event as handled: ${error.message}`)
}

export type CheckoutPayment = {
  /** The connected account the session was paid on (`event.account`). */
  accountId: string
  invoiceId: string
  sessionId: string
  amountCents: number
  currency: string
}

export type CheckoutPaymentResult = "paid" | "already_paid" | "not_found" | "wrong_account" | "not_payable"

/**
 * Not paid → Paid after a Stripe payment (PRD §6.10 AC1). Only when the
 * session was paid on the account of the invoice's owner, and only once: a
 * repeated or late event finds the invoice already paid and changes nothing.
 */
export async function markInvoicePaidFromCheckout(payment: CheckoutPayment): Promise<CheckoutPaymentResult> {
  const admin = createAdminClient()

  const { data: invoice, error } = await admin
    .from("invoices")
    .select("id, user_id, status")
    .eq("id", payment.invoiceId)
    .maybeSingle()
  if (error) throw new Error(`Couldn't load the invoice: ${error.message}`)
  if (!invoice) return "not_found"

  // Only sessions on the owner's own account count: another connected account
  // could put any invoice id in its metadata.
  const { data: account, error: accountError } = await admin
    .from("stripe_accounts")
    .select("stripe_account_id")
    .eq("user_id", invoice.user_id)
    .maybeSingle()
  if (accountError) throw new Error(`Couldn't load the Stripe account: ${accountError.message}`)
  if (account?.stripe_account_id !== payment.accountId) return "wrong_account"

  if (invoice.status === "paid") return "already_paid"
  if (invoice.status !== "unpaid") return "not_payable"

  const currency = payment.currency.toUpperCase() as Currency
  if (!CURRENCIES.includes(currency)) throw new Error(`Unsupported currency from Stripe: ${payment.currency}`)

  const { data, error: updateError } = await admin
    .from("invoices")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_method: "stripe",
      paid_amount_cents: payment.amountCents,
      paid_currency: currency,
      stripe_checkout_session_id: payment.sessionId,
    })
    .eq("id", invoice.id)
    .eq("status", "unpaid")
    .select("id")
    .maybeSingle()
  if (updateError) throw new Error(`Couldn't mark the invoice as paid: ${updateError.message}`)
  // Nothing updated: it became paid (or changed) in between.
  return data ? "paid" : "already_paid"
}

/** Re-reads a connected account from Stripe and stores its flags (or removes it when it's gone). */
export async function syncStripeAccountById(accountId: string): Promise<void> {
  const { data: row, error } = await createAdminClient()
    .from("stripe_accounts")
    .select("user_id, stripe_account_id, charges_enabled, details_submitted")
    .eq("stripe_account_id", accountId)
    .maybeSingle()
  if (error) throw new Error(`Couldn't load the Stripe account: ${error.message}`)
  // An account this app doesn't know (or no longer knows): nothing to sync.
  if (!row) return
  await syncStripeAccount(row)
}

/** The freelancer disconnected their account from the platform: their pay pages become unavailable. */
export async function removeStripeAccount(accountId: string): Promise<void> {
  const { error } = await createAdminClient().from("stripe_accounts").delete().eq("stripe_account_id", accountId)
  if (error) throw new Error(`Couldn't remove the disconnected account: ${error.message}`)
}
