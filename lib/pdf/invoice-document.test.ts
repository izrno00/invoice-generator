import { writeFile } from "node:fs/promises"

import { renderToBuffer } from "@react-pdf/renderer"
import { describe, expect, it } from "vitest"

import { calculateInvoice } from "@/lib/invoices/calc"
import type { InvoiceDocumentData } from "@/lib/invoices/document"
import { InvoiceDocument } from "@/lib/pdf/invoice-document"

function sample(lineCount: number): InvoiceDocumentData {
  const lines = Array.from({ length: lineCount }, (_, index) => ({
    description: `Čćđšž äöüß é: line ${index + 1}`,
    unit: index % 3 === 0 ? ("flat" as const) : ("hours" as const),
    quantity: index % 3 === 0 ? 1 : 8,
    unitPriceCents: 4550,
    vatRateBp: index % 2 === 0 ? 1700 : 0,
  }))
  const totals = calculateInvoice(lines)

  return {
    invoiceNumber: "2026-001",
    invoiceDate: "2026-11-24",
    dueDate: "2026-12-08",
    currency: "BAM",
    sender: {
      fullName: "Đorđe Kovačević",
      companyName: "Šarić Studio",
      email: "dorde@example.com",
      address: "Ulica Žrtava 12\n71000 Sarajevo",
      vatId: "BA123456789",
      website: "https://example.com",
    },
    client: { fullName: "Jürgen Müller", companyName: null, email: null, address: "Straße 5\nKöln", vatId: null },
    lines: totals.lines.map((line, index) => ({ ...line, description: lines[index].description })),
    vatBreakdown: totals.vatBreakdown,
    subtotalCents: totals.subtotalCents,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
    comments: "Hvala! Payment within 14 days.",
  }
}

async function render(data: InvoiceDocumentData) {
  const buffer = await renderToBuffer(InvoiceDocument({ data }))
  const text = buffer.toString("latin1")
  return { buffer, pages: text.match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0 }
}

describe("InvoiceDocument", () => {
  it("renders a one-page A4 PDF", async () => {
    const { buffer, pages } = await render(sample(3))
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-")
    expect(pages).toBe(1)
    expect(buffer.toString("latin1")).toMatch(/MediaBox \[0 0 595\.\d+ 841\.\d+\]/)
  })

  it("flows long invoices onto more pages", async () => {
    const { buffer, pages } = await render(sample(60))
    expect(pages).toBeGreaterThan(1)
    // Kept for a manual look at the layout: set PDF_SAMPLE_PATH to write the file.
    if (process.env.PDF_SAMPLE_PATH) await writeFile(process.env.PDF_SAMPLE_PATH, buffer)
  }, 20_000)
})
