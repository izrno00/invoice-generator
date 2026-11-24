import type { Metadata } from "next"
import { Suspense } from "react"

import { LogoutButton } from "@/components/auth/logout-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { requireUser } from "@/lib/dal/auth"

export const metadata: Metadata = { title: "Dashboard" }

/** Reads the session, so it renders inside a Suspense boundary. */
async function SignedInAs() {
  const user = await requireUser("/dashboard")

  return (
    <Card>
      <CardHeader>
        <CardTitle>You&apos;re signed in</CardTitle>
        <CardDescription>
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LogoutButton />
      </CardContent>
    </Card>
  )
}

/** Temporary dashboard until the Dashboard milestone (PRD §6.15). */
export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 md:px-10">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
      <Suspense fallback={<Skeleton className="h-36 w-full rounded-xl" />}>
        <SignedInAs />
      </Suspense>
    </main>
  )
}
