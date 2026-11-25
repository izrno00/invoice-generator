"use client"

import { WarningCircleIcon } from "@phosphor-icons/react"
import { useEffect, useId, useState, useTransition, type ComponentProps } from "react"
import { toast } from "sonner"

import {
  deleteClientAction,
  getClientDeleteSummaryAction,
  type DeleteClientResult,
  type DeleteSummaryResult,
} from "@/app/(app)/clients/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { isNavigationError } from "@/lib/is-navigation-error"

type DeleteClientDialogProps = {
  clientId: string
  clientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Go to the clients list afterwards (on the client's own page). */
  returnToList?: boolean
  /** Where focus goes when the dialog closes. */
  finalFocus?: ComponentProps<typeof AlertDialogContent>["finalFocus"]
}

/** Confirmation for deleting a client (PRD §6.4 AC6). */
export function DeleteClientDialog({
  clientId,
  clientName,
  open,
  onOpenChange,
  returnToList = false,
  finalFocus,
}: DeleteClientDialogProps) {
  const [pending, startTransition] = useTransition()

  function confirmDelete(deleteUnpaid: boolean) {
    startTransition(async () => {
      let result: DeleteClientResult
      try {
        result = await deleteClientAction({ id: clientId, deleteUnpaid, returnToList })
      } catch (error) {
        // With `returnToList`, success arrives as a redirect.
        if (!isNavigationError(error)) {
          toast.error("Couldn't delete the client. Check your connection and try again.")
        }
        return
      }

      if (!result.ok) {
        toast.error(result.message)
        return
      }
      onOpenChange(false)
      toast.success("Client deleted")
    })
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!pending) onOpenChange(next)
      }}
    >
      <AlertDialogContent finalFocus={finalFocus}>
        {/* Mounted with the popup, so it starts fresh every time the dialog opens. */}
        <DeleteClientConfirmation
          clientId={clientId}
          clientName={clientName}
          pending={pending}
          onConfirm={confirmDelete}
        />
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DeleteClientConfirmation({
  clientId,
  clientName,
  pending,
  onConfirm,
}: {
  clientId: string
  clientName: string
  pending: boolean
  onConfirm: (deleteUnpaid: boolean) => void
}) {
  const checkboxId = useId()
  const [loaded, setLoaded] = useState<DeleteSummaryResult | null>(null)
  const [deleteUnpaid, setDeleteUnpaid] = useState(false)

  useEffect(() => {
    let active = true
    getClientDeleteSummaryAction(clientId).then(
      (result) => {
        if (active) setLoaded(result)
      },
      (error) => {
        if (active && !isNavigationError(error)) {
          setLoaded({ ok: false, message: "Couldn't check this client's invoices. Check your connection." })
        }
      }
    )
    return () => {
      active = false
    }
  }, [clientId])

  const summary = loaded?.ok ? loaded.summary : null
  const unpaid = summary?.unpaidCount ?? 0
  const sent = summary?.sentUnpaidCount ?? 0

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle className="wrap-anywhere">Delete {clientName}?</AlertDialogTitle>
        <AlertDialogDescription>
          The client will be removed from your list. Paid invoices are kept, with the client&apos;s details as they
          appear on those invoices.
        </AlertDialogDescription>
      </AlertDialogHeader>

      {/*
        No visible placeholder: the check is quick and usually adds nothing, so one
        would only flash and make the dialog jump. Delete stays disabled meanwhile.
      */}
      {!loaded && (
        <span role="status" className="sr-only">
          Checking this client&apos;s invoices
        </span>
      )}

      {loaded && !loaded.ok && (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertDescription>{loaded.message}</AlertDescription>
        </Alert>
      )}

      {unpaid > 0 && (
        <Field orientation="horizontal">
          <Checkbox
            id={checkboxId}
            checked={deleteUnpaid}
            onCheckedChange={setDeleteUnpaid}
            disabled={pending}
          />
          <FieldContent>
            <FieldLabel htmlFor={checkboxId}>
              Also delete {unpaid} unpaid {unpaid === 1 ? "invoice" : "invoices"} for this client?
            </FieldLabel>
            <FieldDescription>Unpaid invoices you keep can still be edited and sent.</FieldDescription>
          </FieldContent>
        </Field>
      )}

      {sent > 0 && (
        <Alert>
          <WarningCircleIcon />
          <AlertDescription>
            {sent} of them {sent === 1 ? "was" : "were"} already sent. If you delete them, their payment links will
            stop working.
          </AlertDescription>
        </Alert>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
        <AlertDialogAction variant="destructive" disabled={!summary || pending} onClick={() => onConfirm(deleteUnpaid)}>
          {pending && <Spinner />}
          Delete
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
