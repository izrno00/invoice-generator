import { processWebhookEvent, verifyWebhookEvent } from "@/lib/stripe/webhook"

/**
 * Stripe Connect webhook (Tech.md §11.4). Stripe signs the raw body, so it's
 * read as text before anything parses it. 400 = bad signature (Stripe won't
 * retry), 500 = handling failed (Stripe retries), 200 = handled or ignored.
 */
export async function POST(request: Request) {
  const payload = await request.text()
  const event = verifyWebhookEvent(payload, request.headers.get("stripe-signature"))
  if (!event) return new Response("Invalid signature", { status: 400 })

  try {
    await processWebhookEvent(event)
  } catch (error) {
    console.error(`[stripe] Webhook event ${event.id} (${event.type}) failed:`, error)
    return new Response("Webhook handling failed", { status: 500 })
  }

  return Response.json({ received: true })
}
