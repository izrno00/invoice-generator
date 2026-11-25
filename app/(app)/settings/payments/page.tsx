import type { Metadata } from "next"
import { Suspense } from "react"

import { PaymentsPanel, PaymentsPanelSkeleton, type PaymentsState } from "@/components/settings/payments-panel"
import { getMyStripeAccount, syncStripeAccount } from "@/lib/dal/stripe-accounts"
import { listAccountCountries, type AccountCountry } from "@/lib/stripe/connect"

export const metadata: Metadata = { title: "Payments" }

/** For the Connect dialog. Empty when Stripe can't be reached; the dialog then asks to reload. */
async function accountCountries(): Promise<AccountCountry[]> {
  try {
    return await listAccountCountries()
  } catch (error) {
    console.error("[stripe] Couldn't load the supported countries:", error)
    return []
  }
}

/**
 * Reads the session and checks the account with Stripe (the only sync until
 * the webhook exists), so it renders inside a Suspense boundary.
 */
async function PaymentsSection({ searchParams }: Pick<PageProps<"/settings/payments">, "searchParams">) {
  const { stripe: from } = await searchParams
  const row = await getMyStripeAccount()
  const account = row ? await syncStripeAccount(row) : null

  let state: PaymentsState
  if (!account) state = { kind: "not_connected", countries: await accountCountries() }
  else if (account.chargesEnabled) state = { kind: "connected", displayName: account.displayName }
  else state = { kind: "incomplete", reviewing: account.detailsSubmitted }

  const returned = from === "return" ? "return" : from === "error" ? "error" : null
  return <PaymentsPanel state={state} returned={returned} />
}

export default function PaymentsPage({ searchParams }: PageProps<"/settings/payments">) {
  return (
    <section aria-labelledby="payments-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="payments-heading" className="font-heading text-lg font-semibold tracking-tight">
          Payments
        </h2>
        <p className="text-sm text-muted-foreground">
          Connect your own Stripe account so clients can pay your invoices by card.
        </p>
      </div>
      <Suspense fallback={<PaymentsPanelSkeleton />}>
        <PaymentsSection searchParams={searchParams} />
      </Suspense>
    </section>
  )
}
