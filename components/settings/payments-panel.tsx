"use client"

import { ArrowSquareOutIcon, CheckCircleIcon, HourglassMediumIcon, PlugIcon } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useEffect, useId, useState, useTransition } from "react"
import { toast } from "sonner"

import { connectStripe } from "@/app/(app)/settings/actions"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { isNavigationError } from "@/lib/is-navigation-error"
import type { AccountCountry } from "@/lib/stripe/connect"

export type PaymentsState =
  /** `countries`: where Stripe can open accounts (empty if they couldn't be loaded). */
  | { kind: "not_connected"; countries: AccountCountry[] }
  /** `reviewing`: the user submitted everything; Stripe is checking or needs more. */
  | { kind: "incomplete"; reviewing: boolean }
  | { kind: "connected"; displayName: string | null }

const STRIPE_DASHBOARD_URL = "https://dashboard.stripe.com"
const STRIPE_UNAVAILABLE = "Couldn't open Stripe. Please try again."
/** The platform is Croatian, so most users start there. */
const DEFAULT_COUNTRY = "HR"

/** Runs Connect Stripe / Continue setup. On success the browser goes to Stripe. */
function useConnectStripe() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function connect(country?: string) {
    startTransition(async () => {
      try {
        const result = await connectStripe(country ? { country } : {})
        if (!result.ok) {
          toast.error(result.message)
          router.refresh()
        }
      } catch (error) {
        if (!isNavigationError(error)) toast.error(STRIPE_UNAVAILABLE)
      }
    })
  }

  return { connect, pending }
}

/**
 * Stripe needs the country before the account exists, and it can't change
 * later, so the user picks it first. Everything else is asked by Stripe.
 */
function ConnectDialog({
  countries,
  open,
  onOpenChange,
}: {
  countries: AccountCountry[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const id = useId()
  const { connect, pending } = useConnectStripe()
  const [country, setCountry] = useState(
    countries.some((option) => option.code === DEFAULT_COUNTRY) ? DEFAULT_COUNTRY : (countries[0]?.code ?? "")
  )
  const labels = Object.fromEntries(countries.map((option) => [option.code, option.name]))

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Stripe</DialogTitle>
          <DialogDescription>
            You&apos;ll finish the setup on Stripe and come back here when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        {countries.length > 0 ? (
          <Field>
            <FieldLabel htmlFor={`${id}-country`}>Where is your business based?</FieldLabel>
            <Select items={labels} value={country} onValueChange={(value) => value && setCountry(value)} disabled={pending}>
              <SelectTrigger id={`${id}-country`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countries.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>Stripe needs this to set up your account. It can&apos;t be changed later.</FieldDescription>
          </Field>
        ) : (
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load the list of countries from Stripe. Reload the page to try again.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={pending || !country} onClick={() => connect(country)}>
            {pending && <Spinner />}
            Continue to Stripe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Stripe connection status on Settings → Payments (PRD §6.3). */
export function PaymentsPanel({ state, returned }: { state: PaymentsState; returned: "return" | "error" | null }) {
  const router = useRouter()
  const { connect, pending } = useConnectStripe()
  const [dialogOpen, setDialogOpen] = useState(false)

  // Back from Stripe: say how it went once, then drop the parameter from the URL.
  useEffect(() => {
    if (!returned) return
    if (returned === "error") toast.error(STRIPE_UNAVAILABLE, { id: "stripe-return" })
    else if (state.kind === "connected") toast.success("Stripe connected", { id: "stripe-return" })
    else toast.info("Setup not finished yet", { id: "stripe-return" })
    router.replace("/settings/payments", { scroll: false })
  }, [returned, state.kind, router])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe</CardTitle>
        <CardDescription>
          Money from card payments goes straight to your Stripe account. Payable takes no fee; Stripe&apos;s
          processing fees apply.
        </CardDescription>
        <CardAction>
          {state.kind === "connected" && <Badge>Connected</Badge>}
          {state.kind === "incomplete" && <Badge variant="secondary">Setup incomplete</Badge>}
          {state.kind === "not_connected" && <Badge variant="outline">Not connected</Badge>}
        </CardAction>
      </CardHeader>

      <CardContent>
        {state.kind === "not_connected" && (
          <p className="text-sm text-muted-foreground">
            You can send invoices without Stripe, but they won&apos;t include a payment link.
          </p>
        )}
        {state.kind === "incomplete" && (
          <p className="flex gap-2 text-sm text-muted-foreground">
            <HourglassMediumIcon className="mt-0.5 shrink-0" />
            {state.reviewing
              ? "Stripe is reviewing your details or needs more information. Payment links are added to your invoice emails once Stripe enables card payments."
              : "You started connecting Stripe but haven't finished the setup yet."}
          </p>
        )}
        {state.kind === "connected" && (
          <div className="flex flex-col gap-1 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircleIcon className="shrink-0 text-primary" weight="fill" />
              Payments enabled
            </p>
            <p className="text-muted-foreground wrap-anywhere">
              {state.displayName ? `Connected account: ${state.displayName}. ` : ""}
              Invoice emails include a link your clients can use to pay by card.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-end">
        {state.kind === "not_connected" && (
          <>
            <Button onClick={() => setDialogOpen(true)}>
              <PlugIcon />
              Connect Stripe
            </Button>
            <ConnectDialog countries={state.countries} open={dialogOpen} onOpenChange={setDialogOpen} />
          </>
        )}
        {state.kind === "incomplete" && (
          <Button onClick={() => connect()} disabled={pending}>
            {pending ? <Spinner /> : <PlugIcon />}
            Continue setup
          </Button>
        )}
        {state.kind === "connected" && (
          <a
            href={STRIPE_DASHBOARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            Open Stripe dashboard
            <ArrowSquareOutIcon data-icon="inline-end" />
          </a>
        )}
      </CardFooter>
    </Card>
  )
}

export function PaymentsPanelSkeleton() {
  return (
    <Card aria-hidden>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-full max-w-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-72 max-w-full" />
      </CardContent>
      <CardFooter className="justify-end">
        <Skeleton className="h-9 w-36" />
      </CardFooter>
    </Card>
  )
}
