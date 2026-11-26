import { GithubLogoIcon, LinkedinLogoIcon, XLogoIcon } from "@phosphor-icons/react/ssr"
import { cacheLife } from "next/cache"
import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { FooterDots } from "@/components/marketing/footer-dots"
import { MARKETING_LINKS } from "@/components/marketing/marketing-links"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const COLUMNS = [
  { title: "Product", links: MARKETING_LINKS },
  {
    title: "Account",
    links: [
      { title: "Sign in", href: "/auth/login" },
      { title: "Get started", href: "/auth/sign-up" },
    ],
  },
  {
    title: "Legal",
    links: [
      { title: "Privacy policy", href: "/privacy" },
      { title: "Terms of service", href: "/terms" },
    ],
  },
] as const

/** Placeholders until Payable has social accounts; swap in the real profile URLs. */
const SOCIALS = [
  { label: "Payable on GitHub", href: "#", Icon: GithubLogoIcon },
  { label: "Payable on X", href: "#", Icon: XLogoIcon },
  { label: "Payable on LinkedIn", href: "#", Icon: LinkedinLogoIcon },
] as const

const linkClass =
  "rounded-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"

/**
 * Marketing footer, shared by the landing page and the legal pages: logo with a "Payments by
 * Stripe" pill, link columns, then a copyright line and social icons. Always dark, like the
 * landing sections.
 */
export function MarketingFooter() {
  return (
    <footer className="dark relative overflow-hidden bg-background text-foreground [color-scheme:dark]">
      <FooterDots />

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-16 pb-8 md:px-8 md:pt-24">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="flex flex-col items-start gap-6 md:justify-between">
            <Link href="/" className={linkClass}>
              <Logo className="h-6" />
            </Link>
            <Badge variant="outline" className="h-7 gap-2 rounded-md px-2.5 text-sm font-normal text-muted-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-primary" />
              Payments by Stripe
            </Badge>
          </div>

          {/* Phones: Product on the left, Account and Legal stacked on the right. */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 md:gap-x-16 lg:gap-x-24"
          >
            {COLUMNS.map((column, i) => (
              <div key={column.title} className={cn(i === 0 && "row-span-2 sm:row-span-1")}>
                <h2 className="text-sm text-muted-foreground">{column.title}</h2>
                <ul className="mt-6 flex flex-col gap-5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(linkClass, "text-sm font-medium hover:text-muted-foreground")}
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <Separator className="mt-16 md:mt-20" />

        <div className="flex items-center justify-between gap-4 pt-6">
          <p className="text-sm text-muted-foreground">
            © <CopyrightYear /> Payable
          </p>
          <ul className="-mr-2 flex items-center gap-1">
            {SOCIALS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-sm" }),
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

/** With Cache Components, `new Date()` can't run in the prerender; caching it for a day can. */
async function CopyrightYear() {
  "use cache"
  cacheLife("days")
  return new Date().getFullYear()
}
