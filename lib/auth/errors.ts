import { isAuthError, isAuthRetryableFetchError, isAuthSessionMissingError } from "@supabase/supabase-js"

export const GENERIC_AUTH_ERROR = "Something went wrong. Please try again."

/** The Supabase Auth error code, if any (e.g. "invalid_credentials"). */
export function authErrorCode(error: unknown): string | undefined {
  if (isAuthSessionMissingError(error)) return "session_not_found"
  if (isAuthError(error)) return error.code ?? undefined
  return undefined
}

export function isRateLimitError(error: unknown): boolean {
  const code = authErrorCode(error)
  return (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    (isAuthError(error) && error.status === 429)
  )
}

export function isSessionMissingError(error: unknown): boolean {
  const code = authErrorCode(error)
  return code === "session_not_found" || code === "session_expired"
}

/**
 * Maps a Supabase Auth error to a short, plain-English message.
 * Never shows Supabase's raw text, which can be technical or reveal
 * whether an account exists.
 */
export function authErrorMessage(error: unknown): string {
  if (isAuthRetryableFetchError(error)) {
    return "We couldn't reach the server. Check your connection and try again."
  }
  if (isRateLimitError(error)) {
    return "Too many attempts. Please wait a minute and try again."
  }

  switch (authErrorCode(error)) {
    case "invalid_credentials":
      return "Invalid email or password"
    case "email_not_confirmed":
      return "Please confirm your email address before logging in."
    case "weak_password":
      return "Please choose a stronger password (at least 8 characters)."
    case "same_password":
      return "Your new password must be different from your current one."
    case "email_address_invalid":
      return "Please enter a valid email address."
    case "session_not_found":
    case "session_expired":
      return "Your session has expired. Please start again."
    default:
      return GENERIC_AUTH_ERROR
  }
}
