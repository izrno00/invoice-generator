import { CheckIcon } from "@phosphor-icons/react/ssr"

import { FreelancerIllustration, type IllustrationName } from "@/components/marketing/freelancer-illustrations"
import { Reveal } from "@/components/marketing/reveal"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/** Who Payable is for, each with an isometric line illustration. */
const FREELANCERS: { label: string; illustration: IllustrationName }[] = [
  { label: "Designers", illustration: "designers" },
  { label: "Developers", illustration: "developers" },
  { label: "Writers", illustration: "writers" },
  { label: "Photographers", illustration: "photographers" },
  { label: "Consultants", illustration: "consultants" },
]

/**
 * PLACEHOLDER figures: illustrative outcomes, not measured data. Replace them with real numbers
 * from users before launch.
 */
const STATS = [
  { area: "Payments", value: "2×", label: "faster payment", detail: "With a card pay link in every invoice." },
  { area: "Invoicing", value: "3 min", label: "from blank page to sent invoice", detail: "PDF and email built in." },
  { area: "Tracking", value: "5h", label: "saved per month on admin", detail: "Paid status updates itself." },
] as const

/** True product facts (PRD §6.3): no platform fee, Stripe processes cards, payouts go to the user. */
const GUARANTEES = ["0% platform fee", "Payments by Stripe", "Money goes straight to you"] as const

/**
 * Landing page "Why Payable" section: who it's for (freelancer types with line illustrations),
 * three outcome stats and a strip of guarantees. Always dark, like the hero above it.
 */
export function WhyPayable() {
  return (
    <section
      id="why-payable"
      aria-labelledby="why-payable-heading"
      className="dark border-b bg-background text-foreground [color-scheme:dark]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-8 md:py-28">
        <Reveal className="flex flex-col items-center text-center">
          <h2
            id="why-payable-heading"
            className="max-w-3xl font-heading text-4xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl"
          >
            Made for people who bill by the project.
          </h2>
          <p className="mt-5 max-w-2xl text-lg text-pretty text-muted-foreground md:text-xl">
            Designers, developers, writers and every freelancer who would rather do the work than chase
            the payment.
          </p>
        </Reveal>

        <Reveal className="mt-14 md:mt-20">
          <ul aria-label="Made for" className="grid grid-cols-2 border-t border-l md:grid-cols-5">
            {FREELANCERS.map(({ label, illustration }, index) => (
              <li
                key={label}
                className={cn(
                  "group/cell flex flex-col border-r border-b px-4 pt-4 pb-6",
                  // The 5th cell fills the last row of the 2-column grid.
                  index === FREELANCERS.length - 1 && "col-span-2 md:col-span-1"
                )}
              >
                <span className="font-mono text-xs text-muted-foreground tabular-nums" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <FreelancerIllustration
                  name={illustration}
                  className="mx-auto mt-4 h-32 w-full max-w-48 text-muted-foreground transition-colors duration-300 group-hover/cell:text-foreground md:h-36"
                />
                <span className="mt-5 text-center text-sm font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="mt-16 md:mt-24">
          <dl className="grid border-y md:grid-cols-3 md:divide-x max-md:divide-y">
            {STATS.map((stat) => (
              <div key={stat.area} className="flex flex-col py-8 md:px-6 md:first:pl-0 md:last:pr-0">
                <dt className="font-mono text-xs tracking-widest text-primary uppercase">{stat.area}</dt>
                <dd className="mt-4 font-heading text-7xl leading-none font-semibold tracking-tighter tabular-nums md:text-8xl">
                  {stat.value}
                </dd>
                <dd className="mt-4 max-w-56 text-base font-medium text-pretty">{stat.label}</dd>
                <dd className="mt-1.5 text-sm text-muted-foreground">{stat.detail}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal className="mt-10">
          <ul aria-label="Guarantees" className="flex flex-wrap gap-2">
            {GUARANTEES.map((item) => (
              <li key={item}>
                <Badge
                  variant="outline"
                  className="h-7 rounded-md px-2.5 font-mono tracking-wider text-muted-foreground uppercase"
                >
                  <CheckIcon data-icon="inline-start" className="text-primary" aria-hidden />
                  {item}
                </Badge>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
