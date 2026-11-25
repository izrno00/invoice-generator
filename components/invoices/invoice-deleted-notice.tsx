"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

/**
 * Shows "Invoice deleted" after a delete on an invoice's page redirected here
 * with `?deleted=1`, then drops the parameter from the URL.
 */
export function InvoiceDeletedNotice() {
  const deleted = useSearchParams().get("deleted") === "1"

  useEffect(() => {
    if (!deleted) return
    // A fixed id keeps it to one toast if the effect runs twice.
    toast.success("Invoice deleted", { id: "invoice-deleted" })

    const url = new URL(window.location.href)
    url.searchParams.delete("deleted")
    window.history.replaceState(null, "", url)
  }, [deleted])

  return null
}
