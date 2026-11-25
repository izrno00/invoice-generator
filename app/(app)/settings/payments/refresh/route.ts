import { redirect } from "next/navigation"

import { requireUser } from "@/lib/dal/auth"
import { getMyStripeAccount } from "@/lib/dal/stripe-accounts"
import { createOnboardingLink } from "@/lib/stripe/connect"

/**
 * Stripe sends the user here when an onboarding link expired or was already
 * used (Tech.md §11.2). Makes a fresh link for the signed-in user's account.
 */
export async function GET() {
  await requireUser("/settings/payments")

  const account = await getMyStripeAccount()
  if (!account) redirect("/settings/payments")

  let onboardingUrl: string
  try {
    onboardingUrl = await createOnboardingLink(account.stripe_account_id)
  } catch (error) {
    console.error(error)
    redirect("/settings/payments?stripe=error")
  }

  redirect(onboardingUrl)
}
