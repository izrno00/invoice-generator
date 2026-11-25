"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useLayoutEffect, useState, type FormEvent } from "react"
import { useForm, useWatch, type FieldError, type FieldErrors } from "react-hook-form"
import { toast } from "sonner"

import { saveClient, type SaveClientResult } from "@/app/(app)/clients/actions"
import type { ClientOption, DuplicateClient } from "@/lib/dal/clients"
import { isNavigationError } from "@/lib/is-navigation-error"
import { CLIENT_FORM_ERROR, clientSchema, type ClientFormValues } from "@/lib/validation/client"

/** Visual order, so the first invalid field on screen gets focus. */
const FIELD_ORDER = [
  "fullName",
  "companyName",
  "email",
  "address",
  "vatId",
] as const satisfies readonly (keyof ClientFormValues)[]

/** The error about the form as a whole isn't one of its fields. */
type ErrorsWithForm = FieldErrors<ClientFormValues> & { [CLIENT_FORM_ERROR]?: FieldError }

/**
 * Form state and saving for a client, shared by the page form and the
 * "Add new client" dialog. Includes the "similar client" round trip.
 */
export function useSaveClient({
  clientId,
  defaultValues,
  onSaved,
}: {
  /** Set when editing an existing client. */
  clientId?: string
  defaultValues: ClientFormValues
  onSaved: (client: ClientOption) => void
}) {
  const form = useForm<ClientFormValues>({
    // raw: submit the strings as typed; the Server Action parses them again.
    resolver: zodResolver(clientSchema, undefined, { raw: true }),
    defaultValues,
  })
  const [duplicates, setDuplicates] = useState<DuplicateClient[] | null>(null)
  // Next.js hides pages instead of unmounting them: don't come back to an open dialog.
  useLayoutEffect(() => () => setDuplicates(null), [])

  const values = useWatch({ control: form.control })
  const hasInput = Object.values(values).some((value) => value?.trim())
  const errors: ErrorsWithForm = form.formState.errors
  // Hidden as soon as something is typed; the next submit checks again.
  const formError = hasInput ? undefined : errors[CLIENT_FORM_ERROR]?.message

  async function save(input: ClientFormValues, confirmDuplicates: boolean) {
    let result: SaveClientResult
    try {
      result = await saveClient({ id: clientId, values: input, confirmDuplicates })
    } catch (error) {
      if (!isNavigationError(error)) {
        toast.error("Couldn't save the client. Check your connection and try again.")
      }
      return
    }

    if (result.ok) {
      // Editing: the saved values are the new baseline. Creating: start empty next time.
      form.reset(clientId ? result.values : defaultValues)
      onSaved(result.client)
      return
    }

    if (result.duplicates) {
      setDuplicates(result.duplicates)
      return
    }

    let focused = false
    for (const name of FIELD_ORDER) {
      const message = result.fieldErrors?.[name]?.[0]
      if (!message) continue
      form.setError(name, { type: "server", message }, { shouldFocus: !focused })
      focused = true
    }
    if (!focused) toast.error(result.fieldErrors?.[CLIENT_FORM_ERROR]?.[0] ?? result.message)
  }

  function submitWith(confirmDuplicates: boolean) {
    return form.handleSubmit(
      (input) => save(input, confirmDuplicates),
      (invalid: ErrorsWithForm) => {
        // Field errors focus themselves; this one points at the first field.
        if (invalid[CLIENT_FORM_ERROR]) form.setFocus("fullName")
      }
    )
  }

  return {
    form,
    formError,
    duplicates,
    dismissDuplicates: () => setDuplicates(null),
    submit: (event: FormEvent) => submitWith(false)(event),
    saveAnyway: () => {
      setDuplicates(null)
      void submitWith(true)()
    },
  }
}
