"use client"

import {
  CheckCircleIcon,
  CreditCardIcon,
  LinkBreakIcon,
  LockSimpleIcon,
  ProhibitIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react"
import { useActionState } from "react"

import { startCheckout, type StartCheckoutResult } from "@/app/pay/[token]/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import type { PaySummary } from "@/lib/dal/pay"

/** The pay page's end states (PRD §6.9 AC5, §9). */
export type PayStatus = "invalid" | "paid" | "unavailable" | "error"

const STATUS: Record<PayStatus, { title: string; description: string; Icon: typeof CheckCircleIcon }> = {
  paid: {
    title: "This invoice has been paid. Thank you!",
    description: "There's nothing left to pay.",
    Icon: CheckCircleIcon,
  },
  invalid: {
    title: "This payment link is no longer valid.",
    description: "Please contact the sender.",
    Icon: LinkBreakIcon,
  },
  unavailable: {
    title: "Online payment is currently unavailable.",
    description: "Please contact the sender.",
    Icon: ProhibitIcon,
  },
  error: {
    title: "Payment is temporarily unavailable.",
    description: "Please try again in a few minutes.",
    Icon: WarningCircleIcon,
  },
}

export function PayStatusMessage({ status }: { status: PayStatus }) {
  const { title, description, Icon } = STATUS[status]
  return (
    <Card>
      <CardContent>
        <Empty className="p-6 md:p-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon />
            </EmptyMedia>
            <EmptyTitle role={status === "paid" ? "status" : "alert"}>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}

/** Summary + Pay now (PRD §6.9). Pay now redirects to Stripe Checkout, or explains why it can't. */
export function PayCheckout({
  token,
  summary,
  cancelled,
}: {
  token: string
  summary: PaySummary
  cancelled: boolean
}) {
  const [result, pay, pending] = useActionState<StartCheckoutResult | null>(() => startCheckout(token), null)

  // The invoice changed since the page loaded (paid, deleted, Stripe disconnected).
  if (result && result.kind !== "error") return <PayStatusMessage status={result.kind} />

  return (
    <Card>
      <CardHeader>
        <CardDescription>{summary.senderName}</CardDescription>
        <CardTitle className="font-heading text-xl tabular-nums">Invoice {summary.invoiceNumber}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {cancelled && !result && (
          <Alert>
            <XCircleIcon />
            <AlertDescription>Payment cancelled. You can try again.</AlertDescription>
          </Alert>
        )}

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Invoice date</dt>
          <dd className="text-right tabular-nums">{summary.invoiceDate}</dd>
          <dt className="text-muted-foreground">Due date</dt>
          <dd className="text-right tabular-nums">{summary.dueDate}</dd>
        </dl>

        <div className="flex items-baseline justify-between gap-4 border-t pt-4">
          <span className="text-sm text-muted-foreground">Amount due</span>
          <span className="font-heading text-2xl font-semibold tabular-nums">{summary.amount}</span>
        </div>

        {result?.kind === "error" && (
          <Alert variant="destructive" aria-live="polite">
            <WarningCircleIcon />
            <AlertDescription>Payment is temporarily unavailable, please try again in a few minutes.</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex-col gap-3">
        <form action={pay} className="w-full">
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? <Spinner /> : <CreditCardIcon />}
            Pay now
          </Button>
        </form>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <LockSimpleIcon className="shrink-0" />
          Secure payment by Stripe
        </p>
      </CardFooter>
    </Card>
  )
}

export function PayCardSkeleton() {
  return (
    <Card aria-hidden>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}
