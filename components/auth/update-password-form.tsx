"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { RiErrorWarningLine } from "@remixicon/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { PasswordInput } from "@/components/auth/password-input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { authErrorCode, authErrorMessage, isSessionMissingError } from "@/lib/auth/errors"
import { createClient } from "@/lib/supabase/client"
import { PASSWORD_MIN_LENGTH, updatePasswordSchema, type UpdatePasswordValues } from "@/lib/validation/auth"

export function UpdatePasswordForm() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [linkExpired, setLinkExpired] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  async function onSubmit({ password }: UpdatePasswordValues) {
    setFormError(null)
    setLinkExpired(false)

    const { error } = await createClient().auth.updateUser({ password })

    if (error) {
      const code = authErrorCode(error)
      if (isSessionMissingError(error)) {
        setLinkExpired(true)
      } else if (code === "same_password" || code === "weak_password") {
        setError("password", { message: authErrorMessage(error) }, { shouldFocus: true })
      } else {
        setFormError(authErrorMessage(error))
      }
      return
    }

    // PRD §6.1 AC6: the user is logged in and goes to the Dashboard.
    setRedirecting(true)
    toast.success("Your password has been updated")
    router.replace("/dashboard")
    router.refresh()
  }

  const pending = isSubmitting || redirecting

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Set new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {linkExpired && (
              <Alert variant="destructive">
                <RiErrorWarningLine />
                <AlertTitle>This reset link has expired</AlertTitle>
                <AlertDescription>
                  Reset links work once and expire after 1 hour.{" "}
                  <Link href="/auth/forgot-password">Request a new link</Link>.
                </AlertDescription>
              </Alert>
            )}

            {formError && (
              <Alert variant="destructive">
                <RiErrorWarningLine />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">New password</FieldLabel>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : "password-hint"}
                {...register("password")}
              />
              {errors.password ? (
                <FieldError id="password-error" errors={[errors.password]} />
              ) : (
                <FieldDescription id="password-hint">At least {PASSWORD_MIN_LENGTH} characters.</FieldDescription>
              )}
            </Field>

            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                {...register("confirmPassword")}
              />
              <FieldError id="confirm-password-error" errors={[errors.confirmPassword]} />
            </Field>

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending && <Spinner />}
              Save new password
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
