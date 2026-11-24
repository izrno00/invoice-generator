import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

/** Placeholder landing page (PRD §6.16). The full marketing page comes later. */
export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Invoice Generator</h1>
      <p className="max-w-md text-balance text-muted-foreground">
        Create invoices, email them to your clients and get paid by card, in a couple of minutes.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/auth/sign-up" className={buttonVariants({ size: "lg" })}>
          Sign up
        </Link>
        <Link href="/auth/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Log in
        </Link>
      </div>
    </main>
  )
}
