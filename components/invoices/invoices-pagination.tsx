import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"
import type { ReactNode } from "react"

import { pageItems } from "@/components/clients/list-params"
import { invoicesListHref, showingLabel, type InvoiceListParams } from "@/components/invoices/list-params"
import { buttonVariants } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

/** Slightly smaller on phones, so seven items and both arrows fit 360 px. */
const SIZE = "max-sm:size-8"

function Step({ href, label, children }: { href: string | null; label: string; children: ReactNode }) {
  const className = cn(buttonVariants({ variant: "ghost", size: "icon" }), SIZE)

  return href ? (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  ) : (
    <span aria-disabled="true" aria-label={label} role="link" className={cn(className, "opacity-50")}>
      {children}
    </span>
  )
}

/**
 * "Showing 1–20 of 57" and page links that keep the filters (PRD §6.11 AC2).
 * `base` is the page the list is on (the invoices list, or a client's page).
 */
export function InvoicesPagination({
  params,
  pageCount,
  total,
  pageSize,
  base = "/invoices",
}: {
  params: Partial<InvoiceListParams> & { page: number }
  pageCount: number
  total: number
  pageSize: number
  base?: string
}) {
  const { page } = params
  const href = (target: number) => invoicesListHref({ ...params, page: target }, base)

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {showingLabel(page, pageSize, total)}
      </p>
      {pageCount > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent className="flex-wrap justify-center">
            <PaginationItem>
              <Step href={page > 1 ? href(page - 1) : null} label="Go to previous page">
                <CaretLeftIcon />
              </Step>
            </PaginationItem>
            {pageItems(page, pageCount).map((item, index) => (
              <PaginationItem key={item === "gap" ? `gap-${index}` : item}>
                {item === "gap" ? (
                  <PaginationEllipsis className={SIZE} />
                ) : (
                  <Link
                    href={href(item)}
                    aria-label={`Page ${item}`}
                    aria-current={item === page ? "page" : undefined}
                    className={cn(buttonVariants({ variant: item === page ? "outline" : "ghost", size: "icon" }), SIZE)}
                  >
                    {item}
                  </Link>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <Step href={page < pageCount ? href(page + 1) : null} label="Go to next page">
                <CaretRightIcon />
              </Step>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
