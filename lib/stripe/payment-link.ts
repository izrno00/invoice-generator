/**
 * Whether an invoice email gets a payment link (PRD §6.3 AC5, §6.7 AC5–6).
 * Pure (no Node APIs), so the send dialog and the send action share it.
 */

import { formatMoney } from "@/lib/invoices/format"
import type { Database } from "@/lib/supabase/database.types"

type Currency = Database["public"]["Enums"]["currency_code"]

/**
 * The smallest amount we let Stripe charge, per currency. Stripe's own minimum
 * depends on the connected account's settlement currency (EUR 0.50, USD 0.50,
 * GBP 0.30 …, converted when they differ), so these clear it for EUR, USD and
 * GBP accounts alike: e.g. GBP 0.30 would fail on a Croatian (EUR) account.
 * BAM is pegged to the euro (EUR 0.50 ≈ BAM 0.98).
 */
export const STRIPE_MINIMUM_CENTS: Record<Currency, number> = {
  EUR: 50,
  USD: 75,
  GBP: 50,
  BAM: 100,
}

export type PaymentLinkStatus = "included" | "not_connected" | "below_minimum"

export function paymentLinkStatus({
  connected,
  totalCents,
  currency,
}: {
  /** The user's Stripe account can accept payments (`charges_enabled`). */
  connected: boolean
  totalCents: number
  currency: Currency
}): PaymentLinkStatus {
  if (!connected) return "not_connected"
  if (totalCents < STRIPE_MINIMUM_CENTS[currency]) return "below_minimum"
  return "included"
}

export const PAYMENT_LINK_INCLUDED = "A secure payment link will be included."
export const NO_PAYMENT_LINK = "No payment link will be included."
export const CONNECT_STRIPE_HINT = "Connect Stripe to let clients pay online."

/** The send dialog's note (PRD §6.7). For `not_connected`, "Connect Stripe" links to Payments settings. */
export function paymentLinkNote(status: PaymentLinkStatus, currency: Currency): string {
  switch (status) {
    case "included":
      return PAYMENT_LINK_INCLUDED
    case "not_connected":
      return `${NO_PAYMENT_LINK} ${CONNECT_STRIPE_HINT}`
    case "below_minimum":
      return `No payment link will be included: online payments need at least ${formatMoney(STRIPE_MINIMUM_CENTS[currency], currency)}.`
  }
}

/** Shape check for tokens from the URL, before any database lookup. */
export function isPaymentTokenShape(token: string): boolean {
  return /^[A-Za-z0-9_-]{32,128}$/.test(token)
}
