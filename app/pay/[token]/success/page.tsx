import { CheckCircleIcon } from "@phosphor-icons/react/ssr"
import { Suspense } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { getPaidCheckoutSummary } from "@/lib/dal/pay"

/** The invoice number and amount, when Stripe confirms this checkout was paid (PRD §6.9 AC2). */
async function PaidDetails({ params, searchParams }: PageProps<"/pay/[token]/success">) {
  const [{ token }, { session_id: sessionId }] = await Promise.all([params, searchParams])
  if (typeof sessionId !== "string") return null

  let paid: Awaited<ReturnType<typeof getPaidCheckoutSummary>> = null
  try {
    paid = await getPaidCheckoutSummary(token, sessionId)
  } catch (error) {
    console.error("[pay] Couldn't load the paid checkout:", error)
  }
  if (!paid) return null

  return (
    <EmptyDescription className="tabular-nums">
      Invoice {paid.invoiceNumber} · {paid.amount}
    </EmptyDescription>
  )
}

/**
 * After a successful payment at Stripe. Only says thank you: nothing is marked
 * paid here (the webhook does that, Tech.md §11.3–11.4).
 */
export default function PaySuccessPage(props: PageProps<"/pay/[token]/success">) {
  return (
    <Card>
      <CardContent>
        <Empty className="p-6 md:p-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckCircleIcon />
            </EmptyMedia>
            <EmptyTitle role="status">Thank you, your payment was received</EmptyTitle>
            <Suspense fallback={<Skeleton className="h-4 w-40" />}>
              <PaidDetails {...props} />
            </Suspense>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}
