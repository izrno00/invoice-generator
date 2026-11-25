import "server-only"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

/**
 * Supabase client with the secret key (Tech.md §6.1). It **bypasses RLS**, so
 * every query must filter explicitly. Only for the public pay page and its
 * checkout action, writes to `stripe_accounts`, and the Stripe webhook.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!secretKey) throw new Error("SUPABASE_SECRET_KEY is not set")

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
