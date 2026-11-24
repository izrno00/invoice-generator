"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { RiErrorWarningLine, RiMailLine } from "@remixicon/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { PasswordInput } from "@/components/auth/password-input"
import { ResendConfirmation } from "@/components/auth/resend-confirmation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authErrorCode, authErrorMessage } from "@/lib/auth/errors"
import { safeNextPath } from "@/lib/auth/safe-next-path"
import { createClient } from "@/lib/supabase/client"
import { loginSchema, type LoginValues } from "@/lib/validation/auth"

export function LoginForm() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: LoginValues) {
    setFormError(null)
    setUnconfirmedEmail(null)

    const { error } = await createClient().auth.signInWithPassword(values)

    if (error) {
      // PRD §6.1 AC5: explain and offer to resend. Supabase only returns this
      // after the password was correct, so it doesn't reveal anything.
      if (authErrorCode(error) === "email_not_confirmed") {
        setUnconfirmedEmail(values.email)
      } else {
        setFormError(authErrorMessage(error))
      }
      return
    }

    // PRD §6.1 AC8: return to the page the user asked for.
    setRedirecting(true)
    const next = new URLSearchParams(window.location.search).get("next")
    router.replace(safeNextPath(next))
    router.refresh()
  }

  const pending = isSubmitting || redirecting

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Log in</CardTitle>
        <CardDescription>Enter your email and password to log in.</CardDescription>
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

            {unconfirmedEmail && (
              <Alert>
                <RiMailLine />
                <AlertTitle>Confirm your email first</AlertTitle>
                <AlertDescription>
                  <p>
                    Follow the link we sent to {unconfirmedEmail} to activate your account, then log in.
                  </p>
                  <ResendConfirmation key={unconfirmedEmail} email={unconfirmedEmail} />
                </AlertDescription>
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
              <div className="flex items-center gap-2">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link
                  href="/auth/forgot-password"
                  className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
              <FieldError id="password-error" errors={[errors.password]} />
            </Field>

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending && <Spinner />}
              Log in
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Don&apos;t have an account?&nbsp;
        <Link href="/auth/sign-up" className="text-foreground underline underline-offset-4">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  )
}
