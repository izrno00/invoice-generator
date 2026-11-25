"use client"

import { PaperPlaneTiltIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { MouseEvent } from "react"

import { InvoiceRowActions } from "@/components/invoices/invoice-actions"
import { StatusBadge } from "@/components/invoices/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { InvoiceSummary } from "@/lib/dal/invoices"
import { formatDate, formatMoney } from "@/lib/invoices/format"

function clientLabel(invoice: InvoiceSummary) {
  if (!invoice.clientName) return "No client"
  return invoice.clientDeleted ? `${invoice.clientName} (deleted client)` : invoice.clientName
}

/** The sent icon, with "Sent 24 Nov 2026" on hover and focus (PRD §6.11 AC1). */
function SentIndicator({ sentAt }: { sentAt: string | null }) {
  if (!sentAt) return <span className="sr-only">Not sent</span>
  const label = `Sent ${formatDate(sentAt)}`

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            aria-label={label}
            className="inline-flex rounded-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <PaperPlaneTiltIcon />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** Invoices as a table from `md` up, stacked cards below (PRD §6.11 AC1, AC10). */
export function InvoicesTable({ rows }: { rows: InvoiceSummary[] }) {
  const router = useRouter()

  /** A click anywhere on a row opens the invoice. The number link does it for keyboards. */
  function openRow(event: MouseEvent<HTMLTableRowElement>, id: string) {
    const target = event.target as Element
    // The actions menu and its dialogs bubble up here through React portals.
    if (!event.currentTarget.contains(target) || target.closest("a, button, [tabindex]")) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (window.getSelection()?.toString()) return

    router.push(`/invoices/${id}`)
  }

  return (
    <>
      <Card className="hidden py-0 md:flex">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Invoice date</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-8">
                <span className="sr-only">Sent</span>
              </TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((invoice) => (
              <TableRow key={invoice.id} className="cursor-pointer" onClick={(event) => openRow(event, invoice.id)}>
                <TableCell className="pl-4 font-medium tabular-nums">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell className="max-w-0 min-w-32 truncate">
                  <span className={invoice.clientName ? undefined : "text-muted-foreground"}>{clientLabel(invoice)}</span>
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(invoice.invoiceDate)}</TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(invoice.dueDate)}</TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {formatMoney(invoice.totalCents, invoice.currency)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={invoice.status} overdue={invoice.overdue} />
                </TableCell>
                <TableCell>
                  <SentIndicator sentAt={invoice.lastSentAt} />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <InvoiceRowActions invoice={invoice} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((invoice) => (
          <li key={invoice.id}>
            <Card size="sm" className="relative">
              <CardContent className="flex-row items-start gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {/* The ::after stretches the link over the whole card. */}
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-medium tabular-nums outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                    <StatusBadge status={invoice.status} overdue={invoice.overdue} />
                  </div>
                  <p className="truncate">{clientLabel(invoice)}</p>
                  <p className="font-medium tabular-nums">{formatMoney(invoice.totalCents, invoice.currency)}</p>
                  <p className="text-muted-foreground">
                    {formatDate(invoice.invoiceDate)} · Due {formatDate(invoice.dueDate)}
                    {invoice.lastSentAt && ` · Sent ${formatDate(invoice.lastSentAt)}`}
                  </p>
                </div>
                <div className="relative z-10">
                  <InvoiceRowActions invoice={invoice} />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}

export function InvoicesTableSkeleton() {
  return (
    <Card aria-hidden>
      <CardContent className="gap-4">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}
