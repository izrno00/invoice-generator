"use client"

import { useSyncExternalStore } from "react"

type Greeting = "Good morning" | "Good afternoon" | "Good evening"

function greetingFor(hour: number): Greeting {
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

const subscribe = () => () => {}

/**
 * The title of the dashboard (PRD §6.15 AC1). The time of day comes from the
 * browser's clock, so the server (which only knows UTC) renders "Hello".
 */
export function DashboardGreeting({ firstName, status }: { firstName: string | null; status: string }) {
  const greeting = useSyncExternalStore<Greeting | "Hello">(
    subscribe,
    () => greetingFor(new Date().getHours()),
    () => "Hello"
  )

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance md:text-3xl">
        {firstName ? `${greeting}, ${firstName}` : "Dashboard"}
      </h1>
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  )
}
