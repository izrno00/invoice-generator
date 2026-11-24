"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { isAuthRetryableFetchError } from "@supabase/supabase-js"
import { RiErrorWarningLine } from "@remixicon/react"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authErrorMessage, isRateLimitError } from "@/lib/auth/errors"
import { authConfirmUrl } from "@/lib/auth/urls"
import { createClient } from "@/lib/supabase/client"
import { emailOnlySchema, type EmailOnlyValues } from "@/lib/validation/auth"

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailOnlyValues>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  })

  async function onSubmit({ email }: EmailOnlyValues) {
    setFormError(null)

    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: authConfirmUrl(),
    })

    // PRD §6.1 AC6: the same message whether or not the account exists.
    // Only problems unrelated to the account (rate limit, network) are shown.
    if (error && (isRateLimitError(error) || isAuthRetryableFetchError(error))) {
      setFormError(authErrorMessage(error))
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Check your email</CardTitle>
          <CardDescription>
            If an account exists, we&apos;ve sent a reset link. It expires in 1 hour.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/auth/login" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full" })}>
            Back to log in
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Forgot your password?</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send you a link to set a new one.</CardDescription>
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

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              Send reset link
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Remembered it?&nbsp;
        <Link href="/auth/login" className="text-foreground underline underline-offset-4">
          Log in
        </Link>
      </CardFooter>
    </Card>
  )
}
