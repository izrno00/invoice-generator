"use client"

import { WarningCircleIcon } from "@phosphor-icons/react"
import { useTransition, type ComponentProps } from "react"
import { toast } from "sonner"

import { deleteInvoice, markInvoicePaidAction, type InvoiceActionResult } from "@/app/(app)/invoices/actions"
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
import { Spinner } from "@/components/ui/spinner"
import { isNavigationError } from "@/lib/is-navigation-error"

type ConfirmProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  finalFocus?: ComponentProps<typeof AlertDialogContent>["finalFocus"]
}

/** Runs a confirmed action; the dialog stays open (and blocks closing) while it runs. */
function useConfirmAction(onOpenChange: (open: boolean) => void) {
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<InvoiceActionResult>, { success, failure }: { success: string; failure: string }) {
    startTransition(async () => {
      let result: InvoiceActionResult
      try {
        result = await action()
      } catch (error) {
        // A redirect (e.g. back to the list after deleting) is success too.
        if (!isNavigationError(error)) toast.error(failure)
        return
      }
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      onOpenChange(false)
      toast.success(success)
    })
  }

  return {
    pending,
    run,
    changeOpen: (next: boolean) => {
      if (!pending) onOpenChange(next)
    },
  }
}

/** PRD §6.10 AC2. Irreversible. */
export function MarkPaidDialog({
  invoiceId,
  invoiceNumber,
  open,
  onOpenChange,
  finalFocus,
}: ConfirmProps & { invoiceId: string; invoiceNumber: string }) {
  const { pending, run, changeOpen } = useConfirmAction(onOpenChange)

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogContent finalFocus={finalFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Mark invoice {invoiceNumber} as paid?</AlertDialogTitle>
          <AlertDialogDescription>
            This can&apos;t be undone. The invoice will be locked and the client&apos;s payment link will stop accepting
            payments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={() =>
              run(() => markInvoicePaidAction(invoiceId), {
                success: `Invoice ${invoiceNumber} marked as paid`,
                failure: "Couldn't mark the invoice as paid. Check your connection and try again.",
              })
            }
          >
            {pending && <Spinner />}
            Mark as paid
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** PRD §6.14. */
export function DeleteInvoiceDialog({
  invoiceId,
  invoiceNumber,
  sentTo,
  returnToList = false,
  open,
  onOpenChange,
  finalFocus,
}: ConfirmProps & {
  invoiceId: string
  invoiceNumber: string
  /** The client's email when the invoice was already sent. */
  sentTo: string | null
  /** Go to the invoices list afterwards (on the invoice's own page). */
  returnToList?: boolean
}) {
  const { pending, run, changeOpen } = useConfirmAction(onOpenChange)

  return (
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <AlertDialogContent finalFocus={finalFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete invoice {invoiceNumber}?</AlertDialogTitle>
          <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        {sentTo && (
          <Alert>
            <WarningCircleIcon />
            <AlertDescription className="wrap-anywhere">
              This invoice was already sent to {sentTo}. Their payment link will stop working.
            </AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() =>
              run(() => deleteInvoice({ id: invoiceId, returnToList }), {
                success: `Invoice ${invoiceNumber} deleted`,
                failure: "Couldn't delete the invoice. Check your connection and try again.",
              })
            }
          >
            {pending && <Spinner />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** After saving changes to a sent invoice (PRD §6.8). Nothing is sent from here. */
export function ResendPrompt({
  sentTo,
  open,
  onOpenChange,
  onResend,
}: {
  sentTo: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onResend: () => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send the updated invoice?</AlertDialogTitle>
          <AlertDialogDescription className="wrap-anywhere">
            This invoice was already sent to {sentTo}. Do you want to send the updated invoice?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not now</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onOpenChange(false)
              onResend()
            }}
          >
            Resend
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
