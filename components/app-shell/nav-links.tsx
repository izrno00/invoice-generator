import Link from "next/link"

import { isActivePath, NAV_ITEMS } from "@/components/app-shell/nav-items"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The main nav links. Without a pathname nothing is marked active, which is
 * what the Suspense fallbacks render before the pathname is known.
 */
export function NavLinks({
  pathname,
  orientation = "horizontal",
  onNavigate,
  className,
}: {
  pathname?: string
  orientation?: "horizontal" | "vertical"
  onNavigate?: () => void
  className?: string
}) {
  const vertical = orientation === "vertical"

  return (
    <nav aria-label="Main" className={cn("flex gap-1", vertical ? "flex-col" : "items-center", className)}>
      {NAV_ITEMS.map((item) => {
        const active = pathname ? isActivePath(pathname, item.href) : false
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              buttonVariants({ variant: "ghost", size: vertical ? "lg" : "sm" }),
              vertical && "w-full justify-start",
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
