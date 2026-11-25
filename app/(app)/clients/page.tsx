import { PlusIcon } from "@phosphor-icons/react/ssr"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { ClientDeletedNotice } from "@/components/clients/client-deleted-notice"
import { ClientsPagination } from "@/components/clients/clients-pagination"
import { ClientsSearch } from "@/components/clients/clients-search"
import { ClientsTable, ClientsTableSkeleton } from "@/components/clients/clients-table"
import { clientsListHref, parseListParams } from "@/components/clients/list-params"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { listClients } from "@/lib/dal/clients"

export const metadata: Metadata = { title: "Clients" }

/** Reads the session and the database, so it renders inside a Suspense boundary. */
async function ClientsList({ q, page }: { q: string; page: number }) {
  const { rows, total, pageCount } = await listClients({ q, page })

  // E.g. the last client on the last page was deleted.
  if (page > pageCount) redirect(clientsListHref({ q, page: pageCount }))

  if (total === 0) {
    return q ? (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle className="max-w-full wrap-anywhere">No clients match “{q}”</EmptyTitle>
          <EmptyDescription>Try a different name, company or email.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/clients" className={buttonVariants({ variant: "outline" })}>
            Clear search
          </Link>
        </EmptyContent>
      </Empty>
    ) : (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No clients yet</EmptyTitle>
          <EmptyDescription>Add the people and companies you send invoices to.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/clients/new" className={buttonVariants()}>
            Add your first client
          </Link>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <>
      <ClientsTable rows={rows} />
      <ClientsPagination q={q} page={page} pageCount={pageCount} />
    </>
  )
}

/** A new boundary per search and page, so each shows the loading state. */
async function ClientsResults({ searchParams }: Pick<PageProps<"/clients">, "searchParams">) {
  const { q, page } = parseListParams(await searchParams)

  return (
    <Suspense key={`${page}:${q}`} fallback={<ClientsTableSkeleton />}>
      <ClientsList q={q} page={page} />
    </Suspense>
  )
}

export default function ClientsPage({ searchParams }: PageProps<"/clients">) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 md:px-10 md:py-10">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Clients</h1>
        <Link href="/clients/new" className={buttonVariants()}>
          <PlusIcon data-icon="inline-start" />
          Add client
        </Link>
      </div>
      <Suspense fallback={<Skeleton className="h-9 w-full sm:max-w-sm" />}>
        <ClientsSearch />
      </Suspense>
      <Suspense fallback={<ClientsTableSkeleton />}>
        <ClientsResults searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={null}>
        <ClientDeletedNotice />
      </Suspense>
    </div>
  )
}
