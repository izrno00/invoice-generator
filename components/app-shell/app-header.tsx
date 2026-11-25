import Link from "next/link"
import { Suspense } from "react"

import { MainNav } from "@/components/app-shell/main-nav"
import { MobileNav } from "@/components/app-shell/mobile-nav"
import { NavLinks } from "@/components/app-shell/nav-links"
import { NavUser } from "@/components/app-shell/nav-user"
import { Skeleton } from "@/components/ui/skeleton"
import { requireUser } from "@/lib/dal/auth"

/** Reads the session, so it renders inside a Suspense boundary. */
async function UserMenu() {
  const user = await requireUser()
  return <NavUser email={user.email} />
}

/** Same footprint as the avatar button, so nothing shifts when it streams in. */
function UserMenuSkeleton() {
  return (
    <div className="flex size-9 items-center justify-center" aria-hidden>
      <Skeleton className="size-8 rounded-full" />
    </div>
  )
}

/** App header (Tech.md §12). Everything except the user menu prerenders. */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center gap-2 px-4 md:gap-6 md:px-6">
        <MobileNav />
        <Link
          href="/dashboard"
          className="rounded-md font-heading text-base font-semibold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Invoice Generator
        </Link>
        <Suspense fallback={<NavLinks className="hidden md:flex" />}>
          <MainNav className="hidden md:flex" />
        </Suspense>
        <div className="ml-auto flex items-center">
          <Suspense fallback={<UserMenuSkeleton />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
