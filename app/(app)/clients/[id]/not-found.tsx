import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"

/** Also covers `/edit`. Same page for a missing client and someone else's (PRD §9). */
export default function ClientNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 md:px-10 md:py-10">
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Client not found</EmptyTitle>
          <EmptyDescription>It doesn&apos;t exist, or it has been deleted.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/clients" className={buttonVariants()}>
            Back to clients
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}
