import { DueSoonSkeleton, RecentInvoicesSkeleton } from "@/components/dashboard/invoice-lists"
import { StatCardsSkeleton } from "@/components/dashboard/stat-cards"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Same footprint as the greeting: title and status line. */
export function GreetingSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      <Skeleton className="h-8 w-64 md:h-9" />
      <Skeleton className="h-4 w-48" />
    </div>
  )
}

export function PaidChartSkeleton() {
  return (
    <Card className="h-full" aria-hidden>
      <CardHeader>
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="gap-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-52 w-full md:h-60" />
      </CardContent>
    </Card>
  )
}

/** The whole dashboard while the totals load (Tech.md §8.5). */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy aria-label="Loading dashboard">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <StatCardsSkeleton />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PaidChartSkeleton />
        </div>
        <DueSoonSkeleton />
      </div>
      <RecentInvoicesSkeleton />
    </div>
  )
}
