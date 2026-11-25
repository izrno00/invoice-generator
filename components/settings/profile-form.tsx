"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import type { ReactNode } from "react"
import { Controller, useForm, type FieldError as FormFieldError } from "react-hook-form"
import { toast } from "sonner"

import { updateProfile, type UpdateProfileResult } from "@/app/(app)/settings/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { CURRENCIES, CURRENCY_LABELS, profileSchema, type ProfileFormValues } from "@/lib/validation/profile"

const SAVE_FAILED = "Couldn't save your profile. Please try again."

/** Visual order, so the first invalid field on screen gets focus. */
const FIELD_ORDER = [
  "fullName",
  "companyName",
  "email",
  "website",
  "address",
  "vatId",
  "defaultCurrency",
] as const satisfies readonly (keyof ProfileFormValues)[]

type A11yProps = {
  id: string
  "aria-invalid": boolean
  "aria-describedby"?: string
}

/** Label + control + hint, with the hint swapped for the error when invalid. */
function ProfileField({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string
  label: string
  error?: FormFieldError
  hint?: string
  className?: string
  children: (a11y: A11yProps) => ReactNode
}) {
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

/** Settings → Profile (PRD §6.2). */
export function ProfileForm({ initialValues }: { initialValues: ProfileFormValues }) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    // raw: submit the strings as typed; the Server Action parses them again.
    resolver: zodResolver(profileSchema, undefined, { raw: true }),
    defaultValues: initialValues,
  })

  async function onSubmit(values: ProfileFormValues) {
    let result: UpdateProfileResult | undefined
    try {
      result = await updateProfile(values)
    } catch {
      toast.error("Couldn't save your profile. Check your connection and try again.")
      return
    }

    // The session expired and the action redirected to login.
    if (!result) return

    if (result.ok) {
      // The saved values become the new baseline (e.g. the website with https://).
      reset(result.values)
      toast.success("Profile saved")
      return
    }

    let focused = false
    for (const name of FIELD_ORDER) {
      const message = result.fieldErrors?.[name]?.[0]
      if (!message) continue
      setError(name, { type: "server", message }, { shouldFocus: !focused })
      focused = true
    }
    if (!focused) toast.error(result.message ?? SAVE_FAILED)
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent>
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Sender details</FieldLegend>
              <div className="grid gap-6 md:grid-cols-2">
                <ProfileField id="fullName" label="Full name" error={errors.fullName}>
                  {(a11y) => <Input {...a11y} autoComplete="name" {...register("fullName")} />}
                </ProfileField>

                <ProfileField id="companyName" label="Company name" error={errors.companyName}>
                  {(a11y) => <Input {...a11y} autoComplete="organization" {...register("companyName")} />}
                </ProfileField>

                <ProfileField
                  id="email"
                  label="Email"
                  error={errors.email}
                  hint="Shown on invoices and used as the reply-to address. Doesn't change your login email."
                >
                  {(a11y) => <Input {...a11y} type="email" autoComplete="email" {...register("email")} />}
                </ProfileField>

                <ProfileField id="website" label="Website" error={errors.website} hint="For example, example.com">
                  {(a11y) => <Input {...a11y} inputMode="url" autoComplete="url" {...register("website")} />}
                </ProfileField>

                <ProfileField id="address" label="Address" error={errors.address} className="md:col-span-2">
                  {(a11y) => <Textarea {...a11y} rows={3} autoComplete="street-address" {...register("address")} />}
                </ProfileField>

                <ProfileField id="vatId" label="VAT ID" error={errors.vatId}>
                  {(a11y) => <Input {...a11y} autoComplete="off" {...register("vatId")} />}
                </ProfileField>
              </div>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend>Invoice defaults</FieldLegend>
              <div className="grid gap-6 md:grid-cols-2">
                <Controller
                  control={control}
                  name="defaultCurrency"
                  render={({ field, fieldState }) => (
                    <ProfileField
                      id="defaultCurrency"
                      label="Default currency"
                      error={fieldState.error}
                      hint="Used for new invoices. Existing invoices keep their currency."
                    >
                      {(a11y) => (
                        <Select
                          items={CURRENCY_LABELS}
                          value={field.value}
                          onValueChange={(value) => {
                            if (value) field.onChange(value)
                          }}
                        >
                          <SelectTrigger {...a11y} ref={field.ref} onBlur={field.onBlur} className="w-full">
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
                      )}
                    </ProfileField>
                  )}
                />
              </div>
            </FieldSet>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={!isDirty || isSubmitting} className="w-full sm:w-auto">
            {isSubmitting && <Spinner />}
            Save
          </Button>
        </CardFooter>
      </Card>
    </form>
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

export function ProfileFormSkeleton() {
  return (
    <Card aria-hidden>
      <CardContent className="gap-6">
        <Skeleton className="h-5 w-32" />
        <div className="grid gap-6 md:grid-cols-2">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton className="md:col-span-2" tall />
          <FieldSkeleton />
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Skeleton className="h-9 w-full sm:w-20" />
      </CardFooter>
    </Card>
  )
}
