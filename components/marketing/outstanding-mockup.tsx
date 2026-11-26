"use client"

import { CheckCircleIcon } from "@phosphor-icons/react"
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { useEffect, useRef } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatMoney } from "@/lib/invoices/format"
import { cn } from "@/lib/utils"

const CURRENCY = "EUR"

/**
 * Fake data for the landing page's product visual. Same freelancer as the hero's dashboard window:
 * 7 Not paid invoices worth EUR 8,640, 2 of them overdue.
 */
const BUCKETS = [
  { label: "Overdue", count: 2, cents: 1_920_00, swatch: "bg-chart-3" },
  { label: "Due today", count: 1, cents: 1_250_00, swatch: "bg-chart-2" },
  { label: "Due in 1–7 days", count: 3, cents: 3_800_00, swatch: "bg-chart-1" },
  { label: "Due later", count: 1, cents: 1_670_00, swatch: "bg-chart-1/35" },
] as const

const TOTAL_CENTS = BUCKETS.reduce((sum, bucket) => sum + bucket.cents, 0)

const EASE = [0.16, 1, 0.3, 1] as const

/** The outstanding total, counting up from zero once the card is in view. */
function CountUp({ cents, play }: { cents: number; play: boolean }) {
  const value = useMotionValue(0)
  const text = useTransform(value, (latest) => formatMoney(Math.round(latest), CURRENCY))
  useEffect(() => {
    if (!play) return
    const controls = animate(value, cents, { duration: 1.1, ease: EASE })
    return () => controls.stop()
  }, [cents, play, value])
  return <motion.span>{text}</motion.span>
}

/**
 * The Product section's visual: a brand-gradient panel with an "Outstanding" breakdown card and an
 * "Invoice paid" notice overlapping its corner. When it scrolls into view the bar grows in, the
 * total counts up and the notice slides in; reduced motion shows the final state. It's a picture,
 * so it's inert and hidden from assistive tech.
 */
export function OutstandingMockup({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const reduceMotion = useReducedMotion()
  const animated = !reduceMotion
  const play = animated && inView

  return (
    <div
      ref={ref}
      inert
      aria-hidden
      className={cn(
        // The card sits in the flow, so the panel always fits it; only the notice is positioned.
        "relative isolate overflow-hidden rounded-2xl px-5 pt-28 pb-10 select-none sm:px-12 sm:pb-14 lg:pt-36 lg:pr-16 lg:pb-16 lg:pl-10",
        className
      )}
      style={{
        backgroundColor: "var(--chart-5)",
        backgroundImage: [
          "radial-gradient(at 12% 8%, var(--chart-4) 0px, transparent 55%)",
          "radial-gradient(at 88% 12%, var(--chart-1) 0px, transparent 50%)",
          "radial-gradient(at 18% 92%, var(--chart-2) 0px, transparent 55%)",
          "radial-gradient(at 92% 96%, var(--primary) 0px, transparent 55%)",
        ].join(", "),
      }}
    >
      <Card className="relative shadow-2xl">
        <CardHeader>
          <CardTitle>Outstanding</CardTitle>
          <CardDescription>Not paid invoices</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
              {animated ? <CountUp cents={TOTAL_CENTS} play={play} /> : formatMoney(TOTAL_CENTS, CURRENCY)}
            </p>
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
              {BUCKETS.map((bucket, index) => (
                <motion.span
                  key={bucket.label}
                  className={cn("h-full origin-left first:rounded-l-full last:rounded-r-full", bucket.swatch)}
                  style={{ width: `${(bucket.cents / TOTAL_CENTS) * 100}%` }}
                  initial={animated ? { scaleX: 0 } : false}
                  animate={play ? { scaleX: 1 } : undefined}
                  transition={{ duration: 0.6, delay: 0.15 + index * 0.12, ease: EASE }}
                />
              ))}
            </div>
          </div>

          <table className="w-full text-xs">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="pb-2 text-left font-normal">Status</th>
                <th className="pb-2 text-right font-normal">Invoices</th>
                <th className="pb-2 text-right font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {BUCKETS.map((bucket) => (
                <tr key={bucket.label} className="border-b last:border-0">
                  <td className="py-2.5">
                    <span className="flex items-center gap-2 font-medium">
                      <span className={cn("size-2 shrink-0 rounded-[3px]", bucket.swatch)} />
                      {bucket.label}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground tabular-nums">{bucket.count}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatMoney(bucket.cents, CURRENCY)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <motion.div
        className="absolute top-6 right-5 z-10 w-60 sm:right-12 lg:top-12 lg:right-6 lg:w-56"
        initial={animated ? { opacity: 0, y: 12, scale: 0.96 } : false}
        animate={play ? { opacity: 1, y: 0, scale: 1 } : undefined}
        transition={{ duration: 0.5, delay: 1, ease: EASE }}
      >
        <Card size="sm" className="items-center gap-1.5 px-4 text-center shadow-2xl">
          <CheckCircleIcon weight="fill" className="size-5 text-primary" />
          <p className="font-heading text-sm font-medium">Invoice paid</p>
          <p className="text-xs text-pretty text-muted-foreground">
            Brightline Media paid 2026-035 by card. {formatMoney(980_00, CURRENCY)}
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
