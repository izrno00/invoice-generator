"use client"

import { ChartLineIcon } from "@phosphor-icons/react"
import { useReducedMotion } from "motion/react"
import { useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { MonthPoint } from "@/lib/dashboard/summary"
import { formatAmount, formatMoney } from "@/lib/invoices/format"

const RANGES = [6, 12] as const
type Range = (typeof RANGES)[number]

const chartConfig = {
  paidCents: { label: "Paid", color: "var(--chart-2)" },
} satisfies ChartConfig

const COMPACT = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })

type TooltipProps = {
  active?: boolean
  payload?: readonly { payload: MonthPoint }[]
  currency: string
}

/** Month on top, amount below, in the shadcn tooltip style. */
function PaidTooltip({ active, payload, currency }: TooltipProps) {
  const point = active ? payload?.[0]?.payload : undefined
  if (!point) return null

  return (
    <div className="grid min-w-36 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{point.longLabel}</div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-1 shrink-0 rounded-[2px] bg-(--color-paidCents)" />
        <span className="text-muted-foreground">Paid</span>
        <span className="ml-auto font-mono font-medium text-foreground tabular-nums">
          {formatMoney(point.paidCents, currency)}
        </span>
      </div>
    </div>
  )
}

/**
 * Paid per month in one currency (PRD §6.15 AC4). Gets the full 12 months and
 * slices it for the 6 / 12 toggle, so switching needs no request.
 */
export function PaidChart({ series, currency }: { series: readonly MonthPoint[]; currency: string }) {
  const [range, setRange] = useState<Range>(6)
  const reduceMotion = useReducedMotion()

  const data = series.slice(-range)
  const total = data.reduce((sum, point) => sum + point.paidCents, 0)
  const hasAny = series.some((point) => point.paidCents > 0)
  const lastIndex = data.length - 1

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Paid</CardTitle>
        <CardDescription>Total received per month</CardDescription>
        {hasAny && (
          <CardAction>
            <ToggleGroup
              aria-label="Chart range"
              variant="outline"
              size="sm"
              spacing={0}
              value={[String(range)]}
              onValueChange={(next) => {
                const value = Number(next[0])
                if (value === 6 || value === 12) setRange(value)
              }}
            >
              {RANGES.map((value) => (
                <ToggleGroupItem key={value} value={String(value)} className="px-2.5">
                  {value} months
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex-1 gap-4">
        {hasAny ? (
          <>
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
                {formatMoney(total, currency)}
              </span>
              <span className="text-sm text-muted-foreground">in the last {range} months</span>
            </p>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-52 w-full md:h-60"
              role="img"
              aria-label={`Paid per month in ${currency}, last ${range} months: ${data
                .map((point) => `${point.longLabel} ${formatAmount(point.paidCents)}`)
                .join(", ")}`}
            >
              <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }} accessibilityLayer>
                <defs>
                  <linearGradient id="paid-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-paidCents)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-paidCents)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  width={44}
                  allowDecimals={false}
                  tickFormatter={(cents: number) => COMPACT.format(cents / 100)}
                />
                <ChartTooltip
                  cursor={{ strokeDasharray: "4 4" }}
                  content={({ active, payload }) => (
                    <PaidTooltip
                      active={active}
                      payload={payload as unknown as TooltipProps["payload"]}
                      currency={currency}
                    />
                  )}
                />
                <Area
                  dataKey="paidCents"
                  type="monotone"
                  stroke="var(--color-paidCents)"
                  strokeWidth={2}
                  fill="url(#paid-fill)"
                  isAnimationActive={!reduceMotion}
                  animationDuration={900}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--background)" }}
                  // Highlight the current month (the last point).
                  dot={({ index, cx, cy }: { index?: number; cx?: number; cy?: number }) =>
                    index === lastIndex && cx != null && cy != null ? (
                      <circle
                        key="current"
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill="var(--color-paidCents)"
                        stroke="var(--background)"
                        strokeWidth={2}
                      />
                    ) : (
                      <g key={`dot-${index}`} />
                    )
                  }
                />
              </AreaChart>
            </ChartContainer>
          </>
        ) : (
          <Empty className="flex-1 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ChartLineIcon />
              </EmptyMedia>
              <EmptyTitle>No payments yet</EmptyTitle>
              <EmptyDescription>Payments received in {currency} over the last 12 months will show up here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
