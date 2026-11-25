import "server-only"

import type Stripe from "stripe"

import { appUrl, stripe, StripeError } from "@/lib/stripe/index"

/**
 * Connected accounts (Tech.md §11.1–11.2), created with the Accounts v2 API as
 * Stripe recommends for new platforms: the freelancer gets the full Stripe
 * Dashboard, pays Stripe's fees and owns disputes. v2 needs the country before
 * the merchant configuration, so the user picks it in the app; Stripe-hosted
 * onboarding collects every other detail.
 */

export type AccountStatus = {
  chargesEnabled: boolean
  detailsSubmitted: boolean
  /** Business or contact name, shown on Settings → Payments. */
  displayName: string | null
}

export type AccountCountry = { code: string; name: string }

const ACCOUNT_INCLUDE: Stripe.V2.Core.AccountRetrieveParams.Include[] = ["configuration.merchant", "requirements"]

const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" })
const COUNTRIES_TTL_MS = 12 * 60 * 60 * 1000
let countriesCache: { at: number; countries: AccountCountry[] } | null = null

/** Countries Stripe can open accounts in (Country Specs), by English name. Cached in memory for 12 hours. */
export async function listAccountCountries(): Promise<AccountCountry[]> {
  if (countriesCache && Date.now() - countriesCache.at < COUNTRIES_TTL_MS) return countriesCache.countries

  const countries: AccountCountry[] = []
  for await (const spec of stripe().countrySpecs.list({ limit: 100 })) {
    const code = spec.id.toUpperCase()
    countries.push({ code, name: COUNTRY_NAMES.of(code) ?? code })
  }
  countries.sort((a, b) => a.name.localeCompare(b.name, "en"))
  countriesCache = { at: Date.now(), countries }
  return countries
}

/**
 * A new connected account in `country` (ISO 3166-1 alpha-2), with card
 * payments requested. The idempotency key turns double clicks (same minute)
 * into one account, while a user who reconnects later, after a disconnect,
 * still gets a fresh one.
 */
export async function createConnectedAccount({
  userId,
  email,
  country,
}: {
  userId: string
  email: string | null
  country: string
}) {
  const minute = Math.floor(Date.now() / 60_000)
  const account = await stripe().v2.core.accounts.create(
    {
      ...(email ? { contact_email: email } : {}),
      dashboard: "full",
      identity: { country: country.toLowerCase() },
      configuration: { merchant: { capabilities: { card_payments: { requested: true } } } },
      defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe" } },
      metadata: { user_id: userId },
      include: ACCOUNT_INCLUDE,
    },
    { idempotencyKey: `connect-account/${userId}/${country}/${minute}` }
  )
  return account.id
}

/** A single-use link to Stripe's onboarding. It expires quickly, so the refresh URL makes a new one. */
export async function createOnboardingLink(accountId: string): Promise<string> {
  const link = await stripe().v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        refresh_url: appUrl("/settings/payments/refresh"),
        return_url: appUrl("/settings/payments?stripe=return"),
      },
    },
  })
  return link.url
}

/** True when Stripe says the account is gone or no longer connected to this platform. */
export function isAccountGone(error: unknown): boolean {
  if (!(error instanceof StripeError)) return false
  return (
    error.statusCode === 404 ||
    error.type === "StripePermissionError" ||
    error.code === "account_invalid" ||
    error.code === "resource_missing"
  )
}

/** The account's current status, or "revoked" when it's closed or disconnected. Other errors throw. */
export async function fetchAccountStatus(accountId: string): Promise<AccountStatus | "revoked"> {
  let account: Stripe.V2.Core.Account
  try {
    account = await stripe().v2.core.accounts.retrieve(accountId, { include: ACCOUNT_INCLUDE })
  } catch (error) {
    if (isAccountGone(error)) return "revoked"
    throw error
  }
  if (account.closed) return "revoked"

  const cardPayments = account.configuration?.merchant?.capabilities?.card_payments
  // "Submitted" = nothing is waiting on the user right now; Stripe may still be reviewing.
  const userDue = (account.requirements?.entries ?? []).some(
    (entry) => entry.awaiting_action_from === "user" && entry.minimum_deadline.status !== "eventually_due"
  )

  return {
    chargesEnabled: cardPayments?.status === "active",
    detailsSubmitted: !userDue,
    displayName: account.display_name?.trim() || account.contact_email?.trim() || null,
  }
}
