"use client"

import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { useLayoutEffect, useState } from "react"

import { DeleteClientDialog } from "@/components/clients/delete-client-dialog"
import { Button, buttonVariants } from "@/components/ui/button"

/** Edit and Delete on a client's page. */
export function ClientDetailActions({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Next.js hides pages instead of unmounting them: don't come back to an open dialog.
  useLayoutEffect(() => () => setDeleteOpen(false), [])

  return (
    <div className="flex shrink-0 gap-2">
      <Link href={`/clients/${clientId}/edit`} className={buttonVariants({ variant: "outline" })}>
        <PencilSimpleIcon data-icon="inline-start" />
        Edit
      </Link>
      <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
        <TrashIcon data-icon="inline-start" />
        Delete
      </Button>
      <DeleteClientDialog
        clientId={clientId}
        clientName={clientName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        returnToList
      />
    </div>
  )
}
