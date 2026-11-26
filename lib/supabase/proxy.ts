import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "@/lib/supabase/database.types"

/** Routes reachable without a session (Tech.md §3). */
const PUBLIC_PREFIXES = ["/auth", "/pay"]
const PUBLIC_EXACT = ["/", "/privacy", "/terms", "/api/stripe/webhook"]

/** Auth screens a signed-in user is sent away from (PRD §6.1 AC9). */
const SIGNED_IN_REDIRECTS = ["/auth/login", "/auth/sign-up"]

function isPublicPath(pathname: string) {
  return (
    PUBLIC_EXACT.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  )
}

/**
 * Refreshes the Supabase session cookie and does optimistic redirects.
 * This is UX only, not the security boundary: pages and actions still
 * check the session through lib/dal/auth.ts, and RLS checks every query.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Create a new client per request (never a global).
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Don't run code between createServerClient and getClaims(): getClaims()
  // refreshes the session, and skipping it can randomly log users out.
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)

  const { pathname, search } = request.nextUrl

  if (!signedIn && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.search = ""
    url.searchParams.set("next", `${pathname}${search}`)
    return redirectWithCookies(url, supabaseResponse)
  }

  if (signedIn && SIGNED_IN_REDIRECTS.includes(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return redirectWithCookies(url, supabaseResponse)
  }

  // Return supabaseResponse as is, so refreshed cookies reach the browser.
  return supabaseResponse
}

/** A redirect that keeps any session cookies refreshed above. */
function redirectWithCookies(url: URL, supabaseResponse: NextResponse) {
  const response = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
  return response
}
