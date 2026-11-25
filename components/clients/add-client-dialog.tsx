"use client"

import { toast } from "sonner"

import { ClientFields } from "@/components/clients/client-fields"
import { DuplicateClientDialog } from "@/components/clients/duplicate-client-dialog"
import { useSaveClient } from "@/components/clients/use-save-client"
import { useUnsavedChangesGuard } from "@/components/forms/unsaved-changes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import type { ClientOption } from "@/lib/dal/clients"
import { EMPTY_CLIENT_VALUES } from "@/lib/validation/client"

/** "Add new client" without leaving the page, e.g. the invoice form (PRD §6.4 AC4). */
export function AddClientDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (client: ClientOption) => void
}) {
  const { form, formError, duplicates, dismissDuplicates, submit, saveAnyway } = useSaveClient({
    defaultValues: EMPTY_CLIENT_VALUES,
    onSaved: (client) => {
      onOpenChange(false)
      onCreated(client)
      toast.success("Client saved")
    },
  })
  const { errors, isDirty, isSubmitting } = form.formState
  const guard = useUnsavedChangesGuard(open && isDirty, { onDiscard: () => form.reset() })

  function changeOpen(next: boolean) {
    if (next) onOpenChange(true)
    else if (!isSubmitting) {
      guard.confirmDiscard(() => {
        form.reset()
        onOpenChange(false)
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      {/* Nested dialogs get no backdrop, so this one dims itself behind them. */}
      <DialogContent className="max-h-svh max-w-full overflow-y-auto data-nested-dialog-open:brightness-75 max-sm:rounded-none sm:max-h-[calc(100svh-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add new client</DialogTitle>
          <DialogDescription>Fill in at least one field.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            // Events bubble through portals: don't submit a form around this dialog.
            event.stopPropagation()
            void submit(event)
          }}
        >
          <ClientFields register={form.register} errors={errors} formError={formError} />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => changeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </form>
        {/* Inside the content, so they count as nested dialogs. */}
        <DuplicateClientDialog duplicates={duplicates} onCancel={dismissDuplicates} onConfirm={saveAnyway} />
        {guard.dialog}
      </DialogContent>
    </Dialog>
  )
}
