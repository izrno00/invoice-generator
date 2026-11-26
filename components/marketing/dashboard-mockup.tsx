import { MoonIcon, PlusIcon, UserPlusIcon } from "@phosphor-icons/react/ssr"

import { NavLinks } from "@/components/app-shell/nav-links"
import { Logo } from "@/components/brand/logo"
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting"
import { PaidChart } from "@/components/dashboard/paid-chart"
import { StatCards } from "@/components/dashboard/stat-cards"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { MonthPoint, SummaryRow, Trend } from "@/lib/dashboard/summary"
import { formatMoney } from "@/lib/invoices/format"
import { cn } from "@/lib/utils"

const MONTHS = [
  ["2025-12", "Dec", "December 2025", 2_480_00],
  ["2026-01", "Jan", "January 2026", 3_150_00],
  ["2026-02", "Feb", "February 2026", 2_760_00],
  ["2026-03", "Mar", "March 2026", 3_920_00],
  ["2026-04", "Apr", "April 2026", 3_410_00],
  ["2026-05", "May", "May 2026", 4_380_00],
  ["2026-06", "Jun", "June 2026", 3_640_00],
  ["2026-07", "Jul", "July 2026", 4_920_00],
  ["2026-08", "Aug", "August 2026", 4_270_00],
  ["2026-09", "Sep", "September 2026", 5_480_00],
  ["2026-10", "Oct", "October 2026", 5_010_00],
  ["2026-11", "Nov", "November 2026", 6_240_00],
] as const

/**
 * Fake data for the landing page's product window. The months are fixed on purpose: the page is
 * prerendered, and Cache Components doesn't allow reading the clock during prerender.
 */
const MOCK = {
  firstName: "Alex",
  status: "2 invoices overdue",
  summary: {
    currency: "EUR",
    outstandingCount: 7,
    outstandingCents: 8_640_00,
    overdueCount: 2,
    overdueCents: 1_920_00,
    paidThisMonthCents: 6_240_00,
  } satisfies SummaryRow,
  trend: { percent: 18, direction: "up" } satisfies Trend,
  series: MONTHS.map(([month, label, longLabel, paidCents]) => ({
    month: `${month}-01`,
    label,
    longLabel,
    paidCents,
  })) satisfies MonthPoint[],
  dueSoon: [
    { client: "Northwind Studio", number: "2026-041", cents: 1_250_00, due: "Due today", today: true },
    { client: "Brightline Media", number: "2026-039", cents: 860_00, due: "Due in 2 days", today: false },
    { client: "Okafor & Co.", number: "2026-040", cents: 2_400_00, due: "Due in 4 days", today: false },
    { client: "Lumen Labs", number: "2026-037", cents: 540_00, due: "Due in 6 days", today: false },
  ],
}

/** Static copy of the Due soon card (the real one reads the database). */
function DueSoonMock() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Due soon</CardTitle>
        <CardDescription>Not paid, due in the next 7 days</CardDescription>
        <CardAction>
          <span className={buttonVariants({ variant: "ghost", size: "sm" })}>View all</span>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="flex flex-col">
          {MOCK.dueSoon.map((invoice) => (
            <li key={invoice.number} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5">
              <span
                className={cn("size-2 shrink-0 rounded-full bg-chart-2", invoice.today && "bg-destructive")}
                aria-hidden
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{invoice.client}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{invoice.number}</span>
              </span>
              <span className="flex shrink-0 flex-col items-end">
                <span className="font-medium tabular-nums">{formatMoney(invoice.cents, MOCK.summary.currency)}</span>
                <span className={cn("text-xs text-muted-foreground", invoice.today && "font-medium text-destructive")}>
                  {invoice.due}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

/**
 * The landing page's product window: the real dashboard components (stat cards, paid chart) with
 * fake data, inside an app frame. It's a picture, so it's inert and hidden from assistive tech.
 */
export function DashboardMockup({ className }: { className?: string }) {
  return (
    <div
      inert
      aria-hidden
      className={cn(
        "overflow-hidden rounded-xl bg-background shadow-2xl ring-1 ring-foreground/10 select-none",
        className
      )}
    >
      <div className="flex h-14 items-center gap-6 border-b px-6">
        <Logo className="h-6" />
        <NavLinks pathname="/dashboard" />
        <div className="ml-auto flex items-center gap-4">
          <span className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <MoonIcon className="size-5" />
          </span>
          <Avatar>
            <AvatarFallback className="text-xs font-medium">AM</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-8 py-8">
        <div className="flex items-end justify-between gap-4">
          <DashboardGreeting firstName={MOCK.firstName} status={MOCK.status} />
          <div className="flex shrink-0 gap-2">
            <span className={buttonVariants({ variant: "outline" })}>
              <UserPlusIcon data-icon="inline-start" />
              New client
            </span>
            <span className={buttonVariants()}>
              <PlusIcon data-icon="inline-start" />
              New invoice
            </span>
          </div>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-lg font-semibold tracking-tight">Overview</h2>
          <StatCards summary={MOCK.summary} trend={MOCK.trend} />
        </section>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 min-w-0">
            <PaidChart series={MOCK.series} currency={MOCK.summary.currency} />
          </div>
          <DueSoonMock />
        </div>
      </div>
    </div>
  )
}
