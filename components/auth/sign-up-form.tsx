"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { RiErrorWarningLine } from "@remixicon/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { PasswordInput } from "@/components/auth/password-input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authErrorCode, authErrorMessage } from "@/lib/auth/errors"
import { rememberPendingSignup } from "@/lib/auth/pending-signup"
import { authConfirmUrl } from "@/lib/auth/urls"
import { createClient } from "@/lib/supabase/client"
import { PASSWORD_MIN_LENGTH, signUpSchema, type SignUpValues } from "@/lib/validation/auth"

export function SignUpForm() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  })

  async function onSubmit({ email, password }: SignUpValues) {
    setFormError(null)

    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: { emailRedirectTo: authConfirmUrl() },
    })

    if (error) {
      if (authErrorCode(error) === "weak_password") {
        setError("password", { message: authErrorMessage(error) }, { shouldFocus: true })
      } else {
        setFormError(authErrorMessage(error))
      }
      return
    }

    setRedirecting(true)

    // Only happens if email confirmation is switched off in Supabase.
    if (data.session) {
      router.replace("/dashboard")
      router.refresh()
      return
    }

    // An already-registered email also lands here: Supabase doesn't reveal it
    // and sends no email, so nobody can probe which emails have accounts.
    rememberPendingSignup(email)
    router.push("/auth/sign-up-success")
  }

  const pending = isSubmitting || redirecting

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Create your account</CardTitle>
        <CardDescription>Start sending invoices in a couple of minutes.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {formError && (
              <Alert variant="destructive">
                <RiErrorWarningLine />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              <FieldError id="email-error" errors={[errors.email]} />
            </Field>

            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
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
              <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
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
              Sign up
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have an account?&nbsp;
        <Link href="/auth/login" className="text-foreground underline underline-offset-4">
          Log in
        </Link>
      </CardFooter>
    </Card>
  )
}
