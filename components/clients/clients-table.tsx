"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type { MouseEvent } from "react"

import { ClientRowActions } from "@/components/clients/client-row-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ClientListRow } from "@/lib/dal/clients"

function invoiceCountLabel(count: number) {
  return `${count} ${count === 1 ? "invoice" : "invoices"}`
}

/** The clients list: a table from `md` up, stacked cards below (PRD §6.4 AC1). */
export function ClientsTable({ rows }: { rows: ClientListRow[] }) {
  const router = useRouter()

  /** A click anywhere on a row opens the client. The name link does it for keyboards. */
  function openRow(event: MouseEvent<HTMLTableRowElement>, id: string) {
    const target = event.target as Element
    // The actions menu and its dialog bubble up here through React portals.
    if (!event.currentTarget.contains(target) || target.closest("a, button")) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (window.getSelection()?.toString()) return

    router.push(`/clients/${id}`)
  }

  return (
    <>
      <Card className="hidden py-0 md:flex">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Invoices</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((client) => (
              <TableRow key={client.id} className="cursor-pointer" onClick={(event) => openRow(event, client.id)}>
                <TableCell className="w-1/2 max-w-0 pl-4 font-medium">
                  <Link
                    href={`/clients/${client.id}`}
                    className="block truncate rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                  >
                    {client.displayName}
                  </Link>
                </TableCell>
                <TableCell className="w-1/2 max-w-0 truncate text-muted-foreground">{client.email ?? "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{client.invoiceCount}</TableCell>
                <TableCell className="pr-4 text-right">
                  <ClientRowActions clientId={client.id} clientName={client.displayName} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((client) => (
          <li key={client.id}>
            <Card size="sm" className="relative">
              <CardContent className="flex-row items-start gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {/* The ::after stretches the link over the whole card. */}
                  <Link
                    href={`/clients/${client.id}`}
                    className="truncate font-medium outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset"
                  >
                    {client.displayName}
                  </Link>
                  <p className="truncate text-muted-foreground">{client.email ?? "—"}</p>
                  <p className="text-muted-foreground">{invoiceCountLabel(client.invoiceCount)}</p>
                </div>
                <div className="relative z-10">
                  <ClientRowActions clientId={client.id} clientName={client.displayName} />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}

export function ClientsTableSkeleton() {
  return (
    <Card aria-hidden>
      <CardContent className="gap-4">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}
