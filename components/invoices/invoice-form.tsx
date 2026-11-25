"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowsClockwiseIcon, InfoIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import { Controller, useForm, useWatch, type FieldPath, type Resolver } from "react-hook-form"
import { toast } from "sonner"

import { saveInvoice, type SaveInvoiceResult } from "@/app/(app)/invoices/actions"
import { ClientCombobox } from "@/components/clients/client-combobox"
import { useUnsavedChangesGuard } from "@/components/forms/unsaved-changes"
import { DatePicker } from "@/components/invoices/date-picker"
import { InvoiceTotals, LineItemsEditor } from "@/components/invoices/line-items-editor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type { ClientOption } from "@/lib/dal/clients"
import { defaultDueDate, localToday } from "@/lib/invoices/dates"
import { partyLines } from "@/lib/invoices/document"
import type { SenderSnapshot } from "@/lib/invoices/snapshot"
import { isNavigationError } from "@/lib/is-navigation-error"
import {
  INVOICE_LIMITS,
  invoiceSchemaFor,
  SAVED_CLIENT,
  type InvoiceFormValues,
  type SaveMode,
} from "@/lib/validation/invoice"
import { CURRENCIES, CURRENCY_LABELS } from "@/lib/validation/profile"

type InvoiceFormProps = {
  /** Set when editing. */
  invoiceId?: string
  /** "new" until the first save. A Not paid invoice can't be saved as a draft again. */
  status: "new" | "draft" | "unpaid"
  invoiceNumber: string | null
  initialValues: InvoiceFormValues
  /** The details saved on the invoice (or the profile, for a new one). */
  sender: SenderSnapshot
  /** The current profile, shown after "Refresh details". */
  profileSender: SenderSnapshot
  clients: ClientOption[]
  /** The saved details of a deleted client, shown as "<name> (deleted client)". */
  savedClientName: string | null
  /** Run the finalize checks straight away (a draft's Send landed here). */
  finalize?: boolean
}

function SenderBlock({ sender }: { sender: SenderSnapshot }) {
  const lines = partyLines(sender)
  const parts = [lines.primary, lines.secondary, lines.address, lines.vatId && `VAT ID: ${lines.vatId}`, lines.email, lines.website]
  const shown = parts.filter(Boolean)

  if (shown.length === 0) {
    return <p className="text-sm text-muted-foreground">No sender details yet.</p>
  }
  return (
    <div className="text-sm wrap-anywhere">
      {shown.map((part, index) => (
        <p key={index} className={index === 0 ? "font-medium" : "whitespace-pre-line"}>
          {part}
        </p>
      ))}
    </div>
  )
}

/** The New invoice and Edit invoice form (PRD §6.5). */
export function InvoiceForm({
  invoiceId,
  status,
  invoiceNumber,
  initialValues,
  sender,
  profileSender,
  clients,
  savedClientName,
  finalize = false,
}: InvoiceFormProps) {
  const router = useRouter()
  const id = useId()
  /** Which button was used: it decides how strict validation is (PRD §7). */
  const mode = useRef<SaveMode>("final")
  const [saving, setSaving] = useState<SaveMode | null>(null)
  const [refreshDetails, setRefreshDetails] = useState(false)

  const form = useForm<InvoiceFormValues>({
    // raw: submit the strings as typed; the Server Action parses them again.
    resolver: ((values, context, options) =>
      zodResolver(invoiceSchemaFor(mode.current), undefined, { raw: true })(values, context, options)) as Resolver<InvoiceFormValues>,
    defaultValues: initialValues,
  })
  const { control, register, setValue, formState } = form
  const { errors, isDirty } = formState
  const currency = useWatch({ control, name: "currency" })

  /**
   * The due date follows the invoice date (+14 days) until the user picks one
   * themselves (PRD §6.5.1). An existing invoice with a custom due date counts as picked.
   */
  const duePicked = useRef(initialValues.dueDate !== defaultDueDate(initialValues.invoiceDate))

  // A new invoice starts on the browser's date, which may differ from the server's.
  useEffect(() => {
    if (status !== "new" || form.formState.isDirty) return
    const today = localToday()
    if (today === form.getValues("invoiceDate")) return
    form.reset({ ...form.getValues(), invoiceDate: today, dueDate: defaultDueDate(today) })
  }, [status, form])

  // Send on an unfinished draft: show what's missing.
  useEffect(() => {
    if (!finalize) return
    mode.current = "final"
    void form.trigger(undefined, { shouldFocus: true })
  }, [finalize, form])

  const guard = useUnsavedChangesGuard(isDirty || refreshDetails, {
    onDiscard: () => {
      form.reset()
      setRefreshDetails(false)
    },
  })

  async function submit(values: InvoiceFormValues, saveMode: SaveMode) {
    let result: SaveInvoiceResult
    try {
      result = await saveInvoice({ id: invoiceId, mode: saveMode, values, refreshDetails })
    } catch (error) {
      if (!isNavigationError(error)) toast.error("Couldn't save the invoice. Check your connection and try again.")
      return
    }

    if (!result.ok) {
      let focused = false
      for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(name as FieldPath<InvoiceFormValues>, { type: "server", message }, { shouldFocus: !focused })
        focused = true
      }
      if (!focused) toast.error(result.message)
      return
    }

    // The saved values are the new baseline, so leaving doesn't ask to discard.
    form.reset(values)
    setRefreshDetails(false)
    router.push(`/invoices/${result.id}${result.needsResendPrompt ? "?resend=1" : ""}`)
    toast.success(saveMode === "draft" ? "Draft saved" : "Invoice saved")
    if (result.pdfFailed) {
      toast.warning("The PDF couldn't be generated. It will be generated when you download or send the invoice.")
    }
  }

  function save(saveMode: SaveMode) {
    mode.current = saveMode
    setSaving(saveMode)
    void form
      .handleSubmit((values) => submit(values, saveMode))()
      .finally(() => setSaving(null))
  }

  function cancel() {
    guard.confirmDiscard(() => router.push(invoiceId ? `/invoices/${invoiceId}` : "/invoices"))
  }

  const busy = saving !== null
  const shownSender = refreshDetails ? profileSender : sender
  const savedClient: ClientOption[] =
    savedClientName && initialValues.clientId === SAVED_CLIENT
      ? [{ id: SAVED_CLIENT, displayName: `${savedClientName} (deleted client)`, fullName: null, companyName: null, email: null }]
      : []

  return (
    <>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          save("final")
        }}
        className="flex flex-col gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-6 md:grid-cols-2">
                <Field>
                  <FieldTitle>From</FieldTitle>
                  <SenderBlock sender={shownSender} />
                  <FieldDescription>
                    {refreshDetails ? (
                      "Your current profile and client details will be applied when you save."
                    ) : (
                      <Link href="/settings/profile" className="underline underline-offset-4">
                        Edit your details in your profile
                      </Link>
                    )}
                  </FieldDescription>
                  {invoiceId && !refreshDetails && (
                    <div>
                      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setRefreshDetails(true)}>
                        <ArrowsClockwiseIcon data-icon="inline-start" />
                        Refresh details
                      </Button>
                    </div>
                  )}
                </Field>

                <Controller
                  control={control}
                  name="clientId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel htmlFor={`${id}-client`}>To</FieldLabel>
                      <ClientCombobox
                        id={`${id}-client`}
                        options={clients}
                        extraOptions={savedClient}
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={busy}
                        aria-invalid={!!fieldState.error}
                        aria-describedby={fieldState.error ? `${id}-client-error` : undefined}
                      />
                      <FieldError id={`${id}-client-error`} errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Field>
                  <FieldTitle>Invoice number</FieldTitle>
                  <p className="flex h-9 items-center text-sm tabular-nums">
                    {invoiceNumber ?? <span className="text-muted-foreground">Assigned on save</span>}
                  </p>
                </Field>

                <Controller
                  control={control}
                  name="invoiceDate"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel htmlFor={`${id}-invoice-date`}>Invoice date</FieldLabel>
                      <DatePicker
                        id={`${id}-invoice-date`}
                        ref={field.ref}
                        value={field.value}
                        onBlur={field.onBlur}
                        aria-invalid={!!fieldState.error}
                        onChange={(value) => {
                          field.onChange(value)
                          if (!duePicked.current) {
                            setValue("dueDate", defaultDueDate(value), {
                              shouldDirty: true,
                              shouldValidate: formState.isSubmitted,
                            })
                          }
                        }}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel htmlFor={`${id}-due-date`}>Due date</FieldLabel>
                      <DatePicker
                        id={`${id}-due-date`}
                        ref={field.ref}
                        value={field.value}
                        onBlur={field.onBlur}
                        aria-invalid={!!fieldState.error}
                        aria-describedby={fieldState.error ? `${id}-due-date-error` : undefined}
                        onChange={(value) => {
                          duePicked.current = true
                          field.onChange(value)
                        }}
                      />
                      <FieldError id={`${id}-due-date-error`} errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={control}
                  name="currency"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel htmlFor={`${id}-currency`}>Currency</FieldLabel>
                      <Select
                        items={CURRENCY_LABELS}
                        value={field.value}
                        onValueChange={(value) => {
                          if (value) field.onChange(value)
                        }}
                      >
                        <SelectTrigger
                          id={`${id}-currency`}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          aria-invalid={!!fieldState.error}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((code) => (
                            <SelectItem key={code} value={code}>
                              {CURRENCY_LABELS[code]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>Prices are before VAT. Use a dot or a comma for decimals.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <LineItemsEditor
              control={control}
              register={register}
              setValue={setValue}
              errors={errors}
              disabled={busy}
            />
            <InvoiceTotals control={control} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Field data-invalid={!!errors.comments}>
              <FieldLabel htmlFor={`${id}-comments`}>Comments</FieldLabel>
              <Textarea
                id={`${id}-comments`}
                rows={4}
                maxLength={INVOICE_LIMITS.comments}
                placeholder="Payment terms, a thank-you note…"
                aria-invalid={!!errors.comments}
                disabled={busy}
                {...register("comments")}
              />
              {errors.comments ? (
                <FieldError errors={[errors.comments]} />
              ) : (
                <FieldDescription>Optional. Shown at the bottom of the invoice.</FieldDescription>
              )}
            </Field>
          </CardContent>
          <CardFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={busy} onClick={cancel} className="w-full sm:w-auto">
              Cancel
            </Button>
            {status !== "unpaid" && (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => save("draft")}
                className="w-full sm:w-auto"
              >
                {saving === "draft" && <Spinner />}
                Save as draft
              </Button>
            )}
            <Button type="submit" disabled={busy} className="w-full sm:w-auto">
              {saving === "final" && <Spinner />}
              Save invoice
            </Button>
          </CardFooter>
        </Card>

        {status === "unpaid" && (
          <p className="flex gap-2 text-sm text-muted-foreground">
            <InfoIcon className="mt-0.5 shrink-0" />
            Saving updates the invoice&apos;s PDF.
          </p>
        )}
      </form>
      {guard.dialog}
    </>
  )
}

export function InvoiceFormSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <Skeleton className="h-72 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
