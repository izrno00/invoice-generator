/**
 * Helpers for putting user-typed text into PostgREST filters (Tech.md §8.4).
 */

/**
 * Makes text match literally inside a `like` / `ilike` pattern. PostgREST
 * turns every `*` into `%` and offers no escape for it, so a typed `*`
 * becomes "any one character".
 */
export function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&").replace(/\*/g, "_")
}

/** Quotes a value in an `or()` filter string, so `,` `.` `(` `)` stay text. */
export function quoteFilterValue(value: string): string {
  return `"${value.replace(/[\\"]/g, "\\$&")}"`
}

/** An `or()` filter: any of the columns contains the term, ignoring case. */
export function containsAnyOf(columns: readonly string[], term: string): string {
  const pattern = quoteFilterValue(`%${escapeIlike(term)}%`)
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",")
}
