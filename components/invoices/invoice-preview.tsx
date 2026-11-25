import type { ReactNode } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { partyLines, type InvoiceDocumentData, type PartyLines } from "@/lib/invoices/document"
import { formatAmount, formatDate, formatMoney, formatQuantity, formatVatRate } from "@/lib/invoices/format"

function Label({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{children}</p>
}

function Party({ label, party }: { label: string; party: PartyLines | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label>{label}</Label>
      {party ? (
        <div className="text-sm wrap-anywhere">
          {party.primary && <p className="font-medium">{party.primary}</p>}
          {party.secondary && <p>{party.secondary}</p>}
          {party.address && <p className="whitespace-pre-line">{party.address}</p>}
          {party.vatId && <p>VAT ID: {party.vatId}</p>}
          {party.email && <p>{party.email}</p>}
          {party.website && <p>{party.website}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Not set</p>
      )}
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <p className="text-sm">{value}</p>
    </div>
  )
}

/**
 * The invoice as it looks on the PDF, as HTML (PRD §6.12 AC1, Tech.md §9):
 * same sections in the same order, so it reads well on phones too.
 */
export function InvoicePreview({ data }: { data: InvoiceDocumentData }) {
  const sender = partyLines(data.sender)
  const hasSender = Object.values(sender).some(Boolean)

  return (
    <Card>
      <CardContent className="flex flex-col gap-8">
        <div className="flex items-end justify-between gap-4">
          <p className="font-heading text-2xl font-bold tracking-wide">INVOICE</p>
          <p className="font-semibold tabular-nums">{data.invoiceNumber}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Party label="From" party={hasSender ? sender : null} />
          <Party label="Bill to" party={data.client && partyLines(data.client)} />
        </div>

        <div className="grid grid-cols-2 gap-4 border-y py-4 sm:grid-cols-4">
          <Meta label="Invoice number" value={data.invoiceNumber} />
          <Meta label="Invoice date" value={formatDate(data.invoiceDate)} />
          <Meta label="Due date" value={formatDate(data.dueDate)} />
          <Meta label="Currency" value={data.currency} />
        </div>

        {data.lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">No line items yet.</p>
        ) : (
          <div>
            {/* A table from `sm` up; each line stacks below that. */}
            <table className="w-full text-sm max-sm:hidden">
              <thead>
                <tr className="border-b border-foreground text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="pb-2 text-left font-medium">Description</th>
                  <th className="pb-2 text-right font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Price</th>
                  <th className="pb-2 text-right font-medium">VAT %</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((line, index) => (
                  <tr key={index} className="border-b align-top">
                    <td className="py-2 pr-4 wrap-anywhere">{line.description || "—"}</td>
                    <td className="py-2 text-right whitespace-nowrap">{formatQuantity(line.quantity, line.unit)}</td>
                    <td className="py-2 pl-4 text-right tabular-nums">{formatAmount(line.unitPriceCents)}</td>
                    <td className="py-2 pl-4 text-right tabular-nums">{formatVatRate(line.vatRateBp)}</td>
                    <td className="py-2 pl-4 text-right tabular-nums">{formatAmount(line.netCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="flex flex-col divide-y border-y sm:hidden">
              {data.lines.map((line, index) => (
                <li key={index} className="flex flex-col gap-1 py-3 text-sm">
                  <p className="wrap-anywhere">{line.description || "—"}</p>
                  <p className="flex justify-between gap-4 text-muted-foreground">
                    <span>
                      {formatQuantity(line.quantity, line.unit)} × {formatAmount(line.unitPriceCents)} · VAT{" "}
                      {formatVatRate(line.vatRateBp)}
                    </span>
                    <span className="text-foreground tabular-nums">{formatAmount(line.netCents)}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <dl className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatMoney(data.subtotalCents, data.currency)}</dd>
          </div>
          {data.vatBreakdown.map((row) => (
            <div key={row.rateBp} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">VAT {formatVatRate(row.rateBp)}</dt>
              <dd className="tabular-nums">{formatMoney(row.vatCents, data.currency)}</dd>
            </div>
          ))}
          <Separator className="my-1 bg-foreground" />
          <div className="flex justify-between gap-4 text-base font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatMoney(data.totalCents, data.currency)}</dd>
          </div>
        </dl>

        {data.comments && (
          <div className="flex flex-col gap-1">
            <Label>Comments</Label>
            <p className="text-sm whitespace-pre-line wrap-anywhere">{data.comments}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
