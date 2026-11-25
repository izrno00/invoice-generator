import { STATUS_FILTERS, type StatusFilter } from "@/lib/invoices/status"

/** Invoice numbers and client names are short; this is plenty. */
export const SEARCH_MAX_LENGTH = 200

type SearchParams = Record<string, string | string[] | undefined>

export type InvoiceListParams = {
  q: string
  status: StatusFilter | null
  client: string | null
  from: string | null
  to: string | null
  page: number
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE = /^\d{4}-\d{2}-\d{2}$/

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}

function isDate(value: string | undefined): value is string {
  return value !== undefined && DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
}

/** The list's filters from the URL (PRD §6.11 AC6). Anything unusable is ignored. */
export function parseInvoiceListParams(params: SearchParams): InvoiceListParams {
  const q = one(params.q)
  const status = one(params.status)
  const client = one(params.client)
  const from = one(params.from)
  const to = one(params.to)
  const page = one(params.page)
  const number = page && /^\d{1,6}$/.test(page) ? Number(page) : 1

  return {
    q: q ? q.trim().slice(0, SEARCH_MAX_LENGTH) : "",
    status: STATUS_FILTERS.includes(status as StatusFilter) ? (status as StatusFilter) : null,
    client: client && UUID.test(client) ? client.toLowerCase() : null,
    from: isDate(from) ? from : null,
    to: isDate(to) ? to : null,
    page: Math.max(1, number),
  }
}

export function hasFilters(params: Omit<InvoiceListParams, "page">) {
  return Boolean(params.q || params.status || params.client || params.from || params.to)
}

/** A list URL. Leaving out `page` means page 1 (changing a filter resets it). */
export function invoicesListHref(params: Partial<InvoiceListParams>, base = "/invoices") {
  const search = new URLSearchParams()
  if (params.q) search.set("q", params.q)
  if (params.status) search.set("status", params.status)
  if (params.client) search.set("client", params.client)
  if (params.from) search.set("from", params.from)
  if (params.to) search.set("to", params.to)
  if (params.page && params.page > 1) search.set("page", String(params.page))

  const query = search.toString()
  return query ? `${base}?${query}` : base
}

/** "Showing 1–20 of 57" (PRD §6.11 AC2). */
export function showingLabel(page: number, pageSize: number, total: number) {
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)
  return `Showing ${first}–${last} of ${total}`
}
