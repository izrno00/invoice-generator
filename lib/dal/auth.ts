import "server-only"

import { io } from "next/cache"
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
  // With partial prefetching, cookies() resolves while Next.js prerenders the
  // session's App Shell, and getClaims() then reads Date.now() to check the
  // token's expiry. io() keeps this read out of every prerender; during a
  // real request (and in Server Actions) it resolves immediately.
  await io()
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
