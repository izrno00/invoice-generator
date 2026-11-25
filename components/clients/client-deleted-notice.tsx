"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

/**
 * Shows "Client deleted" after a delete on a client's page redirected here
 * with `?deleted=<id>`, then drops the parameter from the URL.
 */
export function ClientDeletedNotice() {
  const deletedId = useSearchParams().get("deleted")

  useEffect(() => {
    if (!deletedId) return
    // The id keeps it to one toast if the effect runs twice.
    toast.success("Client deleted", { id: `client-deleted-${deletedId}` })

    const url = new URL(window.location.href)
    url.searchParams.delete("deleted")
    window.history.replaceState(null, "", url)
  }, [deletedId])

  return null
}
