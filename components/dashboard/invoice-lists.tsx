import { CalendarCheckIcon, ReceiptIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"

import { StatusBadge } from "@/components/invoices/status-badge"
import { invoicesListHref } from "@/components/invoices/list-params"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { DUE_SOON_DAYS, getDueSoon, getRecentInvoices } from "@/lib/dal/dashboard"
import { dueLabel, initials } from "@/lib/dashboard/summary"
import { formatDate, formatMoney } from "@/lib/invoices/format"
import { todayUtc } from "@/lib/invoices/status"
import { cn } from "@/lib/utils"

const ROW_LINK =
  "-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"

function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={buttonVariants({ variant: "ghost", size: "sm" })} aria-label={label}>
      View all
    </Link>
  )
}

/** Not paid invoices due in the next 7 days, every currency (PRD §6.15 AC5). */
export async function DueSoonCard() {
  const invoices = await getDueSoon()
  const today = todayUtc()

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Due soon</CardTitle>
        <CardDescription>Not paid, due in the next {DUE_SOON_DAYS} days</CardDescription>
        <CardAction>
          <ViewAll href={invoicesListHref({ status: "unpaid" })} label="View all not paid invoices" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {invoices.length === 0 ? (
          <Empty className="flex-1 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarCheckIcon />
              </EmptyMedia>
              <EmptyTitle>Nothing due this week</EmptyTitle>
              <EmptyDescription>Invoices due in the next {DUE_SOON_DAYS} days will show up here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col">
            {invoices.map((invoice) => {
              const label = dueLabel(invoice.dueDate, today)
              const dueToday = invoice.dueDate <= today
              return (
                <li key={invoice.id}>
                  <Link href={`/invoices/${invoice.id}`} className={ROW_LINK}>
                    <span
                      className={cn("size-2 shrink-0 rounded-full bg-chart-2", dueToday && "bg-destructive")}
                      aria-hidden
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{invoice.clientName ?? "No client"}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{invoice.invoiceNumber}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end">
                      <span className="font-medium tabular-nums">{formatMoney(invoice.totalCents, invoice.currency)}</span>
                      <span className={cn("text-xs text-muted-foreground", dueToday && "font-medium text-destructive")}>
                        {label}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/** The 5 latest invoices, every currency (PRD §6.15 AC6). */
export async function RecentInvoicesCard() {
  const invoices = await getRecentInvoices()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent invoices</CardTitle>
        <CardDescription>Your latest invoices in every currency</CardDescription>
        <CardAction>
          <ViewAll href="/invoices" label="View all invoices" />
        </CardAction>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptIcon />
              </EmptyMedia>
              <EmptyTitle>No invoices yet</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link href={`/invoices/${invoice.id}`} className={ROW_LINK}>
                  <Avatar size="lg" aria-hidden>
                    <AvatarFallback className="font-medium">{initials(invoice.clientName)}</AvatarFallback>
                  </Avatar>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{invoice.clientName ?? "No client"}</span>
                    <span className="truncate text-xs text-muted-foreground tabular-nums">
                      {invoice.invoiceNumber} · Due {formatDate(invoice.dueDate)}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <span className="font-medium tabular-nums sm:order-2 sm:w-32 sm:text-right">
                      {formatMoney(invoice.totalCents, invoice.currency)}
                    </span>
                    <span className="sm:order-1">
                      <StatusBadge status={invoice.status} overdue={invoice.overdue} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ListSkeleton({ rows, avatar }: { rows: number; avatar: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className={avatar ? "size-10 rounded-full" : "size-2 rounded-full"} />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

export function DueSoonSkeleton() {
  return (
    <Card className="h-full" aria-hidden>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-44" />
      </CardHeader>
      <CardContent>
        <ListSkeleton rows={4} avatar={false} />
      </CardContent>
    </Card>
  )
}

export function RecentInvoicesSkeleton() {
  return (
    <Card aria-hidden>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent>
        <ListSkeleton rows={5} avatar />
      </CardContent>
    </Card>
  )
}
