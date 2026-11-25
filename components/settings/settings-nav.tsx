"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { isActivePath } from "@/components/app-shell/nav-items"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Payments joins when Stripe Connect ships (PRD §6.11). */
const SETTINGS_ITEMS = [{ title: "Profile", href: "/settings/profile" }]

/** Without a pathname nothing is marked active (used as the Suspense fallback). */
export function SettingsNavLinks({ pathname }: { pathname?: string }) {
  return (
    <nav aria-label="Settings" className="flex gap-1 border-b pb-2">
      {SETTINGS_ITEMS.map((item) => {
        const active = pathname ? isActivePath(pathname, item.href) : false
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              active ? "bg-muted text-foreground" : "text-muted-foreground"
            )}
          >
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}

export function SettingsNav() {
  const pathname = usePathname()
  return <SettingsNavLinks pathname={pathname} />
}
