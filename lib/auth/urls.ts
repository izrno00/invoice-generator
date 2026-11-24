/** Route that verifies email links (sign-up confirmation, password reset). */
export const AUTH_CONFIRM_PATH = "/auth/confirm"

/**
 * Absolute URL that auth emails link back to. Built from the current origin so
 * one Supabase project works for localhost, preview and production deployments
 * (the email templates use {{ .RedirectTo }}). Browser only.
 */
export function authConfirmUrl(): string {
  return `${window.location.origin}${AUTH_CONFIRM_PATH}`
}

/** Seconds to wait between confirmation emails (matches Supabase's per-email limit). */
export const RESEND_COOLDOWN_SECONDS = 60
