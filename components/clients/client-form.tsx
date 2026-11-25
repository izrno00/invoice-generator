"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ClientFields } from "@/components/clients/client-fields"
import { DuplicateClientDialog } from "@/components/clients/duplicate-client-dialog"
import { useSaveClient } from "@/components/clients/use-save-client"
import { useUnsavedChangesGuard } from "@/components/forms/unsaved-changes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import type { ClientFormValues } from "@/lib/validation/client"

/** The New client and Edit client form (PRD §6.4 AC3). */
export function ClientForm({
  clientId,
  initialValues,
}: {
  /** Set when editing. */
  clientId?: string
  initialValues: ClientFormValues
}) {
  const router = useRouter()
  const { form, formError, duplicates, dismissDuplicates, submit, saveAnyway } = useSaveClient({
    clientId,
    defaultValues: initialValues,
    onSaved: (client) => {
      router.push(`/clients/${client.id}`)
      toast.success("Client saved")
    },
  })
  const { errors, isDirty, isSubmitting } = form.formState
  const guard = useUnsavedChangesGuard(isDirty, { onDiscard: () => form.reset() })

  function cancel() {
    guard.confirmDiscard(() => router.push(clientId ? `/clients/${clientId}` : "/clients"))
  }

  return (
    <>
      <form noValidate onSubmit={submit}>
        <Card>
          <CardContent>
            <ClientFields register={form.register} errors={errors} formError={formError} />
          </CardContent>
          <CardFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={cancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={!isDirty || isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Spinner />}
              Save
            </Button>
          </CardFooter>
        </Card>
      </form>
      <DuplicateClientDialog duplicates={duplicates} onCancel={dismissDuplicates} onConfirm={saveAnyway} />
      {guard.dialog}
    </>
  )
}

function FieldSkeleton({ className, tall = false }: { className?: string; tall?: boolean }) {
  return (
    <div className={className}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className={tall ? "mt-3 h-20 w-full" : "mt-3 h-9 w-full"} />
    </div>
  )
}

export function ClientFormSkeleton() {
  return (
    <Card aria-hidden>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton className="md:col-span-2" />
          <FieldSkeleton className="md:col-span-2" tall />
          <FieldSkeleton />
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Skeleton className="h-9 w-full sm:w-40" />
      </CardFooter>
    </Card>
  )
}
