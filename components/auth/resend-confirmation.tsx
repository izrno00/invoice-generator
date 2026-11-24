"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { isAuthRetryableFetchError } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { authErrorMessage, isRateLimitError } from "@/lib/auth/errors"
import { authConfirmUrl, RESEND_COOLDOWN_SECONDS } from "@/lib/auth/urls"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { emailOnlySchema, type EmailOnlyValues } from "@/lib/validation/auth"

type Result = { kind: "sent" | "error"; message: string }

/**
 * Resends the sign-up confirmation email with a cooldown.
 * Only rate-limit, network and server errors are shown. Anything else reads as
 * "sent", so the screen never reveals whether an account exists or is confirmed.
 */
function useResendConfirmation(initialCooldown: number) {
  const [cooldown, setCooldown] = useState(initialCooldown)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  async function send(email: string, sentMessage: string) {
    if (sending || cooldown > 0) return
    setSending(true)
    setResult(null)

    const { error } = await createClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: authConfirmUrl() },
    })
    setSending(false)

    if (error && isRateLimitError(error)) {
      setResult({ kind: "error", message: "Please wait a minute before requesting another email." })
      setCooldown(RESEND_COOLDOWN_SECONDS)
      return
    }
    if (error && (isAuthRetryableFetchError(error) || (error.status ?? 0) >= 500)) {
      setResult({ kind: "error", message: authErrorMessage(error) })
      return
    }

    setResult({ kind: "sent", message: sentMessage })
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  return { send, sending, cooldown, result }
}

function ResendButton({ sending, cooldown, onClick }: { sending: boolean; cooldown: number; onClick?: () => void }) {
  return (
    <Button
      type={onClick ? "button" : "submit"}
      variant="outline"
      className="w-full"
      disabled={sending || cooldown > 0}
      onClick={onClick}
    >
      {sending && <Spinner />}
      {cooldown > 0 ? `Resend email (${cooldown}s)` : "Resend confirmation email"}
    </Button>
  )
}

function ResultMessage({ result }: { result: Result | null }) {
  return (
    <p
      aria-live="polite"
      className={cn("text-sm", result?.kind === "error" ? "text-destructive" : "text-muted-foreground")}
    >
      {result?.message}
    </p>
  )
}

/** Resend for a known email address (after sign-up, or after an unconfirmed login). */
export function ResendConfirmation({
  email,
  initialCooldown = 0,
  sentMessage = "Email sent. Check your inbox and spam folder.",
}: {
  email: string
  initialCooldown?: number
  sentMessage?: string
}) {
  const { send, sending, cooldown, result } = useResendConfirmation(initialCooldown)

  return (
    <div className="flex flex-col gap-2">
      <ResendButton sending={sending} cooldown={cooldown} onClick={() => send(email, sentMessage)} />
      <ResultMessage result={result} />
    </div>
  )
}

/** Resend when the email isn't known (e.g. the "Check your email" page opened directly). */
export function ResendConfirmationForm() {
  const { send, sending, cooldown, result } = useResendConfirmation(0)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailOnlyValues>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: "" },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit(({ email }) =>
        send(email, `If ${email} still needs confirming, a new link is on its way.`)
      )}
    >
      <FieldGroup className="gap-3">
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="resend-email">Didn&apos;t get it? Enter your email to resend</FieldLabel>
          <Input
            id="resend-email"
            type="email"
            autoComplete="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "resend-email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="resend-email-error" errors={[errors.email]} />
        </Field>
        <ResendButton sending={sending} cooldown={cooldown} />
        <ResultMessage result={result} />
      </FieldGroup>
    </form>
  )
}
