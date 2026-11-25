import "server-only"

import type Stripe from "stripe"

import {
  beginStripeEvent,
  finishStripeEvent,
  markInvoicePaidFromCheckout,
  removeStripeAccount,
  syncStripeAccountById,
} from "@/lib/dal/stripe-webhook"
import { stripe } from "@/lib/stripe/index"

/**
 * The Connect webhook (Tech.md §11.4): one endpoint for events on connected
 * accounts. Every event is handled at most once (`stripe_events`); a handler
 * that throws leaves it unhandled, so Stripe's retry gets another go.
 */

/** The verified event, or null when the signature doesn't match (or is missing). */
export function verifyWebhookEvent(payload: string, signature: string | null): Stripe.Event | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set")
  if (!signature) return null
  try {
    return stripe().webhooks.constructEvent(payload, signature, secret)
  } catch (error) {
    console.error("[stripe] Webhook signature check failed:", error)
    return null
  }
}

/** Handles the event unless an earlier delivery already did. Throws when it should be retried. */
export async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  if (!(await beginStripeEvent(event))) return
  await handleEvent(event)
  await finishStripeEvent(event.id)
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return handlePaidCheckout(event.data.object, event.account)
    case "account.updated":
      if (event.account) await syncStripeAccountById(event.account)
      return
    case "account.application.deauthorized":
      if (event.account) await removeStripeAccount(event.account)
      return
    default:
      // Not subscribed to, or nothing to do: acknowledged and ignored.
      return
  }
}

async function handlePaidCheckout(session: Stripe.Checkout.Session, accountId: string | undefined): Promise<void> {
  // Card payments are paid at completion. Delayed methods report it later
  // through `async_payment_succeeded`.
  if (session.payment_status !== "paid") return

  const invoiceId = session.metadata?.invoice_id
  if (!invoiceId || !accountId || session.amount_total === null || !session.currency) {
    console.warn(`[stripe] Checkout session ${session.id} isn't one of this app's invoice payments; ignored.`)
    return
  }

  const result = await markInvoicePaidFromCheckout({
    accountId,
    invoiceId,
    sessionId: session.id,
    amountCents: session.amount_total,
    currency: session.currency,
  })

  if (result === "paid") return
  // The money was taken but the invoice can't take it (already paid, deleted,
  // or not this account's). The freelancer can refund from their Stripe dashboard.
  console.warn(`[stripe] Checkout session ${session.id} for invoice ${invoiceId} on ${accountId}: ${result}.`)
}
