import { PlusIcon } from "@phosphor-icons/react/ssr"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { InvoiceDeletedNotice } from "@/components/invoices/invoice-deleted-notice"
import { InvoicesFilters } from "@/components/invoices/invoices-filters"
import { InvoicesPagination } from "@/components/invoices/invoices-pagination"
import { InvoicesTable, InvoicesTableSkeleton } from "@/components/invoices/invoices-table"
import { hasFilters, invoicesListHref, parseInvoiceListParams, type InvoiceListParams } from "@/components/invoices/list-params"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { listClientOptions } from "@/lib/dal/clients"
import { INVOICES_PAGE_SIZE, listInvoices } from "@/lib/dal/invoices"

export const metadata: Metadata = { title: "Invoices" }

/** Reads the session and the database, so it renders inside a Suspense boundary. */
async function InvoicesList({ params }: { params: InvoiceListParams }) {
  const { rows, total, pageCount } = await listInvoices({
    q: params.q,
    status: params.status ?? undefined,
    clientId: params.client ?? undefined,
    from: params.from ?? undefined,
    to: params.to ?? undefined,
    page: params.page,
  })

  // E.g. the last invoice on the last page was deleted.
  if (params.page > pageCount) redirect(invoicesListHref({ ...params, page: pageCount }))

  if (total === 0) {
    return hasFilters(params) ? (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No invoices match your filters</EmptyTitle>
          <EmptyDescription>Try a different search, status, client or date range.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/invoices" className={buttonVariants({ variant: "outline" })}>
            Clear filters
          </Link>
        </EmptyContent>
      </Empty>
    ) : (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No invoices yet</EmptyTitle>
          <EmptyDescription>Create an invoice, download its PDF and send it to your client.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/invoices/new" className={buttonVariants()}>
            Create your first invoice
          </Link>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <>
      <InvoicesTable rows={rows} />
      <InvoicesPagination params={params} pageCount={pageCount} total={total} pageSize={INVOICES_PAGE_SIZE} />
    </>
  )
}

async function Filters() {
  const clients = await listClientOptions()
  return <InvoicesFilters clients={clients.map((client) => ({ id: client.id, label: client.displayName }))} />
}

function FiltersSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex flex-col gap-3 first:sm:col-span-2 first:lg:col-span-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  )
}

/** A new boundary per filter combination, so each shows the loading state. */
async function InvoicesResults({ searchParams }: Pick<PageProps<"/invoices">, "searchParams">) {
  const params = parseInvoiceListParams(await searchParams)

  return (
    <Suspense key={invoicesListHref(params)} fallback={<InvoicesTableSkeleton />}>
      <InvoicesList params={params} />
    </Suspense>
  )
}

export default function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:px-10 md:py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Invoices</h1>
        <Link href="/invoices/new" className={buttonVariants()}>
          <PlusIcon data-icon="inline-start" />
          New invoice
        </Link>
      </div>
      <Suspense fallback={<FiltersSkeleton />}>
        <Filters />
      </Suspense>
      <Suspense fallback={<InvoicesTableSkeleton />}>
        <InvoicesResults searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={null}>
        <InvoiceDeletedNotice />
      </Suspense>
    </div>
  )
}
