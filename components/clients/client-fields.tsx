"use client"

import { WarningCircleIcon } from "@phosphor-icons/react"
import { useId, type ReactNode } from "react"
import type { FieldError as FormFieldError, FieldErrors, UseFormRegister } from "react-hook-form"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { ClientFormValues } from "@/lib/validation/client"

type A11yProps = {
  id: string
  "aria-invalid": boolean
  "aria-describedby"?: string
}

/** Label + control + hint, with the hint swapped for the error when invalid. */
function ClientField({
  name,
  label,
  error,
  hint,
  className,
  children,
}: {
  name: keyof ClientFormValues
  label: string
  error?: FormFieldError
  hint?: string
  className?: string
  children: (a11y: A11yProps) => ReactNode
}) {
  // Unique per instance: Next.js can keep a hidden page with the same form in the DOM.
  const id = `${useId()}-${name}`
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <Field data-invalid={!!error} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children({ id, "aria-invalid": !!error, "aria-describedby": describedBy })}
      {error ? (
        <FieldError id={`${id}-error`} errors={[error]} />
      ) : hint ? (
        <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>
      ) : null}
    </Field>
  )
}

/** The five client fields (PRD §6.4). */
export function ClientFields({
  register,
  errors,
  formError,
}: {
  register: UseFormRegister<ClientFormValues>
  errors: FieldErrors<ClientFormValues>
  /** An error about the form as a whole. */
  formError?: string
}) {
  return (
    <FieldGroup>
      {formError && (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-6 @md/field-group:grid-cols-2">
        <ClientField name="fullName" label="Full name" error={errors.fullName}>
          {(a11y) => <Input {...a11y} autoComplete="off" {...register("fullName")} />}
        </ClientField>

        <ClientField name="companyName" label="Company name" error={errors.companyName}>
          {(a11y) => <Input {...a11y} autoComplete="off" {...register("companyName")} />}
        </ClientField>

        <ClientField
          name="email"
          label="Email"
          error={errors.email}
          hint="Needed to send invoices to this client."
          className="@md/field-group:col-span-2"
        >
          {(a11y) => <Input {...a11y} type="email" autoComplete="off" {...register("email")} />}
        </ClientField>

        <ClientField name="address" label="Address" error={errors.address} className="@md/field-group:col-span-2">
          {(a11y) => <Textarea {...a11y} rows={3} autoComplete="off" {...register("address")} />}
        </ClientField>

        <ClientField name="vatId" label="VAT ID" error={errors.vatId}>
          {(a11y) => <Input {...a11y} autoComplete="off" {...register("vatId")} />}
        </ClientField>
      </div>
    </FieldGroup>
  )
}
