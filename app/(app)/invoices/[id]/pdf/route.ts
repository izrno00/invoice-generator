import { getUser } from "@/lib/dal/auth"
import { getInvoiceRecord } from "@/lib/dal/invoices"
import { invoiceFileName } from "@/lib/invoices/format"
import { getCurrentPdf } from "@/lib/pdf/render"

/**
 * Download the invoice PDF (PRD §6.6 AC9, Tech.md §9). Private: RLS limits
 * it to the owner, and a missing or someone else's invoice is a plain 404.
 * A stale or missing PDF is generated first.
 */
export async function GET(request: Request, ctx: RouteContext<"/invoices/[id]/pdf">) {
  const user = await getUser()
  if (!user) {
    const login = new URL("/auth/login", request.url)
    login.searchParams.set("next", new URL(request.url).pathname)
    return Response.redirect(login, 303)
  }

  const { id } = await ctx.params
  const record = await getInvoiceRecord(id)
  if (!record || record.row.status === "draft") return new Response("Not found", { status: 404 })

  let pdf: Buffer
  try {
    pdf = await getCurrentPdf(record)
  } catch (error) {
    console.error("[pdf] Couldn't prepare the PDF for download:", error)
    return new Response("We couldn't generate the PDF. Please try again.", { status: 500 })
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceFileName(record.row.invoice_number)}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
