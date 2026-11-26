import { CreditCardIcon, FilePdfIcon, LockSimpleIcon, MagnifyingGlassIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react/ssr"

import { StatusBadge } from "@/components/invoices/status-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { formatMoney } from "@/lib/invoices/format"
import { cn } from "@/lib/utils"

/*
 * Static pictures of the app for the Features cards. Same freelancer as the hero's dashboard window
 * (Alex Morgan, EUR). They're decorative: the card that holds them is aria-hidden and inert.
 */

const SENDER = "Alex Morgan"

/** A browser window frame. */
function BrowserFrame({ address, className, children }: { address: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-xl bg-background shadow-2xl ring-1 ring-foreground/10", className)}>
      <div className="flex h-9 shrink-0 items-center gap-3 border-b px-3">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-muted" />
          <span className="size-2.5 rounded-full bg-muted" />
          <span className="size-2.5 rounded-full bg-muted" />
        </span>
        <span className="mx-auto flex h-5 w-1/2 items-center justify-center gap-1 rounded-md bg-muted/60 text-[10px] text-muted-foreground">
          <LockSimpleIcon className="size-2.5" />
          {address}
        </span>
      </div>
      {children}
    </div>
  )
}

/** Wide card: the client pays on a phone, next to the invoice email on a desktop. */
export function PayAnywhereVisual() {
  return (
    <div className="absolute inset-0">
      <BrowserFrame address="mail.example.com" className="absolute top-4 -right-16 -bottom-12 left-32 sm:left-52">
        <div className="flex flex-col gap-4 p-5 pl-10 sm:pl-24 text-xs">
          <div className="flex flex-col gap-1 border-b pb-4">
            <p className="font-heading text-sm font-medium">Invoice 2026-041 from {SENDER}</p>
            <p className="text-muted-foreground">{SENDER} via Payable</p>
          </div>
          <p className="max-w-80 leading-relaxed text-muted-foreground">
            Hi Northwind Studio, please find attached invoice 2026-041 for {formatMoney(1_250_00, "EUR")}, due on 26
            Nov 2026. Thank you!
          </p>
          <dl className="grid max-w-64 grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 rounded-lg bg-muted/50 p-3">
            <dt className="text-muted-foreground">Invoice</dt>
            <dd className="text-right tabular-nums">2026-041</dd>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="text-right tabular-nums">{formatMoney(1_250_00, "EUR")}</dd>
            <dt className="text-muted-foreground">Due date</dt>
            <dd className="text-right tabular-nums">26 Nov 2026</dd>
          </dl>
          <span className={cn(buttonVariants({ size: "sm" }), "w-fit")}>Pay invoice</span>
          <span className="flex w-fit items-center gap-2 rounded-lg border px-2.5 py-2">
            <FilePdfIcon className="size-4 text-destructive" />
            Invoice-2026-041.pdf
          </span>
        </div>
      </BrowserFrame>

      {/* The phone: the client's pay page. */}
      <div className="absolute -bottom-10 left-4 w-48 rounded-[2.25rem] bg-muted p-1.5 shadow-2xl ring-1 ring-foreground/15 sm:left-8 sm:w-56">
        <div className="flex h-[21rem] flex-col rounded-[1.9rem] bg-background px-4 pt-3 pb-6 text-xs sm:h-[23rem]">
          <span className="mx-auto h-4 w-16 rounded-full bg-muted" />
          <p className="mt-6 text-muted-foreground">{SENDER}</p>
          <p className="mt-1 font-heading text-base font-medium tabular-nums">Invoice 2026-041</p>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 whitespace-nowrap">
            <dt className="text-muted-foreground">Invoice date</dt>
            <dd className="text-right tabular-nums">12 Nov 2026</dd>
            <dt className="text-muted-foreground">Due date</dt>
            <dd className="text-right tabular-nums">26 Nov 2026</dd>
          </dl>
          <div className="mt-4 flex flex-col gap-0.5 border-t pt-3">
            <span className="text-muted-foreground">Amount due</span>
            <span className="font-heading text-xl font-semibold tabular-nums">{formatMoney(1_250_00, "EUR")}</span>
          </div>
          <span className={cn(buttonVariants(), "mt-5 w-full")}>
            <CreditCardIcon data-icon="inline-start" />
            Pay now
          </span>
          <p className="mt-2.5 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <LockSimpleIcon className="size-3" />
            Secure payment by Stripe
          </p>
        </div>
      </div>
    </div>
  )
}

const LINES = [
  { name: "Website redesign", meta: "24 h × 45.00 · VAT 25%", cents: 1_080_00 },
  { name: "Hosting setup", meta: "Flat · VAT 25%", cents: 150_00 },
] as const

/** Narrow card: an invoice draft with line items, VAT and totals. */
export function InvoiceEditorVisual() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-3 px-6 text-xs">
      <div className="flex flex-col gap-4 rounded-xl bg-background p-4 shadow-2xl ring-1 ring-foreground/10">
        <div className="flex items-center justify-between gap-3">
          <span className="font-heading text-sm font-medium tabular-nums">2026-043</span>
          <Badge variant="outline">Draft</Badge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">Client</span>
          <span className="flex h-8 items-center rounded-md border px-2.5 font-medium">Lumen Labs</span>
        </div>
        <ul className="flex flex-col">
          {LINES.map((line) => (
            <li key={line.name} className="flex items-start justify-between gap-3 border-t py-2.5">
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">{line.name}</span>
                <span className="text-muted-foreground tabular-nums">{line.meta}</span>
              </span>
              <span className="tabular-nums">{formatMoney(line.cents, "EUR")}</span>
            </li>
          ))}
        </ul>
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 rounded-xl bg-background p-4 shadow-2xl ring-1 ring-foreground/10">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="text-right tabular-nums">{formatMoney(1_230_00, "EUR")}</dd>
        <dt className="text-muted-foreground">VAT 25%</dt>
        <dd className="text-right tabular-nums">{formatMoney(307_50, "EUR")}</dd>
        <dt className="mt-1.5 border-t pt-2.5 font-medium">Total</dt>
        <dd className="mt-1.5 border-t pt-2.5 text-right font-heading text-sm font-semibold tabular-nums">
          {formatMoney(1_537_50, "EUR")}
        </dd>
      </dl>
    </div>
  )
}

/** PDF + email: the invoice PDF (always light, like the real one) and the sent notice. */
export function PdfEmailVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative mt-4 aspect-[1/1.414] w-40 -rotate-3 rounded-md bg-foreground p-4 text-background shadow-2xl">
        <div className="flex items-start justify-between">
          <span className="text-[9px] font-semibold tracking-widest uppercase">Invoice</span>
          <span className="text-[8px] tabular-nums opacity-70">2026-041</span>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <span className="h-1 w-14 rounded-full bg-background/50" />
          <span className="h-1 w-10 rounded-full bg-background/25" />
        </div>
        <div className="mt-4 flex flex-col gap-1.5">
          {[24, 20, 22].map((width, index) => (
            <span key={index} className="flex justify-between">
              <span className="h-1 rounded-full bg-background/25" style={{ width: `${width * 3}px` }} />
              <span className="h-1 w-5 rounded-full bg-background/25" />
            </span>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t border-background/15 pt-2">
          <span className="text-[8px] opacity-70">Total</span>
          <span className="text-[8px] font-semibold tabular-nums">EUR 1,250.00</span>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 flex w-64 -translate-x-1/2 items-center gap-2.5 rounded-xl bg-background p-3 text-xs shadow-2xl ring-1 ring-foreground/10">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <PaperPlaneTiltIcon className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-medium">Invoice sent</span>
          <span className="truncate text-muted-foreground">billing@northwind.example</span>
        </span>
      </div>
    </div>
  )
}

/** Paid per month for the last 12 months (same numbers as the hero's chart). */
const PAID_SERIES = [2_480, 3_150, 2_760, 3_920, 3_410, 4_380, 3_640, 4_920, 4_270, 5_480, 5_010, 6_240]
const PAID_MAX = Math.max(...PAID_SERIES)

/** Four currencies: the dashboard's currency switcher over a paid-per-month chart. */
export function CurrenciesVisual() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-4 px-6 text-xs">
      <div className="flex w-fit gap-0.5 rounded-lg bg-background p-0.5 shadow-xl ring-1 ring-foreground/10">
        {["EUR", "USD", "GBP", "BAM"].map((currency, index) => (
          <span
            key={currency}
            className={cn(
              "rounded-md px-2.5 py-1 font-medium text-muted-foreground",
              index === 0 && "bg-muted text-foreground"
            )}
          >
            {currency}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-xl bg-background p-4 shadow-2xl ring-1 ring-foreground/10">
        <span className="flex flex-col gap-0.5">
          <span className="text-muted-foreground">Paid this month</span>
          <span className="font-heading text-base font-semibold tabular-nums">{formatMoney(6_240_00, "EUR")}</span>
        </span>
        <div className="flex h-20 items-end gap-1">
          {PAID_SERIES.map((value, index) => (
            <span
              key={index}
              className={cn("flex-1 rounded-t-sm bg-chart-2/70", index === PAID_SERIES.length - 1 && "bg-primary")}
              style={{ height: `${(value / PAID_MAX) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const INVOICES = [
  { client: "Lumen Labs", number: "2026-043", status: "draft", overdue: false },
  { client: "Northwind Studio", number: "2026-041", status: "unpaid", overdue: false },
  { client: "Okafor & Co.", number: "2026-036", status: "unpaid", overdue: true },
  { client: "Brightline Media", number: "2026-035", status: "paid", overdue: false },
] as const

/** "Okafor & Co." → "OC": first letters of the words that start with a letter. */
function initials(name: string) {
  return name
    .split(" ")
    .filter((word) => /^[a-z]/i.test(word))
    .map((word) => word[0].toUpperCase())
    .join("")
    .slice(0, 2)
}

/** Clients & invoice list: search and rows with status badges. */
export function InvoiceListVisual() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-2.5 px-6 text-xs">
      <span className="flex h-8 items-center gap-2 rounded-md bg-background px-2.5 text-muted-foreground shadow-xl ring-1 ring-foreground/10">
        <MagnifyingGlassIcon className="size-3.5" />
        Search invoices
      </span>
      <ul className="flex flex-col rounded-xl bg-background px-3 shadow-2xl ring-1 ring-foreground/10">
        {INVOICES.map((invoice) => (
          <li key={invoice.number} className="flex items-center gap-2.5 border-b py-2.5 last:border-0">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
              {initials(invoice.client)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{invoice.client}</span>
              <span className="text-muted-foreground tabular-nums">{invoice.number}</span>
            </span>
            <StatusBadge status={invoice.status} overdue={invoice.overdue} />
          </li>
        ))}
      </ul>
    </div>
  )
}
