"use client"

import { ListIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { useState } from "react"

import { Logo } from "@/components/brand/logo"
import { MARKETING_LINKS } from "@/components/marketing/marketing-links"
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

/** Below md the section links and Sign in move into a sheet. */
export function MarketingMobileNav() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="-ml-2 md:hidden" aria-label="Open menu" />}
      >
        <ListIcon />
      </SheetTrigger>
      {/* The sheet portals out of the hero, so it opts into dark itself. */}
      <SheetContent side="left" className="dark text-foreground [color-scheme:dark]">
        <SheetHeader>
          <SheetTitle>
            <Logo className="h-6" />
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Main" className="flex flex-col gap-1 px-2">
          {MARKETING_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={close}
              className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}
            >
              {link.title}
            </a>
          ))}
          <Link href="/auth/login" onClick={close} className={cn(buttonVariants({ variant: "ghost" }), "justify-start")}>
            Sign in
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
