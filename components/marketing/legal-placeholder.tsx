import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

/**
 * Stand-in for a legal page that isn't written yet, so the footer's legal links don't 404.
 * Always dark, like the rest of the marketing pages.
 */
export function LegalPlaceholder({ title }: { title: string }) {
  return (
    <section className="dark flex flex-1 flex-col border-b bg-background text-foreground [color-scheme:dark]">
      <div className="mx-auto w-full max-w-3xl px-4 py-20 md:px-8 md:py-28">
        <h1 className="font-heading text-3xl leading-[1.1] font-semibold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-4 text-base text-muted-foreground">This page isn&apos;t published yet. Check back soon.</p>
        <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-8" })}>
          Back to home
        </Link>
      </div>
    </section>
  )
}
