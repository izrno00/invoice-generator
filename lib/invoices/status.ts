/**
 * What an invoice is and what can be done with it (PRD §5.2, §6.7).
 */

export type InvoiceStatus = "draft" | "unpaid" | "paid"

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  unpaid: "Not paid",
  paid: "Paid",
}

/** The list's status filter (PRD §6.11 AC4). Overdue is Not paid and past due. */
export const STATUS_FILTERS = ["draft", "unpaid", "overdue", "paid"] as const
export type StatusFilter = (typeof STATUS_FILTERS)[number]

export const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  draft: "Draft",
  unpaid: "Not paid",
  overdue: "Overdue",
  paid: "Paid",
}

/** Today in UTC as a SQL date, matching `current_date` in the database (Tech.md §7). */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

/** Not a status: a badge on a Not paid invoice past its due date. */
export function isOverdue(invoice: { status: InvoiceStatus; dueDate: string }, today: string = todayUtc()): boolean {
  return invoice.status === "unpaid" && invoice.dueDate < today
}

export type ActionContext = {
  status: InvoiceStatus
  /** Sent at least once. */
  sent: boolean
  /** The email the invoice would go to (client snapshot). */
  clientEmail: string | null
  /** The profile has a name (or company) and an email. */
  senderComplete: boolean
  /** A draft passes full validation, so Send can finalize it. Ignored for other statuses. */
  draftComplete: boolean
}

export type SendAction =
  | { kind: "hidden" }
  /** Opens the send dialog. */
  | { kind: "dialog"; label: "Send" | "Resend" }
  /** A draft that isn't finished: Send opens the edit form with the errors shown. */
  | { kind: "finish"; label: "Send" }
  | { kind: "disabled"; label: "Send" | "Resend"; reason: string; profileLink: boolean }

export type InvoiceActions = {
  edit: boolean
  delete: boolean
  send: SendAction
  downloadPdf: boolean
  duplicate: boolean
  markPaid: boolean
}

export const NO_CLIENT_EMAIL = "This client has no email address"
export const PROFILE_INCOMPLETE = "Add your name or company name and an email in your profile to send invoices"

export function allowedActions(context: ActionContext): InvoiceActions {
  const { status } = context
  const editable = status !== "paid"

  return {
    edit: editable,
    delete: editable,
    send: sendAction(context),
    downloadPdf: status !== "draft",
    duplicate: true,
    markPaid: status === "unpaid",
  }
}

function sendAction({ status, sent, clientEmail, senderComplete, draftComplete }: ActionContext): SendAction {
  if (status === "paid") return { kind: "hidden" }

  const label = sent ? "Resend" : "Send"
  if (status === "draft" && !draftComplete) return { kind: "finish", label: "Send" }
  if (!clientEmail) return { kind: "disabled", label, reason: NO_CLIENT_EMAIL, profileLink: false }
  if (!senderComplete) return { kind: "disabled", label, reason: PROFILE_INCOMPLETE, profileLink: true }
  return { kind: "dialog", label }
}
