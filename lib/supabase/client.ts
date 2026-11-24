import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "@/lib/supabase/database.types"

/**
 * Browser Supabase client. Used only by the auth forms (Tech.md §2).
 * All app data goes through Server Components and Server Actions.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
