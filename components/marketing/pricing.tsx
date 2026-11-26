import { CheckIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"

import { whiteButton } from "@/components/marketing/button-styles"
import { Reveal } from "@/components/marketing/reveal"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The plans (PRD §3.3, "Later"). Only the monthly invoice limit differs; every plan gets every
 * feature. Billing and the limits aren't built yet, so every button goes to sign-up.
 */
const PLANS = [
  {
    name: "Free",
    price: 0,
    description: "For trying Payable or the occasional invoice.",
    limit: "5 invoices per month",
    cta: "Get started",
    featured: false,
  },
  {
    name: "Plus",
    price: 10,
    description: "For freelancers who bill clients every week.",
    limit: "50 invoices per month",
    cta: "Start with Plus",
    featured: true,
  },
  {
    name: "Pro",
    price: 20,
    description: "For busy freelancers who never want to count.",
    limit: "Unlimited invoices",
    cta: "Start with Pro",
    featured: false,
  },
] as const

/** Included in every plan (all real v1 features). */
const INCLUDED = [
  "Card payments through Stripe",
  "PDF invoices sent by email",
  "EUR, USD, GBP and BAM",
  "Saved clients",
  "Dashboard and invoice list",
] as const

/**
 * Landing page Pricing section (the header's Pricing link): three plans that differ only in how
 * many invoices you can create per month, and a note on Stripe's fees. Always dark.
 */
export function MarketingPricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="dark scroll-mt-16 border-b bg-background text-foreground [color-scheme:dark]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-8 md:py-28">
        <Reveal className="flex flex-col items-center text-center">
          <h2
            id="pricing-heading"
            className="max-w-2xl font-heading text-3xl leading-[1.1] font-semibold tracking-tight text-balance md:text-4xl"
          >
            Simple pricing.{" "}
            <span className="text-muted-foreground">Start free and upgrade when you send more invoices.</span>
          </h2>
        </Reveal>

        <ul className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3">
          {PLANS.map((plan, index) => (
            <Reveal
              as="li"
              key={plan.name}
              delay={index * 0.08}
              className={cn(
                "relative isolate flex flex-col overflow-hidden rounded-2xl bg-card p-6 ring-1 ring-foreground/10 md:p-7",
                plan.featured && "ring-foreground/25"
              )}
            >
              {plan.featured && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 opacity-50"
                  style={{ background: "radial-gradient(circle at 100% 0%, var(--chart-2) 0%, transparent 60%)" }}
                />
              )}

              <div className="flex items-center justify-between gap-3">
                <h3 className="font-heading text-lg font-medium">{plan.name}</h3>
                {plan.featured && <Badge variant="secondary">Most popular</Badge>}
              </div>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">{plan.description}</p>

              <p className="mt-6 flex items-baseline gap-1">
                <span className="font-heading text-5xl font-semibold tracking-tight tabular-nums">${plan.price}</span>
                <span className="text-sm text-muted-foreground">/ month</span>
              </p>
              <p className="mt-2 text-sm font-medium">{plan.limit}</p>

              <Link
                href="/auth/sign-up"
                className={cn(
                  buttonVariants({ variant: plan.featured ? "default" : "outline", size: "lg" }),
                  plan.featured && whiteButton,
                  "mt-6 w-full"
                )}
              >
                {plan.cta}
              </Link>

              <ul className="mt-7 flex flex-col gap-2.5 border-t pt-6 text-sm">
                {INCLUDED.map((feature) => (
                  <li key={feature} className="flex gap-2.5">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-8">
          <p className="text-center text-sm text-pretty text-muted-foreground">
            Card payments are processed by Stripe; Stripe&apos;s fees apply. Payable takes no fee on payments.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
