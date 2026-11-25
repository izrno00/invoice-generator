"use client"

import { useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { DuplicateClient } from "@/lib/dal/clients"
import type { DuplicateMatch } from "@/lib/validation/client"

const MATCH_LABELS: Record<DuplicateMatch, string> = {
  email: "email",
  company: "company name",
  name: "full name",
}

const listFormat = new Intl.ListFormat("en-GB", { type: "conjunction" })

/** A warning, not a block: the user can still save (open while `duplicates` is set). */
export function DuplicateClientDialog({
  duplicates,
  onCancel,
  onConfirm,
}: {
  duplicates: DuplicateClient[] | null
  onCancel: () => void
  onConfirm: () => void
}) {
  // Keeps the list on screen while the dialog animates out.
  const [shown, setShown] = useState(duplicates)
  if (duplicates && duplicates !== shown) setShown(duplicates)

  return (
    <AlertDialog
      open={duplicates !== null}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>A similar client already exists</AlertDialogTitle>
          <AlertDialogDescription>Check that you aren&apos;t adding the same client twice.</AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="flex max-h-56 flex-col gap-2 overflow-y-auto">
          {shown?.map((client) => (
            <li key={client.id} className="rounded-md border px-3 py-2 text-sm">
              <p className="font-medium wrap-break-word">{client.displayName}</p>
              <p className="text-muted-foreground">
                Same {listFormat.format(client.matchedOn.map((match) => MATCH_LABELS[match]))}
              </p>
            </li>
          ))}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel>Go back</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Save anyway</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
