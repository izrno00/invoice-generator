import { CreditCardIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { getMyStripeAccount } from "@/lib/dal/stripe-accounts"

/** Nudges users to connect Stripe until it can take payments (PRD §6.15 AC8). Not dismissible. */
export async function StripeBanner() {
  const account = await getMyStripeAccount()
  if (account?.charges_enabled) return null

  return (
    <Alert>
      <CreditCardIcon />
      <AlertTitle>Connect Stripe to get paid online</AlertTitle>
      <AlertDescription>Clients can then pay by card straight from the invoice email.</AlertDescription>
      <div className="col-start-2 mt-2">
        <Link href="/settings/payments" className={buttonVariants({ size: "sm", variant: "outline" })}>
          {account ? "Finish connecting Stripe" : "Connect Stripe"}
        </Link>
      </div>
    </Alert>
  )
}
