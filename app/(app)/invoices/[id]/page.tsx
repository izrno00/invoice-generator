import { LockSimpleIcon, NotePencilIcon } from "@phosphor-icons/react/ssr"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { InvoiceDetailActions } from "@/components/invoices/invoice-actions"
import { InvoiceBreadcrumb } from "@/components/invoices/invoice-breadcrumb"
import { InvoicePreview } from "@/components/invoices/invoice-preview"
import { StatusBadge } from "@/components/invoices/status-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { getInvoice } from "@/lib/dal/invoices"
import { formatDate } from "@/lib/invoices/format"

export const metadata: Metadata = { title: "Invoice" }

/** Reads the session and the database, so it renders inside a Suspense boundary. */
async function InvoiceView({ params }: Pick<PageProps<"/invoices/[id]">, "params">) {
  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) notFound()

  return (
    <>
      <InvoiceBreadcrumb current={invoice.invoiceNumber} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
              Invoice {invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} overdue={invoice.overdue} />
          </div>
          <p className="text-sm text-muted-foreground">
            {invoice.lastSentAt ? `Sent on ${formatDate(invoice.lastSentAt)}` : "Not sent yet"}
          </p>
        </div>
        <InvoiceDetailActions invoice={invoice} />
      </div>

      {invoice.status === "draft" && (
        <Alert>
          <NotePencilIcon />
          <AlertTitle>This is a draft.</AlertTitle>
          <AlertDescription>Finish it to generate a PDF and send it.</AlertDescription>
        </Alert>
      )}
      {invoice.status === "paid" && (
        <Alert>
          <LockSimpleIcon />
          <AlertTitle>Paid: this invoice is locked.</AlertTitle>
          <AlertDescription>It can&apos;t be edited, deleted or sent again. You can still download the PDF.</AlertDescription>
        </Alert>
      )}

      <InvoicePreview data={invoice.document} />
    </>
  )
}

function InvoiceViewSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <Skeleton className="h-5 w-40" />
      <div className="flex justify-between gap-4">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-9 w-48 max-sm:hidden" />
      </div>
      <Skeleton className="h-[32rem] w-full" />
    </div>
  )
}

export default function InvoicePage({ params }: PageProps<"/invoices/[id]">) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 md:px-10 md:py-10">
      <Suspense fallback={<InvoiceViewSkeleton />}>
        <InvoiceView params={params} />
      </Suspense>
    </div>
  )
}
