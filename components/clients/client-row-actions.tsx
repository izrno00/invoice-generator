"use client"

import { DotsThreeIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { useLayoutEffect, useRef, useState } from "react"

import { DeleteClientDialog } from "@/components/clients/delete-client-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/** The ⋯ menu of a client in the list: Edit, Delete. Viewing is a click on the row, card or name. */
export function ClientRowActions({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Next.js hides pages instead of unmounting them: don't come back to an open menu.
  useLayoutEffect(
    () => () => {
      setMenuOpen(false)
      setDeleteOpen(false)
    },
    []
  )

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={<Button ref={triggerRef} variant="ghost" size="icon-sm" aria-label={`Actions for ${clientName}`} />}
        >
          <DotsThreeIcon weight="bold" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem render={<Link href={`/clients/${clientId}/edit`} />}>Edit</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteClientDialog
        clientId={clientId}
        clientName={clientName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        finalFocus={triggerRef}
      />
    </>
  )
}
