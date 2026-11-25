/**
 * SHA-256 of everything that appears on the PDF (Tech.md §8.2). Used to skip
 * regenerating an unchanged PDF and to decide whether to offer a resend.
 *
 * The invoice number is left out: the database assigns it on the first
 * insert (after the hash is computed) and it never changes afterwards, so it
 * can't make two versions of the same invoice differ.
 */

import { createHash } from "node:crypto"

import type { LineUnit } from "@/lib/invoices/calc"
import type { ClientSnapshot, SenderSnapshot } from "@/lib/invoices/snapshot"

export type InvoiceContent = {
  invoiceDate: string
  dueDate: string
  currency: string
  comments: string | null
  sender: SenderSnapshot
  client: ClientSnapshot
  lines: readonly {
    description: string
    unit: LineUnit
    quantity: number
    unitPriceCents: number
    vatRateBp: number
  }[]
}

/** Builds the object with a fixed key order, so equal content always hashes the same. */
function canonical(content: InvoiceContent) {
  const { sender, client } = content
  return {
    invoiceDate: content.invoiceDate,
    dueDate: content.dueDate,
    currency: content.currency,
    comments: content.comments ?? null,
    sender: [sender.fullName, sender.companyName, sender.email, sender.address, sender.vatId, sender.website],
    client: [client.fullName, client.companyName, client.email, client.address, client.vatId],
    // Totals are derived from the lines, so the lines cover them.
    lines: content.lines.map((line) => [
      line.description,
      line.unit,
      line.unit === "flat" ? 1 : line.quantity,
      line.unitPriceCents,
      line.vatRateBp,
    ]),
  }
}

export function contentHash(content: InvoiceContent): string {
  return createHash("sha256").update(JSON.stringify(canonical(content))).digest("hex")
}
