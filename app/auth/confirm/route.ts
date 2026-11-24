import type { EmailOtpType } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"

import { safeNextPath } from "@/lib/auth/safe-next-path"
import { createClient } from "@/lib/supabase/server"

/** Link types our email templates send. Everything else is rejected. */
const ALLOWED_TYPES: EmailOtpType[] = ["email", "signup", "recovery"]

/**
 * Target of the confirmation and password-reset emails:
 * /auth/confirm?token_hash=…&type=email|recovery
 * Verifies the token, which signs the user in (sets the session cookie).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const typeParam = searchParams.get("type")
  const type = ALLOWED_TYPES.find((t) => t === typeParam)

  // Error page gets codes only, never raw Supabase messages.
  const errorPath = (reason: "link_incomplete" | "link_invalid") =>
    `/auth/error?${new URLSearchParams({ reason, ...(type ? { type } : {}) })}`

  if (!tokenHash || !type) {
    redirect(errorPath("link_incomplete"))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  if (error) {
    redirect(errorPath("link_invalid"))
  }

  if (type === "recovery") {
    // PRD §6.1 AC6: reset links open "Set new password".
    redirect("/auth/update-password")
  }

  // PRD §6.1 AC3: confirmation logs the user in and opens the Dashboard.
  redirect(safeNextPath(searchParams.get("next"), "/dashboard", origin))
}
