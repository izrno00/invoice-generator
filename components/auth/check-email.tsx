"use client"

import Link from "next/link"

import { ResendConfirmation, ResendConfirmationForm } from "@/components/auth/resend-confirmation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { usePendingSignupEmail } from "@/lib/auth/pending-signup"
import { RESEND_COOLDOWN_SECONDS } from "@/lib/auth/urls"

/** "Check your email" screen shown after sign-up (PRD §6.1 AC2). */
export function CheckEmail() {
  const email = usePendingSignupEmail()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Check your email</CardTitle>
        <CardDescription>
          {email ? (
            <>
              We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
            </>
          ) : (
            "We sent you a confirmation link."
          )}{" "}
          Follow it to activate your account. The link expires in 1 hour.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {email ? (
          // The sign-up just sent an email, so start with the cooldown running.
          <ResendConfirmation
            key={email}
            email={email}
            initialCooldown={RESEND_COOLDOWN_SECONDS}
            sentMessage={`If ${email} still needs confirming, a new link is on its way.`}
          />
        ) : (
          <ResendConfirmationForm />
        )}
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already confirmed?&nbsp;
        <Link href="/auth/login" className="text-foreground underline underline-offset-4">
          Log in
        </Link>
      </CardFooter>
    </Card>
  )
}
