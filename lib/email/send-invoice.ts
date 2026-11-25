import "server-only"

import { render, toPlainText } from "@react-email/render"
import { createElement } from "react"

import { InvoiceEmail } from "@/emails/invoice-email"
import { sendEmail, type SendEmailResult } from "@/lib/email/index"
import { invoiceFromHeader } from "@/lib/invoices/email-text"
import { formatDate, formatMoney, invoiceFileName } from "@/lib/invoices/format"

export type InvoiceEmailInput = {
  invoiceId: string
  /** Makes Resend drop repeats of the same attempt (double clicks, retries). */
  attemptId: string
  invoiceNumber: string
  to: string
  replyTo: string
  senderName: string
  subject: string
  message: string
  totalCents: number
  currency: string
  dueDate: string
  pdf: Buffer
  paymentUrl: string | null
}

/** Renders and sends one invoice email (Tech.md §10.1 step 6). */
export async function sendInvoiceEmail(email: InvoiceEmailInput): Promise<SendEmailResult> {
  const emailFrom = process.env.EMAIL_FROM
  if (!emailFrom) return { ok: false, error: "EMAIL_FROM is not set" }

  const element = createElement(InvoiceEmail, {
    message: email.message,
    invoiceNumber: email.invoiceNumber,
    total: formatMoney(email.totalCents, email.currency),
    dueDate: formatDate(email.dueDate),
    paymentUrl: email.paymentUrl,
  })

  let html: string
  try {
    html = await render(element)
  } catch (error) {
    console.error("[email] Couldn't render the invoice email:", error)
    return { ok: false, error: "Couldn't render the email" }
  }

  return sendEmail({
    from: invoiceFromHeader(email.senderName, emailFrom),
    to: email.to,
    replyTo: email.replyTo,
    subject: email.subject,
    html,
    text: toPlainText(html),
    attachments: [{ filename: invoiceFileName(email.invoiceNumber), content: email.pdf }],
    idempotencyKey: `invoice-send/${email.invoiceId}/${email.attemptId}`,
  })
}
