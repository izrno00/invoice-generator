"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { getPayInvoice, savePayCheckoutSession } from "@/lib/dal/pay"
import { getStripeAccountByUserId, syncStripeAccount } from "@/lib/dal/stripe-accounts"
import {
  createCheckoutSession,
  expireCheckoutSessions,
  isPaidSession,
  retrieveCheckoutSession,
} from "@/lib/stripe/checkout"

/** Why Pay now didn't open Stripe. The pay page switches to the matching state. */
export type StartCheckoutResult = { kind: "invalid" | "paid" | "unavailable" | "error" }

/**
 * Pay now (PRD §6.9, Tech.md §11.3). Public: anyone with the link can call it,
 * so everything is looked up again from the token. Charges the amount of the
 * last send with a link, not the current total.
 */
export async function startCheckout(token: unknown): Promise<StartCheckoutResult> {
  const parsed = z.string().max(200).safeParse(token)
  if (!parsed.success) return { kind: "invalid" }

  let checkoutUrl: string | null = null
  try {
    const invoice = await getPayInvoice(parsed.data)
    if (!invoice || invoice.status === "draft") return { kind: "invalid" }
    if (invoice.status === "paid") return { kind: "paid" }

    // Live check: the account may have been disconnected or restricted since the email went out.
    const stored = await getStripeAccountByUserId(invoice.user_id)
    const account = stored ? await syncStripeAccount(stored) : null
    if (!account?.chargesEnabled) return { kind: "unavailable" }

    const previousId = invoice.stripe_checkout_session_id
    const previous = previousId
      ? await retrieveCheckoutSession(account.accountId, previousId).catch((error) => {
          console.error("[stripe] Couldn't load the last checkout session:", error)
          return null
        })
      : null
    // Already paid: until the webhook marks the invoice Paid, this stops a second payment.
    if (previous && isPaidSession(previous)) return { kind: "paid" }

    // An unfinished checkout for the same amount is reused; any other one is cancelled (PRD §6.9 AC4, AC6).
    if (previous?.status === "open") {
      const sameAmount =
        previous.amount_total === invoice.payment_amount_cents &&
        previous.currency === invoice.payment_currency.toLowerCase()
      if (sameAmount && previous.url) checkoutUrl = previous.url
      else await expireCheckoutSessions(account.accountId, [previous.id])
    }

    if (!checkoutUrl) {
      const session = await createCheckoutSession({
        accountId: account.accountId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        token: parsed.data,
        amountCents: invoice.payment_amount_cents,
        currency: invoice.payment_currency,
        customerEmail: invoice.client_email,
        previousSessionId: previousId,
      })
      if (!session.url) throw new Error("Stripe returned a checkout session without a URL")
      await savePayCheckoutSession(invoice.id, session.id)
      checkoutUrl = session.url
    }
  } catch (error) {
    console.error("[stripe] Couldn't start the checkout:", error)
    return { kind: "error" }
  }

  redirect(checkoutUrl)
}
