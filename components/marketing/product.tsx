import { OutstandingMockup } from "@/components/marketing/outstanding-mockup"
import { Reveal } from "@/components/marketing/reveal"

/** Three real v1 features (PRD §6.3, §6.9, §6.10, §6.15): pay link, automatic status, overdue view. */
const FEATURES = [
  {
    lead: "Make invoices easy to pay.",
    body: "Every invoice email includes a secure link to a pay page, where your client pays by card through Stripe. The money goes straight to your Stripe account.",
  },
  {
    lead: "Paid status updates itself.",
    body: "When a client pays online, the invoice is marked Paid automatically. Paid some other way? Mark it as paid yourself in one click.",
  },
  {
    lead: "See what's overdue first.",
    body: "Your dashboard shows what's outstanding, what's overdue and what falls due this week, so you know who to follow up with.",
  },
] as const

/**
 * Landing page Product section (the header's Product link): pitch and three features on the left,
 * the outstanding-invoices visual on the right. Always dark, like the sections above it.
 */
export function MarketingProduct() {
  return (
    <section
      id="product"
      aria-labelledby="product-heading"
      className="dark scroll-mt-16 border-b bg-background text-foreground [color-scheme:dark]"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Reveal className="flex flex-col">
          <h2
            id="product-heading"
            className="font-heading text-3xl leading-[1.1] font-semibold tracking-tight text-balance md:text-4xl"
          >
            Get paid faster.{" "}
            <span className="text-muted-foreground">
              Send invoices clients can pay by card, and see what&apos;s still owed at a glance.
            </span>
          </h2>

          <div className="mt-10 flex flex-col gap-7 md:mt-12">
            {FEATURES.map((feature) => (
              <p key={feature.lead} className="max-w-lg text-pretty text-muted-foreground">
                <strong className="font-medium text-foreground">{feature.lead}</strong> {feature.body}
              </p>
            ))}
          </div>
        </Reveal>

        {/* Second in the row on large screens, so it follows the text by a beat. */}
        <Reveal delay={0.08}>
          <OutstandingMockup />
        </Reveal>
      </div>
    </section>
  )
}
