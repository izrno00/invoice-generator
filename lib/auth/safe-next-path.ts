/**
 * Returns `path` only if it is a same-origin relative path (e.g. "/invoices?page=2"),
 * otherwise `fallback`. Blocks open redirects such as "//evil.com" or "https://evil.com".
 *
 * `origin` is required on the server; in the browser it defaults to the current origin.
 */
export function safeNextPath(path: unknown, fallback = "/dashboard", origin?: string): string {
  if (typeof path !== "string" || !path.startsWith("/")) return fallback

  const currentOrigin = origin ?? (typeof window !== "undefined" ? window.location.origin : undefined)
  if (!currentOrigin) return fallback

  try {
    const url = new URL(path, currentOrigin)
    return url.origin === currentOrigin ? `${url.pathname}${url.search}${url.hash}` : fallback
  } catch {
    return fallback
  }
}
