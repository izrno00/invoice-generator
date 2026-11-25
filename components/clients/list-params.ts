import { CLIENT_LIMITS } from "@/lib/validation/client"

/** The longest searchable field is the email address. */
export const SEARCH_MAX_LENGTH = CLIENT_LIMITS.email

type SearchParams = Record<string, string | string[] | undefined>

/** `?q=` and `?page=` of the clients list. Anything unusable falls back. */
export function parseListParams({ q, page }: SearchParams) {
  const number = typeof page === "string" && /^\d{1,6}$/.test(page) ? Number(page) : 1
  return {
    q: typeof q === "string" ? q.trim().slice(0, SEARCH_MAX_LENGTH) : "",
    page: Math.max(1, number),
  }
}

export function clientsListHref({ q, page = 1 }: { q?: string; page?: number }) {
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (page > 1) params.set("page", String(page))

  const query = params.toString()
  return query ? `/clients?${query}` : "/clients"
}

/** The first, last and neighbouring pages; "gap" stands for the ones left out. */
export function pageItems(page: number, pageCount: number): (number | "gap")[] {
  const shown = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((number) => number >= 1 && number <= pageCount)
    .sort((a, b) => a - b)

  const items: (number | "gap")[] = []
  let previous = 0
  for (const number of shown) {
    // A gap of exactly one page shows that page instead of "…".
    if (number - previous === 2) items.push(number - 1)
    else if (number - previous > 2) items.push("gap")
    items.push(number)
    previous = number
  }
  return items
}
