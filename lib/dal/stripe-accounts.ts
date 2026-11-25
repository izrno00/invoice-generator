import "server-only"

import { cache } from "react"

import { requireUser } from "@/lib/dal/auth"
import { expireCheckoutSessions } from "@/lib/stripe/checkout"
import { fetchAccountStatus } from "@/lib/stripe/connect"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

/**
 * The user's connected Stripe account (DB.md §3.2). Users can only read their
 * row; every write goes through the admin client, so nobody can point their
 * invoices at someone else's account.
 */

const COLUMNS = "user_id, stripe_account_id, charges_enabled, details_submitted"

export type StripeAccountRow = Pick<
  Database["public"]["Tables"]["stripe_accounts"]["Row"],
  "user_id" | "stripe_account_id" | "charges_enabled" | "details_submitted"
>

/** The account as Stripe reports it now (or as stored, when Stripe can't be reached). */
export type LiveStripeAccount = {
  accountId: string
  chargesEnabled: boolean
  detailsSubmitted: boolean
  displayName: string | null
}

/** The signed-in user's row, or null when they never connected Stripe. Deduped per request. */
export const getMyStripeAccount = cache(async (): Promise<StripeAccountRow | null> => {
  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase.from("stripe_accounts").select(COLUMNS).eq("user_id", user.id).maybeSingle()
  if (error) throw new Error(`Couldn't load the Stripe account: ${error.message}`)
  return data
})

/** Any user's row, for the public pay page (admin client). */
export async function getStripeAccountByUserId(userId: string): Promise<StripeAccountRow | null> {
  const { data, error } = await createAdminClient()
    .from("stripe_accounts")
    .select(COLUMNS)
    .eq("user_id", userId)
    .maybeSingle()
  if (error) throw new Error(`Couldn't load the Stripe account: ${error.message}`)
  return data
}

/** Saves a newly created account. If a row already exists (double click), that one wins and is returned. */
export async function insertStripeAccount(userId: string, accountId: string): Promise<StripeAccountRow> {
  const admin = createAdminClient()

  const { error } = await admin
    .from("stripe_accounts")
    .upsert({ user_id: userId, stripe_account_id: accountId }, { onConflict: "user_id", ignoreDuplicates: true })
  if (error) throw new Error(`Couldn't save the Stripe account: ${error.message}`)

  const { data, error: readError } = await admin.from("stripe_accounts").select(COLUMNS).eq("user_id", userId).single()
  if (readError) throw new Error(`Couldn't load the Stripe account: ${readError.message}`)
  return data
}

/**
 * Brings the stored flags in line with Stripe (the `account.updated` webhook
 * calls it too, on top of the live checks). Deletes the row when the
 * account was closed or disconnected (then returns null). If Stripe can't be
 * reached, the stored flags are used. Never throws.
 */
export async function syncStripeAccount(row: StripeAccountRow): Promise<LiveStripeAccount | null> {
  const stored: LiveStripeAccount = {
    accountId: row.stripe_account_id,
    chargesEnabled: row.charges_enabled,
    detailsSubmitted: row.details_submitted,
    displayName: null,
  }

  let status: Awaited<ReturnType<typeof fetchAccountStatus>>
  try {
    status = await fetchAccountStatus(row.stripe_account_id)
  } catch (error) {
    console.error("[stripe] Couldn't check the connected account:", error)
    return stored
  }

  try {
    const admin = createAdminClient()
    if (status === "revoked") {
      const { error } = await admin
        .from("stripe_accounts")
        .delete()
        .eq("user_id", row.user_id)
        .eq("stripe_account_id", row.stripe_account_id)
      if (error) console.error(`[stripe] Couldn't remove the disconnected account: ${error.message}`)
      return null
    }

    if (status.chargesEnabled !== row.charges_enabled || status.detailsSubmitted !== row.details_submitted) {
      const { error } = await admin
        .from("stripe_accounts")
        .update({ charges_enabled: status.chargesEnabled, details_submitted: status.detailsSubmitted })
        .eq("user_id", row.user_id)
        .eq("stripe_account_id", row.stripe_account_id)
      if (error) console.error(`[stripe] Couldn't update the account status: ${error.message}`)
    }
  } catch (error) {
    console.error("[stripe] Couldn't store the account status:", error)
  }

  if (status === "revoked") return null
  return { accountId: row.stripe_account_id, ...status }
}

/**
 * Expires the checkout sessions of invoices the user just deleted or marked
 * paid, so their payment pages stop accepting money (PRD §6.10, §6.14).
 * Best effort: never throws.
 */
export async function expireInvoiceCheckouts(sessionIds: readonly (string | null | undefined)[]): Promise<void> {
  const ids = sessionIds.filter((id): id is string => Boolean(id))
  if (ids.length === 0) return
  try {
    const account = await getMyStripeAccount()
    if (account) await expireCheckoutSessions(account.stripe_account_id, ids)
  } catch (error) {
    console.error("[stripe] Couldn't expire checkout sessions:", error)
  }
}
