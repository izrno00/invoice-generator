import { Reveal } from "@/components/marketing/reveal"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

/** Every answer describes v1 as the PRD defines it; nothing here promises a feature that doesn't exist. */
const QUESTIONS = [
  {
    question: "Can I use Payable for free?",
    answer:
      "Yes. The Free plan lets you create 5 invoices a month with every feature included, and you don't need a card to sign up. Plus ($10/month) raises that to 50 invoices, and Pro ($20/month) has no limit.",
  },
  {
    question: "Does Payable take a cut of my payments?",
    answer:
      "No. Card payments go straight into your own Stripe account and Payable takes no fee. Stripe charges its usual processing fees, which you pay through your Stripe account.",
  },
  {
    question: "Do I need a Stripe account?",
    answer:
      "Only to get paid by card. You can create and send invoices without Stripe; they just won't include a payment link. When you're ready, connect Stripe from Settings → Payments and follow Stripe's own setup.",
  },
  {
    question: "How do my clients pay?",
    answer:
      "The invoice email includes a Pay invoice button. It opens a secure pay page with a short summary of the invoice, and Pay now takes your client to Stripe's card checkout. Card is the only online payment method; if a client pays another way, mark the invoice as paid yourself.",
  },
  {
    question: "Do my clients need a Payable account?",
    answer:
      "No. Clients never sign in. They get an email with your message, the invoice PDF attached and, if you've connected Stripe, a link to pay by card.",
  },
  {
    question: "What happens when a client pays?",
    answer:
      "The invoice is marked Paid automatically as soon as Stripe confirms the payment, and your dashboard updates. Paid invoices are locked, so they can't be edited or deleted by accident.",
  },
  {
    question: "Can I edit an invoice after sending it?",
    answer:
      "Yes, as long as it isn't paid yet. After you save your changes, Payable offers to resend the invoice so your client gets the updated PDF.",
  },
  {
    question: "Which currencies can I invoice in?",
    answer:
      "EUR, USD, GBP and BAM. Each invoice uses one currency, and amounts are never converted. Your dashboard shows one currency at a time, with a switcher when you use more than one.",
  },
  {
    question: "How does Payable handle VAT?",
    answer:
      "You set a VAT rate on each line item. Payable works out the VAT per line, lists it per rate on the invoice and adds it to the total. You can also add your VAT ID to your profile and your clients' details.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Every account only ever sees its own clients and invoices, and that's enforced on the server and in the database, not just hidden in the app. Invoice PDFs are private to you, and pay page links can't be guessed.",
  },
] as const

/**
 * Landing page FAQ (the header's FAQ link, last in the nav): a heading and an accordion of common
 * questions. Always dark, like the sections above it.
 */
export function MarketingFaq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="dark scroll-mt-16 border-b bg-background text-foreground [color-scheme:dark]"
    >
      {/* A narrower column, centred on the page; heading and list share its left edge. */}
      <div className="mx-auto w-full max-w-3xl px-4 py-20 md:px-8 md:py-28">
        <Reveal>
          <h2
            id="faq-heading"
            className="font-heading text-3xl leading-[1.1] font-semibold tracking-tight text-balance md:text-4xl"
          >
            Frequently asked questions
          </h2>
        </Reveal>

        <Reveal className="mt-10 md:mt-12">
          <Accordion>
            {QUESTIONS.map(({ question, answer }) => (
              <AccordionItem key={question} value={question} className="border-b">
                <AccordionTrigger className="items-center py-5 text-base hover:no-underline hover:text-muted-foreground">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="pr-8 pb-5 text-base text-pretty text-muted-foreground">
                  <p>{answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  )
}
