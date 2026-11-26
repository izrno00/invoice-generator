import type { Metadata } from "next"

import { Logo } from "@/components/brand/logo"

export const metadata: Metadata = {
  title: "Pay invoice",
  // Reachable only through the link in the invoice email (PRD §6.9 AC7).
  robots: { index: false, follow: false },
  // Keeps the secret token in the URL out of Referer headers.
  referrer: "no-referrer",
}

/** Public pages for the invoice's client: no app shell, no login. */
export default function PayLayout({ children }: LayoutProps<"/pay">) {
  return (
    <main className="flex flex-1 flex-col items-center bg-muted/40 px-4 py-10 sm:justify-center md:px-10 lg:px-[100px]">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Logo className="h-7 self-center" />
        {children}
      </div>
    </main>
  )
}
