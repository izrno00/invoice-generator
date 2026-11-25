import { useSyncExternalStore } from "react"

/**
 * Remembers the email just used to sign up, so the "Check your email" screen
 * can show it and resend the confirmation without putting it in the URL.
 * sessionStorage can be unavailable (private mode, blocked storage), so every
 * access is guarded and the screen works without it.
 */
const KEY = "payable:pending-signup-email"

export function rememberPendingSignup(email: string) {
  try {
    sessionStorage.setItem(KEY, email)
  } catch {
    // Storage unavailable: the screen falls back to asking for the email.
  }
}

function readPendingSignup(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

const subscribe = () => () => {}

/** The pending sign-up email, or null (also null during server render). */
export function usePendingSignupEmail(): string | null {
  return useSyncExternalStore(subscribe, readPendingSignup, () => null)
}
