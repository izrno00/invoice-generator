import "server-only"

import type { ReactNode } from "react"
import { Resend, type Attachment } from "resend"

let resendClient: Resend | undefined

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set. Add it to .env.local.")
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

function getDefaultFrom(): string {
  const from = process.env.EMAIL_FROM
  if (!from) {
    throw new Error(
      'EMAIL_FROM is not set. Add it to .env.local, e.g. EMAIL_FROM="Invoice Generator <invoices@yourdomain.com>".'
    )
  }
  return from
}

export type SendEmailOptions = {
  to: string | string[]
  subject: string
  /** React Email template, e.g. <InvoiceEmail invoice={invoice} /> */
  react: ReactNode
  /** Overrides EMAIL_FROM for this email. */
  from?: string
  replyTo?: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  /** Files such as an invoice PDF: { filename: "invoice-001.pdf", content: pdfBuffer } */
  attachments?: Attachment[]
  /** Prevents duplicate sends when a request is retried. */
  idempotencyKey?: string
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

export async function sendEmail({
  idempotencyKey,
  from,
  ...options
}: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const { data, error } = await getResend().emails.send(
      { ...options, from: from ?? getDefaultFrom() },
      idempotencyKey ? { idempotencyKey } : undefined
    )

    if (error) {
      console.error("[email] Resend rejected the email:", error)
      return { ok: false, error: error.message }
    }

    return { ok: true, id: data.id }
  } catch (err) {
    console.error("[email] Failed to send email:", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error sending email",
    }
  }
}
