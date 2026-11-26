import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { whiteButton } from "@/components/marketing/button-styles"
import { MARKETING_LINKS } from "@/components/marketing/marketing-links"
import { MarketingMobileNav } from "@/components/marketing/marketing-mobile-nav"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Landing page top bar: logo, section links, Sign in and Get started. Sticky with a solid
 * background, and always dark like the hero.
 */
export function MarketingNav() {
  return (
    <header className="dark sticky top-0 z-50 border-b bg-background text-foreground [color-scheme:dark]">
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:px-8">
        <div className="flex items-center gap-1">
          <MarketingMobileNav />
          <Link href="/" className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Logo className="h-6" />
          </Link>
        </div>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {MARKETING_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm text-sm font-medium text-foreground outline-none transition-colors hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {link.title}
            </a>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          <Link href="/auth/login" className={cn(buttonVariants({ variant: "outline" }), "hidden sm:inline-flex")}>
            Sign in
          </Link>
          <Link href="/auth/sign-up" className={cn(buttonVariants(), whiteButton)}>
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}
