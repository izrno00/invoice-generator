import { unstable_rethrow } from "next/navigation"

/**
 * True when a Server Action rejected because it redirected (e.g. to login
 * after the session expired). The router is already navigating, so there's
 * nothing to report to the user.
 */
export function isNavigationError(error: unknown): boolean {
  try {
    unstable_rethrow(error)
    return false
  } catch {
    return true
  }
}
