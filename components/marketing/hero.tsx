import { CaretRightIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"

import { whiteButton } from "@/components/marketing/button-styles"
import { DashboardMockup } from "@/components/marketing/dashboard-mockup"
import { HeroRibbon } from "@/components/marketing/hero-ribbon"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Landing page hero: pitch and CTAs on the left, the product window bleeding off the bottom-right,
 * and the animated ribbon behind both. A little taller than the screen, so the window peeks below
 * the fold. It is always dark, whatever the stored theme: the `dark` class switches every semantic
 * token inside it to its dark value. The ribbon lives inside the hero, so it never shows under the
 * sticky header.
 */
export function MarketingHero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="dark relative isolate flex min-h-[109svh] flex-col overflow-hidden border-b bg-background text-foreground [color-scheme:dark]"
    >
      <div aria-hidden className="absolute inset-0 -z-10 max-md:opacity-60">
        <HeroRibbon />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 md:px-8">
        <div className="flex max-w-[30rem] flex-col items-start pt-14 md:pt-20">
          <a
            href="#features"
            className="group/pill inline-flex items-center gap-2.5 rounded-md border bg-background/60 py-1 pr-2 pl-2.5 text-xs font-medium backdrop-blur-sm outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span>New</span>
            <span className="h-4 w-px bg-border" aria-hidden />
            <span className="font-mono text-primary">Card payments with Stripe</span>
            <CaretRightIcon
              className="size-3 text-muted-foreground transition-transform group-hover/pill:translate-x-0.5"
              aria-hidden
            />
          </a>

          <h1
            id="hero-heading"
            className="mt-5 font-heading text-5xl leading-[1.02] font-semibold tracking-tight text-balance md:text-[3.5rem]"
          >
            Send invoices. Get paid by card.
          </h1>

          <p className="mt-5 text-lg leading-snug text-pretty text-muted-foreground md:text-xl">
            Simple invoicing for <strong className="font-medium text-foreground">freelancers</strong>, with{" "}
            <strong className="font-medium text-foreground">PDFs</strong>,{" "}
            <strong className="font-medium text-foreground">email</strong> and{" "}
            <strong className="font-medium text-foreground">card payments</strong> built in.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <Link href="/auth/sign-up" className={cn(buttonVariants({ size: "lg" }), whiteButton, "px-4")}>
              Get started
              <CaretRightIcon data-icon="inline-end" />
            </Link>
            <Link href="/auth/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-4")}>
              Log in
            </Link>
          </div>
        </div>

        {/*
          Below xl the window sits under the CTAs, cropped. From xl it moves to the right, starts a
          third of the way down and runs to the hero's bottom edge, bleeding off the right side.
        */}
        <div className="relative -mr-4 mt-14 h-80 overflow-hidden md:-mr-8 md:h-[30rem] xl:absolute xl:top-[35%] xl:bottom-0 xl:left-[38%] xl:mt-0 xl:mr-0 xl:h-auto xl:w-[1060px] xl:rounded-t-xl">
          <DashboardMockup className="w-[760px] origin-top-left max-md:scale-[0.55] md:w-[1100px] xl:w-full" />
          {/* The window dissolves into the hero's bottom edge. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent"
          />
        </div>
      </div>
    </section>
  )
}
