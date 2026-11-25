import "server-only"

import Stripe from "stripe"

let client: Stripe | undefined

/** The platform's Stripe client (secret key, the SDK's pinned API version). */
export function stripe(): Stripe {
  if (client) return client
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not set")
  client = new Stripe(secretKey, { appInfo: { name: "Invoice Generator" } })
  return client
}

/** Absolute URL in this app, for email links and Stripe redirects. */
export function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL
  if (!base) throw new Error("NEXT_PUBLIC_APP_URL is not set")
  return new URL(path, base).toString()
}

/** Stripe's error type, for `instanceof` checks without importing the SDK elsewhere. */
export const StripeError = Stripe.errors.StripeError
