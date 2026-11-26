import {
  ArrowUpRightIcon,
  CheckCircleIcon,
  ClockIcon,
  MinusIcon,
  TrendDownIcon,
  TrendUpIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/ssr"
import type { Icon } from "@phosphor-icons/react"
import Link from "next/link"

import { AnimatedAmount } from "@/components/dashboard/animated-amount"
import { invoicesListHref } from "@/components/invoices/list-params"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { SummaryRow, Trend } from "@/lib/dashboard/summary"
import { cn } from "@/lib/utils"

function invoiceCount(count: number) {
  return count === 1 ? "1 invoice" : `${count} invoices`
}

type StatCardProps = {
  title: string
  icon: Icon
  href: string
  currency: string
  cents: number
  /** Something needs attention: red tint (Overdue above zero). */
  alert?: boolean
  footer: React.ReactNode
}

/** One clickable stat (PRD §6.15 AC3): icon tile, label, amount, sub-line. */
function StatCard({ title, icon: IconComponent, href, currency, cents, alert = false, footer }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group/stat rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card
        className={cn(
          "h-full transition-[box-shadow,background-color] group-hover/stat:ring-foreground/20",
          alert && "bg-destructive/5 ring-destructive/30 group-hover/stat:ring-destructive/50"
        )}
      >
        <CardHeader className="items-center">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
                alert && "bg-destructive/10 text-destructive"
              )}
            >
              <IconComponent className="size-5" aria-hidden />
            </span>
            <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
          </div>
          <CardAction className="row-span-1 self-center">
            <ArrowUpRightIcon
              className="size-4 text-muted-foreground transition-transform group-hover/stat:translate-x-0.5 group-hover/stat:-translate-y-0.5 group-hover/stat:text-foreground"
              aria-hidden
            />
          </CardAction>
        </CardHeader>
        <CardContent className="gap-2">
          <p className="flex items-baseline gap-1.5 font-heading text-3xl font-semibold tracking-tight tabular-nums">
            <span className="text-base font-medium text-muted-foreground">{currency}</span>
            <AnimatedAmount cents={cents} />
          </p>
          <div className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">{footer}</div>
        </CardContent>
      </Card>
    </Link>
  )
}

function TrendBadge({ trend }: { trend: Trend | null }) {
  if (!trend) return <span>No payments by this time last month</span>

  const TrendIcon = trend.direction === "up" ? TrendUpIcon : trend.direction === "down" ? TrendDownIcon : MinusIcon
  const sign = trend.direction === "up" ? "+" : trend.direction === "down" ? "−" : ""

  return (
    <>
      <Badge
        variant="outline"
        className={cn(
          "tabular-nums",
          trend.direction === "up" && "border-success/30 bg-success/10 text-success",
          trend.direction === "down" && "border-destructive/30 bg-destructive/10 text-destructive"
        )}
      >
        <TrendIcon data-icon="inline-start" aria-hidden />
        {sign}
        {trend.percent}%
      </Badge>
      <span>vs same time last month</span>
    </>
  )
}

/** Outstanding, Overdue and Paid this month for one currency. */
export function StatCards({ summary, trend }: { summary: SummaryRow; trend: Trend | null }) {
  const { currency } = summary
  const overdue = summary.overdueCount > 0

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Outstanding"
        icon={ClockIcon}
        href={invoicesListHref({ status: "unpaid" })}
        currency={currency}
        cents={summary.outstandingCents}
        footer={<span>{invoiceCount(summary.outstandingCount)} not paid</span>}
      />
      <StatCard
        title="Overdue"
        icon={WarningCircleIcon}
        href={invoicesListHref({ status: "overdue" })}
        currency={currency}
        cents={summary.overdueCents}
        alert={overdue}
        footer={
          <span className={cn(overdue && "text-destructive")}>
            {overdue ? `${invoiceCount(summary.overdueCount)} past due` : "Nothing past due"}
          </span>
        }
      />
      <StatCard
        title="Paid this month"
        icon={CheckCircleIcon}
        href={invoicesListHref({ status: "paid" })}
        currency={currency}
        cents={summary.paidThisMonthCents}
        footer={<TrendBadge trend={trend} />}
      />
    </div>
  )
}

export function StatCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-hidden>
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardHeader>
          <CardContent className="gap-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
