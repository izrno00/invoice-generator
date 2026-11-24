import "server-only"

import { redirect } from "next/navigation"
import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

export type SessionUser = {
  id: string
  email: string | null
}

/**
 * The signed-in user, or null. Verifies the JWT with getClaims()
 * (never trust getSession() for authorization). Deduped per request.
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) return null

  const { sub, email } = data.claims
  return { id: sub, email: typeof email === "string" ? email : null }
})

/**
 * The signed-in user, or a redirect to login. `next` is where to return
 * after logging in (proxy.ts normally sets it before we get here).
 */
export const requireUser = cache(async (next?: string): Promise<SessionUser> => {
  const user = await getUser()
  if (!user) {
    redirect(next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login")
  }
  return user
})
