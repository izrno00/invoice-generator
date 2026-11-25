"use client"

import {
  CheckCircleIcon,
  CopyIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useLayoutEffect, useRef, useState, useTransition, type RefObject } from "react"
import { toast } from "sonner"

import { duplicateInvoice, type InvoiceActionResult } from "@/app/(app)/invoices/actions"
import { DeleteInvoiceDialog, MarkPaidDialog, ResendPrompt } from "@/components/invoices/confirm-dialogs"
import { SendDialog } from "@/components/invoices/send-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import type { InvoiceSummary } from "@/lib/dal/invoices"
import { localToday } from "@/lib/invoices/dates"
import { isNavigationError } from "@/lib/is-navigation-error"

type OpenDialog = "send" | "delete" | "markPaid" | null

function editHref(invoice: InvoiceSummary) {
  return `/invoices/${invoice.id}/edit`
}

/** Where "Send" goes for a draft that isn't finished: the form, with its errors shown (PRD §6.7). */
function finishHref(invoice: InvoiceSummary) {
  return `${editHref(invoice)}?finalize=1`
}

function pdfHref(invoice: InvoiceSummary) {
  return `/invoices/${invoice.id}/pdf`
}

/** Dialog state and Duplicate, shared by the list menu and the details page. */
function useInvoiceActions(invoice: InvoiceSummary) {
  const [dialog, setDialog] = useState<OpenDialog>(null)
  const [duplicating, startDuplicate] = useTransition()

  // Next.js hides pages instead of unmounting them: don't come back to an open dialog.
  useLayoutEffect(() => () => setDialog(null), [])

  function duplicate() {
    startDuplicate(async () => {
      let result: InvoiceActionResult
      try {
        // Success redirects to the copy's edit form.
        result = await duplicateInvoice({ id: invoice.id, today: localToday() })
      } catch (error) {
        if (!isNavigationError(error)) toast.error("Couldn't duplicate the invoice. Check your connection and try again.")
        return
      }
      if (!result.ok) toast.error(result.message)
    })
  }

  return { dialog, setDialog, duplicating, duplicate }
}

function InvoiceDialogs({
  invoice,
  dialog,
  setDialog,
  returnToList = false,
  finalFocus,
}: {
  invoice: InvoiceSummary
  dialog: OpenDialog
  setDialog: (dialog: OpenDialog) => void
  returnToList?: boolean
  finalFocus?: RefObject<HTMLButtonElement | null>
}) {
  const close = (open: boolean) => {
    if (!open) setDialog(null)
  }

  return (
    <>
      {invoice.send && (
        <SendDialog details={invoice.send} open={dialog === "send"} onOpenChange={close} finalFocus={finalFocus} />
      )}
      {invoice.actions.markPaid && (
        <MarkPaidDialog
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          open={dialog === "markPaid"}
          onOpenChange={close}
          finalFocus={finalFocus}
        />
      )}
      {invoice.actions.delete && (
        <DeleteInvoiceDialog
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          sentTo={invoice.lastSentAt ? invoice.clientEmail : null}
          returnToList={returnToList}
          open={dialog === "delete"}
          onOpenChange={close}
          finalFocus={finalFocus}
        />
      )}
    </>
  )
}

/** The ⋯ menu of an invoice in a list (PRD §6.11 AC7). */
export function InvoiceRowActions({ invoice }: { invoice: InvoiceSummary }) {
  const { dialog, setDialog, duplicating, duplicate } = useInvoiceActions(invoice)
  const [menuOpen, setMenuOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { actions } = invoice
  const { send } = actions

  useLayoutEffect(() => () => setMenuOpen(false), [])

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <Button
              ref={triggerRef}
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for invoice ${invoice.invoiceNumber}`}
            />
          }
        >
          {duplicating ? <Spinner /> : <DotsThreeIcon weight="bold" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {actions.edit && (
            <DropdownMenuItem render={<Link href={editHref(invoice)} />}>
              <PencilSimpleIcon />
              Edit
            </DropdownMenuItem>
          )}
          {send.kind === "dialog" && (
            <DropdownMenuItem onClick={() => setDialog("send")}>
              <PaperPlaneTiltIcon />
              {send.label}
            </DropdownMenuItem>
          )}
          {send.kind === "finish" && (
            <DropdownMenuItem render={<Link href={finishHref(invoice)} />}>
              <PaperPlaneTiltIcon />
              Send
            </DropdownMenuItem>
          )}
          {send.kind === "disabled" && (
            <DropdownMenuItem disabled className="items-start">
              <PaperPlaneTiltIcon className="mt-0.5" />
              <span className="flex flex-col">
                {send.label}
                <span className="text-xs text-muted-foreground">{send.reason}</span>
              </span>
            </DropdownMenuItem>
          )}
          {actions.downloadPdf && (
            <DropdownMenuItem render={<a href={pdfHref(invoice)} download />}>
              <DownloadSimpleIcon />
              Download PDF
            </DropdownMenuItem>
          )}
          <DropdownMenuItem disabled={duplicating} onClick={duplicate}>
            <CopyIcon />
            Duplicate
          </DropdownMenuItem>
          {actions.markPaid && (
            <DropdownMenuItem onClick={() => setDialog("markPaid")}>
              <CheckCircleIcon />
              Mark as paid
            </DropdownMenuItem>
          )}
          {actions.delete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <InvoiceDialogs invoice={invoice} dialog={dialog} setDialog={setDialog} finalFocus={triggerRef} />
    </>
  )
}

/**
 * Opens the resend prompt after a save redirected here with `?resend=1`
 * (PRD §6.8), then drops the parameter so a reload doesn't ask again.
 */
function useResendPrompt(enabled: boolean) {
  const requested = useSearchParams().get("resend") === "1"
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(false)

  if (requested && !seen) {
    setSeen(true)
    if (enabled) setOpen(true)
  }
  if (!requested && seen) setSeen(false)

  useEffect(() => {
    if (!requested) return
    const url = new URL(window.location.href)
    url.searchParams.delete("resend")
    window.history.replaceState(null, "", url)
  }, [requested])

  useLayoutEffect(() => () => setOpen(false), [])
  return [open, setOpen] as const
}

/** The buttons above an invoice on its details page (PRD §6.12 AC2). */
export function InvoiceDetailActions({ invoice }: { invoice: InvoiceSummary }) {
  const { dialog, setDialog, duplicating, duplicate } = useInvoiceActions(invoice)
  const [promptOpen, setPromptOpen] = useResendPrompt(invoice.send !== null)
  const { actions } = invoice
  const { send } = actions

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        {send.kind === "dialog" && (
          <Button onClick={() => setDialog("send")}>
            <PaperPlaneTiltIcon data-icon="inline-start" />
            {send.label}
          </Button>
        )}
        {send.kind === "finish" && (
          <Link href={finishHref(invoice)} className={buttonVariants()}>
            <PaperPlaneTiltIcon data-icon="inline-start" />
            Send
          </Link>
        )}
        {send.kind === "disabled" && (
          <Button disabled aria-describedby={`send-reason-${invoice.id}`}>
            <PaperPlaneTiltIcon data-icon="inline-start" />
            {send.label}
          </Button>
        )}
        {actions.edit && (
          <Link href={editHref(invoice)} className={buttonVariants({ variant: "outline" })}>
            <PencilSimpleIcon data-icon="inline-start" />
            Edit
          </Link>
        )}
        {actions.downloadPdf && (
          <a href={pdfHref(invoice)} download className={buttonVariants({ variant: "outline" })}>
            <DownloadSimpleIcon data-icon="inline-start" />
            Download PDF
          </a>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" size="icon" aria-label="More actions" />}
          >
            {duplicating ? <Spinner /> : <DotsThreeIcon weight="bold" />}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem disabled={duplicating} onClick={duplicate}>
              <CopyIcon />
              Duplicate
            </DropdownMenuItem>
            {actions.markPaid && (
              <DropdownMenuItem onClick={() => setDialog("markPaid")}>
                <CheckCircleIcon />
                Mark as paid
              </DropdownMenuItem>
            )}
            {actions.delete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setDialog("delete")}>
                  <TrashIcon />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {send.kind === "disabled" && (
        <p id={`send-reason-${invoice.id}`} className="text-sm text-muted-foreground sm:text-right">
          {send.reason}.{" "}
          {send.profileLink && (
            <Link href="/settings/profile" className="font-medium text-foreground underline underline-offset-4">
              Complete profile
            </Link>
          )}
        </p>
      )}

      <InvoiceDialogs invoice={invoice} dialog={dialog} setDialog={setDialog} returnToList />
      {invoice.clientEmail && (
        <ResendPrompt
          sentTo={invoice.clientEmail}
          open={promptOpen}
          onOpenChange={setPromptOpen}
          onResend={() => setDialog("send")}
        />
      )}
    </div>
  )
}
