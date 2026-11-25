import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

/** Also covers `/edit`. Same page for a missing invoice and someone else's (PRD §9). */
export default function InvoiceNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 md:px-10 md:py-10">
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Invoice not found</EmptyTitle>
          <EmptyDescription>It doesn&apos;t exist, or it has been deleted.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/invoices" className={buttonVariants()}>
            Back to invoices
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}
