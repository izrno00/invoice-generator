import { FeatureCard } from "@/components/marketing/feature-card"
import {
  CurrenciesVisual,
  InvoiceEditorVisual,
  InvoiceListVisual,
  PayAnywhereVisual,
  PdfEmailVisual,
} from "@/components/marketing/feature-visuals"
import { Reveal } from "@/components/marketing/reveal"

/** A soft glow from one edge, in the brand's violet or lime. */
const glow = (at: string, color: string) => `radial-gradient(circle at ${at}, ${color} 0%, transparent 60%)`

/** The five features. Every bullet is a v1 fact from the PRD (§6.3–§6.15). */
const FEATURES = [
  {
    title: "Clients pay by card, on any device",
    description:
      "Every invoice email can carry a secure payment link. Your client opens it on their phone or laptop and pays by card in a Stripe checkout.",
    bullets: [
      "The payment link is included when your Stripe account is connected.",
      "Stripe's checkout opens in your client's browser language.",
      "Money goes straight to your Stripe account. Payable takes no fee.",
      "The invoice is marked Paid as soon as the payment succeeds.",
    ],
    glow: glow("100% 0%", "var(--chart-2)"),
    visual: <PayAnywhereVisual />,
    className: "md:col-span-2",
    visualClassName: "min-h-100 md:min-h-104",
  },
  {
    title: "Create an invoice in minutes",
    description: "Add a client and your line items. Payable works out VAT and totals and numbers the invoice for you.",
    bullets: [
      "Bill by the hour or a flat amount, with up to 100 lines.",
      "Set the VAT rate per line; subtotal, VAT and total are calculated.",
      "Invoice numbers are assigned automatically, starting again each year.",
      "Save a draft and finish it later, or duplicate a past invoice.",
    ],
    glow: glow("50% 100%", "var(--primary)"),
    visual: <InvoiceEditorVisual />,
    className: "",
    visualClassName: "min-h-96 md:min-h-104",
  },
  {
    title: "Sent by email, with the PDF attached",
    description: "Send the invoice straight from Payable. Your client gets your message, a summary and the PDF.",
    bullets: [
      "Write your own message, or keep the friendly default.",
      "Client replies go to your own email address.",
      "Download any invoice's PDF whenever you need it.",
      "Edited a sent invoice? Payable prompts you to resend it.",
    ],
    glow: glow("0% 100%", "var(--chart-3)"),
    visual: <PdfEmailVisual />,
    className: "",
    visualClassName: "min-h-80",
  },
  {
    title: "Invoice in four currencies",
    description: "Bill clients in euros, dollars, pounds or convertible marks. Amounts are never mixed or converted.",
    bullets: [
      "Choose EUR, USD, GBP or BAM on each invoice.",
      "Set a default currency in your profile.",
      "The dashboard shows one currency at a time, with a switcher.",
      "Card payments work in all four currencies.",
    ],
    glow: glow("100% 100%", "var(--primary)"),
    visual: <CurrenciesVisual />,
    className: "",
    visualClassName: "min-h-80",
  },
  {
    title: "Every client and invoice in one list",
    description: "Save client details once and reuse them. Find any invoice by searching or filtering by status.",
    bullets: [
      "Save clients once and pick them on every invoice.",
      "Filter by Draft, Not paid, Overdue or Paid, and search.",
      "An Overdue badge appears when the due date passes.",
      "See at a glance when each invoice was last sent.",
    ],
    glow: glow("100% 0%", "var(--chart-3)"),
    visual: <InvoiceListVisual />,
    className: "",
    visualClassName: "min-h-80",
  },
] as const

/**
 * Landing page Features section (the header's Features link and the hero pill): headline, then a
 * bento grid of five cards, each with a picture of the app and a detail dialog. Always dark.
 */
export function MarketingFeatures() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="dark scroll-mt-16 border-b bg-background text-foreground [color-scheme:dark]"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-8 md:py-28">
        <Reveal>
          <h2
            id="features-heading"
            className="max-w-3xl font-heading text-3xl leading-[1.1] font-semibold tracking-tight text-balance md:text-4xl"
          >
            Everything you need to bill clients.{" "}
            <span className="text-muted-foreground">
              Create invoices, send them with a PDF, get paid by card and keep track, all in one simple app.
            </span>
          </h2>
        </Reveal>

        {/* Each FeatureCard fades up on its own (same motion as Reveal). */}
        <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ className, ...feature }, index) => (
            <FeatureCard key={feature.title} index={index} className={className} {...feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
