import "server-only"

import { cache } from "react"

import { requireUser } from "@/lib/dal/auth"
import { getProfile } from "@/lib/dal/profile"
import { getMyStripeAccount } from "@/lib/dal/stripe-accounts"
import { addDays, type PaidMonthRow, type SetupState, type SummaryRow } from "@/lib/dashboard/summary"
import type { InvoiceRow } from "@/lib/invoices/document"
import { snapshotDisplayName, clientFromRow } from "@/lib/invoices/snapshot"
import { isOverdue, todayUtc, type InvoiceStatus } from "@/lib/invoices/status"
import { createClient } from "@/lib/supabase/server"
import { isSenderComplete } from "@/lib/validation/profile"

/** Dashboard data (PRD §6.15, Tech.md §8.5). Pure logic lives in `lib/dashboard/summary.ts`. */

/** How far ahead "Due soon" looks, today included (PRD §6.15 AC5). */
export const DUE_SOON_DAYS = 7
const LIST_LIMIT = 5

const ROW_COLUMNS =
  "id, invoice_number, status, due_date, currency, total_cents, client_id, client_full_name, client_company_name, client_email, client_address, client_vat_id, client_display_name"

type DashboardRow = Pick<
  InvoiceRow,
  | "id"
  | "invoice_number"
  | "status"
  | "due_date"
  | "currency"
  | "total_cents"
  | "client_id"
  | "client_full_name"
  | "client_company_name"
  | "client_email"
  | "client_address"
  | "client_vat_id"
  | "client_display_name"
>

/** A row in Recent invoices or Due soon. */
export type DashboardInvoice = {
  id: string
  invoiceNumber: string
  status: InvoiceStatus
  dueDate: string
  currency: string
  totalCents: number
  /** Null for a draft without a client. */
  clientName: string | null
  overdue: boolean
}

function toDashboardInvoice(row: DashboardRow, today: string): DashboardInvoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    status: row.status,
    dueDate: row.due_date,
    currency: row.currency,
    totalCents: row.total_cents,
    // Same fallback as the invoice list: the live client name, else the saved snapshot.
    clientName: row.client_display_name ?? snapshotDisplayName(clientFromRow(row)),
    overdue: isOverdue({ status: row.status, dueDate: row.due_date }, today),
  }
}

/** Per currency: outstanding, overdue, paid this month. Deduped per request. */
export const getDashboardSummary = cache(async (): Promise<SummaryRow[]> => {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("dashboard_summary")
  if (error) throw new Error(`Couldn't load the dashboard totals: ${error.message}`)

  return data.map((row) => ({
    currency: row.currency,
    outstandingCount: row.outstanding_count,
    outstandingCents: row.outstanding_cents,
    overdueCount: row.overdue_count,
    overdueCents: row.overdue_cents,
    paidThisMonthCents: row.paid_this_month_cents,
  }))
})

/** Paid per currency and month for the last 12 months. Deduped per request. */
export const getPaidByMonth = cache(async (): Promise<PaidMonthRow[]> => {
  await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("dashboard_paid_by_month")
  if (error) throw new Error(`Couldn't load the paid history: ${error.message}`)

  return data.map((row) => ({
    currency: row.currency,
    month: row.month,
    paidCents: row.paid_cents,
    paidToDateCents: row.paid_to_date_cents,
  }))
})

/** The latest invoices in every currency, ordered like the invoice list. */
export async function getRecentInvoices(): Promise<DashboardInvoice[]> {
  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("invoices")
    .select(ROW_COLUMNS)
    .eq("user_id", user.id)
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT)

  if (error) throw new Error(`Couldn't load recent invoices: ${error.message}`)
  const today = todayUtc()
  return data.map((row) => toDashboardInvoice(row, today))
}

/** Not paid invoices due from today (UTC, like overdue) through the next 7 days, soonest first. */
export async function getDueSoon(): Promise<DashboardInvoice[]> {
  const user = await requireUser()
  const supabase = await createClient()
  const today = todayUtc()

  const { data, error } = await supabase
    .from("invoices")
    .select(ROW_COLUMNS)
    .eq("user_id", user.id)
    .eq("status", "unpaid")
    .gte("due_date", today)
    .lte("due_date", addDays(today, DUE_SOON_DAYS))
    .order("due_date", { ascending: true })
    .order("invoice_number", { ascending: true })
    .limit(LIST_LIMIT)

  if (error) throw new Error(`Couldn't load invoices due soon: ${error.message}`)
  return data.map((row) => toDashboardInvoice(row, today))
}

/** What the welcome checklist and the reminder banners need. Deduped per request. */
export const getSetupState = cache(async (): Promise<SetupState> => {
  const user = await requireUser()
  const supabase = await createClient()

  const [invoices, clients, profile, stripe] = await Promise.all([
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    getProfile(),
    getMyStripeAccount(),
  ])

  if (invoices.error) throw new Error(`Couldn't count invoices: ${invoices.error.message}`)
  if (clients.error) throw new Error(`Couldn't count clients: ${clients.error.message}`)

  return {
    profileComplete: isSenderComplete(profile),
    hasClient: (clients.count ?? 0) > 0,
    stripeConnected: stripe?.charges_enabled ?? false,
    hasInvoice: (invoices.count ?? 0) > 0,
  }
})
