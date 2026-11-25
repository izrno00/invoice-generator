import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Suspense } from "react"

import { ClientBreadcrumb } from "@/components/clients/client-breadcrumb"
import { ClientDetailActions } from "@/components/clients/client-detail-actions"
import { parseListParams } from "@/components/clients/list-params"
import { InvoicesPagination } from "@/components/invoices/invoices-pagination"
import { InvoicesTable, InvoicesTableSkeleton } from "@/components/invoices/invoices-table"
import { invoicesListHref } from "@/components/invoices/list-params"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { getClient } from "@/lib/dal/clients"
import { INVOICES_PAGE_SIZE, listInvoices } from "@/lib/dal/invoices"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Client" }

function Detail({ label, value, className }: { label: string; value: string | null; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-line wrap-anywhere">{value ?? "—"}</dd>
    </div>
  )
}

/** The client's invoices, newest first, 20 per page (PRD §6.4 AC2). */
async function ClientInvoices({ clientId, page }: { clientId: string; page: number }) {
  const base = `/clients/${clientId}`
  const { rows, total, pageCount } = await listInvoices({ clientId, page })

  if (page > pageCount) redirect(invoicesListHref({ page: pageCount }, base))

  if (total === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No invoices yet</EmptyTitle>
          <EmptyDescription>Invoices for this client will be listed here.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/invoices/new" className={buttonVariants({ variant: "outline" })}>
            New invoice
          </Link>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <>
      <InvoicesTable rows={rows} />
      <InvoicesPagination params={{ page }} pageCount={pageCount} total={total} pageSize={INVOICES_PAGE_SIZE} base={base} />
    </>
  )
}

/** Reads the session and the database, so it renders inside a Suspense boundary. */
async function ClientView({ params, searchParams }: PageProps<"/clients/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const client = await getClient(id)
  if (!client) notFound()
  const { page } = parseListParams(query)

  return (
    <>
      <ClientBreadcrumb current={client.displayName} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="min-w-0 font-heading text-2xl font-semibold tracking-tight wrap-anywhere">
          {client.displayName}
        </h1>
        <ClientDetailActions clientId={client.id} clientName={client.displayName} />
      </div>

      <Card>
        <CardContent>
          <dl className="grid gap-6 md:grid-cols-2">
            <Detail label="Full name" value={client.fullName} />
            <Detail label="Company name" value={client.companyName} />
            <Detail label="Email" value={client.email} className="md:col-span-2" />
            <Detail label="Address" value={client.address} className="md:col-span-2" />
            <Detail label="VAT ID" value={client.vatId} />
          </dl>
        </CardContent>
      </Card>

      <section aria-labelledby="client-invoices" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 id="client-invoices" className="font-heading text-lg font-semibold tracking-tight">
            Invoices
          </h2>
          {client.invoiceCount > 0 && (
            <Link
              href={invoicesListHref({ client: client.id })}
              className={buttonVariants({ variant: "link", size: "sm" })}
            >
              View in invoices list
            </Link>
          )}
        </div>
        <Suspense key={page} fallback={<InvoicesTableSkeleton />}>
          <ClientInvoices clientId={client.id} page={page} />
        </Suspense>
      </section>
    </>
  )
}

function ClientViewSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-8 w-64 max-w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function ClientPage(props: PageProps<"/clients/[id]">) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 md:px-10 md:py-10">
      <Suspense fallback={<ClientViewSkeleton />}>
        <ClientView {...props} />
      </Suspense>
    </div>
  )
}
