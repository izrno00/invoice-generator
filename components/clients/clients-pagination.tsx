import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"
import type { ReactNode } from "react"

import { clientsListHref, pageItems } from "@/components/clients/list-params"
import { buttonVariants } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"

/** Slightly smaller on phones, so seven items and both arrows fit 360 px. */
const SIZE = "max-sm:size-8"

/** Previous / Next. At the ends it's plain, dimmed text instead of a link. */
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

/** Numbered pages; the search is kept in every link. */
export function ClientsPagination({ q, page, pageCount }: { q: string; page: number; pageCount: number }) {
  if (pageCount <= 1) return null

  return (
    <Pagination>
      <PaginationContent className="flex-wrap justify-center">
        <PaginationItem>
          <Step href={page > 1 ? clientsListHref({ q, page: page - 1 }) : null} label="Go to previous page">
            <CaretLeftIcon />
          </Step>
        </PaginationItem>

        {pageItems(page, pageCount).map((item, index) => (
          <PaginationItem key={item === "gap" ? `gap-${index}` : item}>
            {item === "gap" ? (
              <PaginationEllipsis className={SIZE} />
            ) : (
              <Link
                href={clientsListHref({ q, page: item })}
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
          <Step href={page < pageCount ? clientsListHref({ q, page: page + 1 }) : null} label="Go to next page">
            <CaretRightIcon />
          </Step>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
