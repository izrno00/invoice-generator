"use client"

import { usePathname } from "next/navigation"

import { NavLinks } from "@/components/app-shell/nav-links"

/**
 * Desktop nav in the header. usePathname can suspend during prerender, so the
 * header wraps this in Suspense with static links as the fallback.
 */
export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname()
  return <NavLinks pathname={pathname} className={className} />
}
