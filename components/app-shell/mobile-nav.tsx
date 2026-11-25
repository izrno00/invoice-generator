"use client"

import { ListIcon } from "@phosphor-icons/react"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { NavLinks } from "@/components/app-shell/nav-links"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

/** Only rendered while the sheet is open, so it never runs during prerender. */
function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname()
  return <NavLinks pathname={pathname} orientation="vertical" onNavigate={onNavigate} className="px-2" />
}

/** Below md the header links move into a sheet (PRD §11.2: menu on mobile). */
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="-ml-2 md:hidden" aria-label="Open menu" />}
      >
        <ListIcon />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>
            <Logo className="h-7" />
          </SheetTitle>
        </SheetHeader>
        <MobileNavLinks onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
