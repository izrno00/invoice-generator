/**
 * Texts of the invoice email (PRD §6.7). Shared by the send dialog (what the
 * user sees and edits) and the Server Action (what gets sent).
 */

import { formatDate, formatMoney } from "@/lib/invoices/format"

/** "Invoice 2026-001 from Acme Studio" */
export function invoiceSubject(invoiceNumber: string, sender: string): string {
  return `Invoice ${invoiceNumber} from ${sender}`
}

/**
 * The pre-filled, editable message. `updated` is set when resending an
 * invoice whose PDF changed since it was last sent.
 */
export function defaultSendMessage({
  greeting,
  invoiceNumber,
  totalCents,
  currency,
  dueDate,
  updated = false,
}: {
  greeting: string | null
  invoiceNumber: string
  totalCents: number
  currency: string
  dueDate: string
  updated?: boolean
}): string {
  const hi = greeting ? `Hi ${greeting},` : "Hi,"
  const what = updated ? `the updated invoice ${invoiceNumber}` : `invoice ${invoiceNumber}`
  return `${hi} please find attached ${what} for ${formatMoney(totalCents, currency)}, due on ${formatDate(dueDate)}. Thank you!`
}

/** The address part of EMAIL_FROM: `Name <a@b.com>` or `a@b.com`. */
export function emailAddressOf(from: string): string {
  const match = /<([^<>]+)>\s*$/.exec(from)
  return (match ? match[1] : from).trim()
}

/**
 * `"Acme Studio via Invoice Generator" <invoices@example.com>`. Characters
 * that would break the header are removed from the user's name.
 */
export function invoiceFromHeader(sender: string, emailFrom: string): string {
  const name = sender.replace(/["<>\\\r\n]/g, "").replace(/\s+/g, " ").trim()
  return `"${name} via Invoice Generator" <${emailAddressOf(emailFrom)}>`
}
