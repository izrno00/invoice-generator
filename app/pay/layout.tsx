import type { Metadata } from "next"

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
    <main className="flex flex-1 flex-col items-center bg-muted/40 px-4 py-10 sm:justify-center md:px-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <p className="text-center font-heading text-lg font-semibold tracking-tight">Invoice Generator</p>
        {children}
      </div>
    </main>
  )
}
