import { PlusIcon, UserPlusIcon } from "@phosphor-icons/react/ssr"
import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { CurrencySwitcher } from "@/components/dashboard/currency-switcher"
import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting"
import { DueSoonCard, DueSoonSkeleton, RecentInvoicesCard, RecentInvoicesSkeleton } from "@/components/dashboard/invoice-lists"
import { PaidChart } from "@/components/dashboard/paid-chart"
import { ProfileBanner } from "@/components/dashboard/profile-banner"
import { SetupChecklist } from "@/components/dashboard/setup-checklist"
import { DashboardSkeleton, GreetingSkeleton } from "@/components/dashboard/skeletons"
import { StatCards } from "@/components/dashboard/stat-cards"
import { StripeBanner } from "@/components/dashboard/stripe-banner"
import { buttonVariants } from "@/components/ui/button"
import { getDashboardSummary, getPaidByMonth, getSetupState } from "@/lib/dal/dashboard"
import { getProfile } from "@/lib/dal/profile"
import {
  activeCurrencies,
  dashboardFirstName,
  defaultDashboardCurrency,
  monthSeries,
  overdueStatusLine,
  paidTrend,
  pickCurrency,
  summaryFor,
} from "@/lib/dashboard/summary"

export const metadata: Metadata = { title: "Dashboard" }

/** Reads the profile and the totals, so it renders inside a Suspense boundary. */
async function Greeting() {
  const [profile, summary, setup] = await Promise.all([getProfile(), getDashboardSummary(), getSetupState()])
  const overdue = summary.reduce((count, row) => count + row.overdueCount, 0)
  const status = setup.hasInvoice ? overdueStatusLine(overdue) : "Let's get you set up"

  return <DashboardGreeting firstName={dashboardFirstName(profile.fullName)} status={status} />
}

/** Welcome checklist with no invoices, otherwise the full dashboard (PRD §6.15). */
async function DashboardBody({ searchParams }: Pick<PageProps<"/dashboard">, "searchParams">) {
  const [setup, summary, paid, profile, params] = await Promise.all([
    getSetupState(),
    getDashboardSummary(),
    getPaidByMonth(),
    getProfile(),
    searchParams,
  ])

  // The checklist covers the profile and Stripe steps, so no banners here.
  if (!setup.hasInvoice) return <SetupChecklist state={setup} />

  const active = activeCurrencies(summary, paid)
  const requested = typeof params.currency === "string" ? params.currency : undefined
  const currency = pickCurrency(
    requested,
    active,
    defaultDashboardCurrency(active, profile.defaultCurrency, summary, paid)
  )
  const now = new Date()

  return (
    <>
      {(!setup.profileComplete || !setup.stripeConnected) && (
        <div className="flex flex-col gap-3">
          <Suspense fallback={null}>
            <ProfileBanner />
          </Suspense>
          <Suspense fallback={null}>
            <StripeBanner />
          </Suspense>
        </div>
      )}

      <section aria-labelledby="overview-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="overview-heading" className="font-heading text-lg font-semibold tracking-tight">
            Overview
          </h2>
          <CurrencySwitcher currencies={active} value={currency} />
        </div>
        <StatCards summary={summaryFor(summary, currency)} trend={paidTrend(paid, currency, now)} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <PaidChart series={monthSeries(paid, currency, now)} currency={currency} />
        </div>
        <Suspense fallback={<DueSoonSkeleton />}>
          <DueSoonCard />
        </Suspense>
      </div>

      <Suspense fallback={<RecentInvoicesSkeleton />}>
        <RecentInvoicesCard />
      </Suspense>
    </>
  )
}

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:px-10 md:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <Suspense fallback={<GreetingSkeleton />}>
          <Greeting />
        </Suspense>
        <div className="flex shrink-0 gap-2">
          <Link href="/clients/new" className={buttonVariants({ variant: "outline" })}>
            <UserPlusIcon data-icon="inline-start" />
            New client
          </Link>
          <Link href="/invoices/new" className={buttonVariants()}>
            <PlusIcon data-icon="inline-start" />
            New invoice
          </Link>
        </div>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardBody searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
