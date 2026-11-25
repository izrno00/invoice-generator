"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

import { requireUser } from "@/lib/dal/auth"
import { getProfile, updateProfile as saveProfile } from "@/lib/dal/profile"
import {
  getMyStripeAccount,
  insertStripeAccount,
  syncStripeAccount,
  type StripeAccountRow,
} from "@/lib/dal/stripe-accounts"
import { createConnectedAccount, createOnboardingLink, isAccountGone, listAccountCountries } from "@/lib/stripe/connect"
import { profileSchema, profileToFormValues, type ProfileFormValues } from "@/lib/validation/profile"

export type UpdateProfileResult =
  | { ok: true; values: ProfileFormValues }
  | {
      ok: false
      fieldErrors?: Partial<Record<keyof ProfileFormValues, string[]>>
      message?: string
    }

/** Settings → Profile save (PRD §6.2). Validates again on the server. */
export async function updateProfile(values: unknown): Promise<UpdateProfileResult> {
  await requireUser("/settings/profile")

  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  let saved
  try {
    saved = await saveProfile(parsed.data)
  } catch (error) {
    console.error(error)
    return { ok: false, message: "Couldn't save your profile. Please try again." }
  }

  revalidatePath("/settings/profile")
  // The dashboard banner depends on the profile.
  revalidatePath("/dashboard")
  return { ok: true, values: profileToFormValues(saved) }
}

export type ConnectStripeResult = { ok: false; message: string }

const STRIPE_UNAVAILABLE = "Couldn't open Stripe. Please try again."

const connectInput = z.object({
  /** Where the business is based (ISO alpha-2). Needed only to create the account. */
  country: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional(),
})

/**
 * Connect Stripe / Continue setup (PRD §6.3, Tech.md §11.2): creates the
 * connected account on first use (in the country the user picked), then
 * redirects to Stripe's onboarding.
 */
export async function connectStripe(input: unknown): Promise<ConnectStripeResult> {
  const user = await requireUser("/settings/payments")

  const parsed = connectInput.safeParse(input ?? {})
  if (!parsed.success) return { ok: false, message: "Choose the country where your business is based." }
  const { country } = parsed.data

  let onboardingUrl: string
  let account: StripeAccountRow | null = null
  try {
    account = await getMyStripeAccount()
    if (!account) {
      const supported = await listAccountCountries()
      if (!country || !supported.some((option) => option.code === country)) {
        return { ok: false, message: "Choose the country where your business is based." }
      }
      const profile = await getProfile()
      const accountId = await createConnectedAccount({
        userId: user.id,
        email: profile.email ?? user.email,
        country,
      })
      account = await insertStripeAccount(user.id, accountId)
    }
    onboardingUrl = await createOnboardingLink(account.stripe_account_id)
  } catch (error) {
    console.error(error)
    if (account && isAccountGone(error)) {
      // Disconnected in Stripe: forget it, so the next click starts over.
      await syncStripeAccount(account)
      revalidatePath("/settings/payments")
      return { ok: false, message: "Your Stripe account is no longer connected. Click Connect Stripe to start again." }
    }
    return { ok: false, message: STRIPE_UNAVAILABLE }
  }

  redirect(onboardingUrl)
}
