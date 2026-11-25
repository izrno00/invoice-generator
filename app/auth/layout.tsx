import Link from "next/link"

import { AuthRibbons } from "@/components/auth/auth-ribbons"
import { Logo } from "@/components/brand/logo"

export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return (
    <main className="relative isolate flex flex-1 flex-col items-center justify-center px-4 pt-24 pb-10 md:px-10 lg:px-[100px]">
      <AuthRibbons className="hidden md:block" />
      {/* Wordmark top-left, aligned to a centred content column; the card stays centred. */}
      <header className="absolute inset-x-0 top-0">
        <div className="mx-auto flex h-18 max-w-7xl items-center px-4 md:px-10">
          <Link href="/" className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Logo variant="wordmark" className="h-6" />
          </Link>
        </div>
      </header>
      {/* Soft drop shadow so the card lifts off the ribbons. */}
      <div className="w-full max-w-sm **:data-[slot=card]:shadow-2xl">{children}</div>
    </main>
  )
}
