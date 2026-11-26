"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

/**
 * Picks the currency the stat cards and the chart show (PRD §6.15 AC2). The
 * choice lives in `?currency=`, so it survives a reload. Hidden with one currency.
 */
export function CurrencySwitcher({ currencies, value }: { currencies: readonly string[]; value: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  if (currencies.length < 2) return null

  function select(next: string[]) {
    // Clicking the selected currency would clear the group; keep it.
    const currency = next[0]
    if (!currency || currency === value) return

    const params = new URLSearchParams(searchParams.toString())
    params.set("currency", currency)
    startTransition(() => router.replace(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  return (
    <ToggleGroup
      aria-label="Currency"
      variant="outline"
      size="sm"
      spacing={0}
      value={[value]}
      onValueChange={select}
      className={cn("transition-opacity", pending && "opacity-60")}
    >
      {currencies.map((currency) => (
        <ToggleGroupItem key={currency} value={currency} className="px-3 font-medium tabular-nums">
          {currency}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
