"use client"

import { FilePdfIcon, InfoIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useId, useRef, useState, useTransition, type ComponentProps } from "react"
import { toast } from "sonner"

import { sendInvoice, type SendInvoiceResult } from "@/app/(app)/invoices/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { SendDetails } from "@/lib/dal/invoices"
import { isNavigationError } from "@/lib/is-navigation-error"
import { INVOICE_LIMITS } from "@/lib/validation/invoice"

const SEND_FAILED = "We couldn't send the email. Please try again."

/** No online payments until Stripe Connect ships (Milestone 7), so this is always the note (PRD §6.3 AC5). */
const NO_PAYMENT_LINK = "No payment link will be included. Connect Stripe to let clients pay online."

/** Send / Resend confirmation (PRD §6.7). Nothing is sent until the user clicks Send. */
export function SendDialog({
  details,
  open,
  onOpenChange,
  finalFocus,
}: {
  details: SendDetails
  open: boolean
  onOpenChange: (open: boolean) => void
  finalFocus?: ComponentProps<typeof DialogContent>["finalFocus"]
}) {
  const router = useRouter()
  const id = useId()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState(details.defaultMessage)
  const [error, setError] = useState<string | null>(null)
  /**
   * One id per attempt, reused by Retry, so a double click or a retry after a
   * lost response can't send the same email twice (Tech.md §10.1). Editing the
   * message starts a new attempt.
   */
  const attemptId = useRef<string | null>(null)

  // Each time the dialog opens, start from the default message.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setMessage(details.defaultMessage)
      setError(null)
    }
  }

  function changeOpen(next: boolean) {
    if (pending) return
    if (next) attemptId.current = null
    onOpenChange(next)
  }

  function send() {
    attemptId.current ??= crypto.randomUUID()
    const attempt = attemptId.current

    startTransition(async () => {
      let result: SendInvoiceResult
      try {
        result = await sendInvoice({ invoiceId: details.invoiceId, message, attemptId: attempt })
      } catch (caught) {
        if (!isNavigationError(caught)) setError(SEND_FAILED)
        return
      }

      if (result.ok) {
        attemptId.current = null
        onOpenChange(false)
        toast.success(`Invoice sent to ${result.to}`)
        return
      }
      if (result.needsEdit) {
        onOpenChange(false)
        router.push(`/invoices/${details.invoiceId}/edit?finalize=1`)
        return
      }
      setError(result.message)
    })
  }

  const action = details.resend ? "Resend" : "Send"

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        finalFocus={finalFocus}
        className="max-h-svh max-w-full overflow-y-auto max-sm:rounded-none sm:max-h-[calc(100svh-2rem)] sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>
            {action} invoice {details.invoiceNumber}
          </DialogTitle>
          <DialogDescription>Check the email before it goes to your client.</DialogDescription>
        </DialogHeader>

        <FieldGroup className="gap-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">To</dt>
            <dd className="min-w-0 wrap-anywhere">{details.to}</dd>
            <dt className="text-muted-foreground">Subject</dt>
            <dd className="min-w-0 wrap-anywhere">{details.subject}</dd>
            <dt className="text-muted-foreground">Attachment</dt>
            <dd className="flex min-w-0 items-center gap-1.5 wrap-anywhere">
              <FilePdfIcon className="shrink-0 text-muted-foreground" />
              {details.fileName}
            </dd>
          </dl>

          <Field>
            <FieldLabel htmlFor={`${id}-message`}>Message</FieldLabel>
            <Textarea
              id={`${id}-message`}
              value={message}
              maxLength={INVOICE_LIMITS.message}
              rows={6}
              disabled={pending}
              onChange={(event) => {
                setMessage(event.target.value)
                attemptId.current = null
              }}
            />
            <FieldDescription>Your client can reply to this email; replies go to your profile email.</FieldDescription>
          </Field>

          <p className="flex gap-2 text-sm text-muted-foreground">
            <InfoIcon className="mt-0.5 shrink-0" />
            {NO_PAYMENT_LINK}
          </p>

          {error && (
            <Alert variant="destructive" aria-live="polite">
              <WarningCircleIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => changeOpen(false)}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={send}>
            {pending && <Spinner />}
            {error ? "Retry" : action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
