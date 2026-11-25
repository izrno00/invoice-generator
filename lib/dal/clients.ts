import "server-only"

import { cache } from "react"
import { z } from "zod"

import { requireUser } from "@/lib/dal/auth"
import type { Database } from "@/lib/supabase/database.types"
import { containsAnyOf, escapeIlike, quoteFilterValue } from "@/lib/supabase/filters"
import { createClient } from "@/lib/supabase/server"
import { matchClientDetails, UNNAMED_CLIENT, type Client, type DuplicateMatch } from "@/lib/validation/client"

export const CLIENTS_PAGE_SIZE = 20

/** The Data API returns at most this many rows per request. */
const MAX_ROWS = 1000
const MAX_DUPLICATES = 5

const OPTION_COLUMNS = "id, display_name, full_name, company_name, email"
const SEARCH_COLUMNS = ["full_name", "company_name", "email"] as const

type ClientRow = Database["public"]["Tables"]["clients"]["Row"]

export type ClientListRow = {
  id: string
  displayName: string
  email: string | null
  invoiceCount: number
}

export type ClientList = {
  rows: ClientListRow[]
  total: number
  page: number
  pageCount: number
}

export type ClientDetails = Client & { id: string; displayName: string; invoiceCount: number }

/** What the client picker needs: a label, plus the fields it searches. */
export type ClientOption = {
  id: string
  displayName: string
  fullName: string | null
  companyName: string | null
  email: string | null
}

export type DuplicateClient = {
  id: string
  displayName: string
  matchedOn: DuplicateMatch[]
}

export type ClientDeleteSummary = {
  displayName: string
  /** Draft and Not paid invoices. */
  unpaidCount: number
  /** Of those, the ones already sent. */
  sentUnpaidCount: number
}

function isClientId(id: string) {
  return z.uuid().safeParse(id).success
}

function toOption(
  row: Pick<ClientRow, "id" | "display_name" | "full_name" | "company_name" | "email">
): ClientOption {
  return {
    id: row.id,
    displayName: row.display_name ?? UNNAMED_CLIENT,
    fullName: row.full_name,
    companyName: row.company_name,
    email: row.email,
  }
}

function toRow(client: Client) {
  return {
    full_name: client.fullName,
    company_name: client.companyName,
    email: client.email,
    address: client.address,
    vat_id: client.vatId,
  }
}

/** One page of the user's clients, A→Z by display name (PRD §6.4 AC1). */
export async function listClients({ q, page }: { q: string; page: number }): Promise<ClientList> {
  const user = await requireUser()
  const supabase = await createClient()
  const search = q ? containsAnyOf(SEARCH_COLUMNS, q) : null

  let query = supabase
    .from("clients")
    .select("id, display_name, email, invoices(count)", { count: "exact" })
    .eq("user_id", user.id)
  if (search) query = query.or(search)

  const from = (page - 1) * CLIENTS_PAGE_SIZE
  const { data, error, count } = await query
    .order("display_name", { nullsFirst: false })
    .order("created_at")
    .order("id")
    .range(from, from + CLIENTS_PAGE_SIZE - 1)

  let total = count ?? 0

  if (error) {
    // PGRST103: the page starts past the last row. The total is still needed.
    if (error.code !== "PGRST103") throw new Error(`Couldn't load clients: ${error.message}`)

    let counting = supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", user.id)
    if (search) counting = counting.or(search)

    const result = await counting
    if (result.error) throw new Error(`Couldn't count clients: ${result.error.message}`)
    total = result.count ?? 0
  }

  return {
    rows: (data ?? []).map((row) => ({
      id: row.id,
      displayName: row.display_name ?? UNNAMED_CLIENT,
      email: row.email,
      invoiceCount: row.invoices[0]?.count ?? 0,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / CLIENTS_PAGE_SIZE)),
  }
}

/** One client, or null if it doesn't exist or belongs to someone else. */
export const getClient = cache(async (id: string): Promise<ClientDetails | null> => {
  await requireUser()
  if (!isClientId(id)) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .select("id, display_name, full_name, company_name, email, address, vat_id, invoices(count)")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(`Couldn't load client: ${error.message}`)
  if (!data) return null

  return {
    id: data.id,
    displayName: data.display_name ?? UNNAMED_CLIENT,
    fullName: data.full_name,
    companyName: data.company_name,
    email: data.email,
    address: data.address,
    vatId: data.vat_id,
    invoiceCount: data.invoices[0]?.count ?? 0,
  }
})

/** Every client, for the client picker on the invoice form. */
export const listClientOptions = cache(async (): Promise<ClientOption[]> => {
  const user = await requireUser()
  const supabase = await createClient()
  const options: ClientOption[] = []

  for (let from = 0; ; from += MAX_ROWS) {
    const { data, error } = await supabase
      .from("clients")
      .select(OPTION_COLUMNS)
      .eq("user_id", user.id)
      .order("display_name", { nullsFirst: false })
      .order("created_at")
      .order("id")
      .range(from, from + MAX_ROWS - 1)

    if (error) throw new Error(`Couldn't load clients: ${error.message}`)
    options.push(...data.map(toOption))
    if (data.length < MAX_ROWS) return options
  }
})

/** Saves already-validated values (see `clientSchema`). */
export async function insertClient(client: Client): Promise<ClientOption> {
  await requireUser()
  const supabase = await createClient()

  // `user_id` defaults to the signed-in user.
  const { data, error } = await supabase.from("clients").insert(toRow(client)).select(OPTION_COLUMNS).single()

  if (error) throw new Error(`Couldn't create client: ${error.message}`)
  return toOption(data)
}

/** Null if the client doesn't exist or belongs to someone else (RLS). */
export async function updateClient(id: string, client: Client): Promise<ClientOption | null> {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("clients")
    .update(toRow(client))
    .eq("id", id)
    .select(OPTION_COLUMNS)
    .maybeSingle()

  if (error) throw new Error(`Couldn't update client: ${error.message}`)
  return data && toOption(data)
}

/** Existing clients with the same email, company name or full name. */
export async function findDuplicateClients(client: Client, excludeId?: string): Promise<DuplicateClient[]> {
  const user = await requireUser()

  const filters: string[] = []
  if (client.email) filters.push(`email.eq.${quoteFilterValue(client.email)}`)
  // `ilike` without wildcards: a case-insensitive "equals".
  if (client.companyName) {
    filters.push(`company_name.ilike.${quoteFilterValue(escapeIlike(client.companyName))}`)
  }
  if (client.fullName) filters.push(`full_name.ilike.${quoteFilterValue(escapeIlike(client.fullName))}`)
  if (filters.length === 0) return []

  const supabase = await createClient()
  let query = supabase.from("clients").select(OPTION_COLUMNS).eq("user_id", user.id).or(filters.join(","))
  if (excludeId) query = query.neq("id", excludeId)

  const { data, error } = await query.order("display_name", { nullsFirst: false }).limit(50)
  if (error) throw new Error(`Couldn't check for similar clients: ${error.message}`)

  return data
    .map(toOption)
    .map((other) => ({
      id: other.id,
      displayName: other.displayName,
      matchedOn: matchClientDetails(client, other),
    }))
    .filter((match) => match.matchedOn.length > 0)
    .slice(0, MAX_DUPLICATES)
}

/** What the delete dialog needs to know. Null if there's no such client. */
export async function getClientDeleteSummary(id: string): Promise<ClientDeleteSummary | null> {
  const client = await getClient(id)
  if (!client) return null

  const supabase = await createClient()
  const unpaidInvoices = () =>
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("client_id", id)
      .in("status", ["draft", "unpaid"])

  const [unpaid, sent] = await Promise.all([
    unpaidInvoices(),
    unpaidInvoices().not("first_sent_at", "is", null),
  ])

  const error = unpaid.error ?? sent.error
  if (error) throw new Error(`Couldn't count the client's invoices: ${error.message}`)

  return {
    displayName: client.displayName,
    unpaidCount: unpaid.count ?? 0,
    sentUnpaidCount: sent.count ?? 0,
  }
}

/**
 * Deletes a client and, if asked, its Draft and Not paid invoices, in one
 * transaction. Paid invoices are always kept. False if there's no such client.
 */
export async function deleteClient(id: string, deleteUnpaid: boolean): Promise<boolean> {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("delete_client", {
    p_client_id: id,
    p_delete_unpaid: deleteUnpaid,
  })

  if (error?.code === "P0002") return false
  if (error) throw new Error(`Couldn't delete client: ${error.message}`)

  // The rows are gone, so cleaning up their files is best effort.
  const pdfPaths = data.map((invoice) => invoice.pdf_path).filter(Boolean)
  if (pdfPaths.length > 0) {
    const { error: storageError } = await supabase.storage.from("invoice-pdfs").remove(pdfPaths)
    if (storageError) console.error(`Couldn't delete invoice PDFs: ${storageError.message}`)
  }

  // TODO (Milestone 7, Stripe): expire the returned `stripe_checkout_session_id`s
  // on the user's connected account.

  return true
}
