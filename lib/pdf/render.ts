import "server-only"

import { renderToBuffer } from "@react-pdf/renderer"

import { PDF_BUCKET, setPdfInfo, type InvoiceRecord } from "@/lib/dal/invoices"
import { toDocumentData, type InvoiceDocumentData } from "@/lib/invoices/document"
import { InvoiceDocument } from "@/lib/pdf/invoice-document"
import { createClient } from "@/lib/supabase/server"

export function renderInvoicePdf(data: InvoiceDocumentData): Promise<Buffer> {
  return renderToBuffer(InvoiceDocument({ data }))
}

/** `{user_id}/{invoice_id}.pdf` in the private bucket (DB.md §7). */
export function pdfPath(row: InvoiceRecord["row"]) {
  return `${row.user_id}/${row.id}.pdf`
}

/**
 * Makes sure the stored PDF matches the invoice, generating and uploading it
 * if it's missing or stale (PRD §6.6 AC2, §9). Returns the PDF when it had
 * to be generated, so callers that need the bytes skip a download.
 */
export async function ensureCurrentPdf(record: InvoiceRecord): Promise<{ path: string; buffer: Buffer | null }> {
  const { row, items } = record
  if (row.status === "draft") throw new Error("Drafts don't have a PDF")

  if (row.pdf_path && row.content_hash && row.pdf_content_hash === row.content_hash) {
    return { path: row.pdf_path, buffer: null }
  }

  const buffer = await renderInvoicePdf(toDocumentData(row, items))
  const path = pdfPath(row)
  const supabase = await createClient()

  // The user-session client: storage policies limit it to the user's own folder.
  const { error } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(path, buffer, { contentType: "application/pdf", upsert: true })
  if (error) throw new Error(`Couldn't upload the PDF: ${error.message}`)

  await setPdfInfo(row.id, { path, contentHash: row.content_hash ?? "" })
  return { path, buffer }
}

/** The current PDF's bytes, generating it first if needed. */
export async function getCurrentPdf(record: InvoiceRecord): Promise<Buffer> {
  const { path, buffer } = await ensureCurrentPdf(record)
  if (buffer) return buffer

  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(PDF_BUCKET).download(path)
  if (error) throw new Error(`Couldn't download the PDF: ${error.message}`)
  return Buffer.from(await data.arrayBuffer())
}
