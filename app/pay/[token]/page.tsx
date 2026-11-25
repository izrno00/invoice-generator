import { Suspense } from "react"

import { PayCardSkeleton, PayCheckout, PayStatusMessage } from "@/components/pay/pay-panel"
import { getPayPageState, type PayPageState } from "@/lib/dal/pay"

/** Looks the link up in the database and Stripe, so it renders inside a Suspense boundary. */
async function PayView({ params, searchParams }: PageProps<"/pay/[token]">) {
  const [{ token }, { cancelled }] = await Promise.all([params, searchParams])

  let state: PayPageState
  try {
    state = await getPayPageState(token)
  } catch (error) {
    console.error("[pay] Couldn't load the pay page:", error)
    return <PayStatusMessage status="error" />
  }

  if (state.kind !== "payable") return <PayStatusMessage status={state.kind} />
  return <PayCheckout token={token} summary={state.summary} cancelled={cancelled === "1"} />
}

/** The client's pay page (PRD §6.9). */
export default function PayPage(props: PageProps<"/pay/[token]">) {
  return (
    <Suspense fallback={<PayCardSkeleton />}>
      <PayView {...props} />
    </Suspense>
  )
}
