import type { Metadata } from "next"
import { Suspense } from "react"

import { ProfileBanner } from "@/components/dashboard/profile-banner"

export const metadata: Metadata = { title: "Dashboard" }

/** Temporary dashboard until the Dashboard milestone (PRD §6.15). */
export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-10 md:py-10">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard</h1>
      <Suspense fallback={null}>
        <ProfileBanner />
      </Suspense>
      <p className="text-sm text-muted-foreground">Your invoice totals and recent invoices will appear here.</p>
    </div>
  )
}
