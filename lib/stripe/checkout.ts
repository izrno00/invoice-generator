import "server-only"

import type Stripe from "stripe"

import { appUrl, stripe, StripeError } from "@/lib/stripe/index"

/**
 * Checkout Sessions on the freelancer's connected account (direct charges,
 * card only, no application fee; Tech.md §11.1, §11.3).
 */

/** Sessions last an hour: a new one is made on each Pay now anyway. Stripe's minimum is 30 minutes. */
const SESSION_LIFETIME_SECONDS = 60 * 60

export type CheckoutInput = {
  accountId: string
  invoiceId: string
  invoiceNumber: string
  token: string
  amountCents: number
  currency: string
  customerEmail: string | null
  /** The session this one replaces (or none). Part of the idempotency key. */
  previousSessionId: string | null
}

export async function createCheckoutSession(input: CheckoutInput): Promise<Stripe.Checkout.Session> {
  const metadata = { invoice_id: input.invoiceId }
  // Stripe rejects a reused idempotency key with different parameters, so the
  // expiry is derived from the current minute: two clicks in the same minute
  // send identical requests and get the same session.
  const minute = Math.floor(Date.now() / 60_000)
  const expiresAt = (minute + 1) * 60 + SESSION_LIFETIME_SECONDS
  return stripe().checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: input.amountCents,
            product_data: { name: `Invoice ${input.invoiceNumber}` },
          },
        },
      ],
      // Card only (PRD §6.3 AC4). This API version renamed `payment_method_types`.
      allowed_payment_method_types: ["card"],
      ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
      client_reference_id: input.invoiceId,
      metadata,
      payment_intent_data: { metadata },
      locale: "auto",
      expires_at: expiresAt,
      success_url: `${appUrl(`/pay/${input.token}/success`)}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl(`/pay/${input.token}`)}?cancelled=1`,
    },
    {
      stripeAccount: input.accountId,
      idempotencyKey: `checkout/${input.invoiceId}/${input.currency}/${input.amountCents}/${input.previousSessionId ?? "none"}/${minute}`,
    }
  )
}

export async function retrieveCheckoutSession(accountId: string, sessionId: string): Promise<Stripe.Checkout.Session> {
  return stripe().checkout.sessions.retrieve(sessionId, {}, { stripeAccount: accountId })
}

/** The session is finished and the money was taken. */
export function isPaidSession(session: Stripe.Checkout.Session): boolean {
  return session.status === "complete" && session.payment_status === "paid"
}

/**
 * Expires unfinished sessions so their pages stop accepting payments. Best
 * effort (never throws): a session that's already expired or complete is
 * skipped, and other failures are only logged, so the app action goes ahead.
 */
export async function expireCheckoutSessions(accountId: string, sessionIds: readonly string[]): Promise<void> {
  await Promise.all(
    sessionIds.map(async (sessionId) => {
      try {
        await stripe().checkout.sessions.expire(sessionId, {}, { stripeAccount: accountId })
      } catch (error) {
        // 400: the session isn't open any more (expired or paid). Nothing to do.
        if (error instanceof StripeError && error.statusCode === 400) return
        console.error(`[stripe] Couldn't expire checkout session ${sessionId}:`, error)
      }
    })
  )
}
