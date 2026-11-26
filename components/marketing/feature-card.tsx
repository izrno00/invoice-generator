"use client"

import { CheckIcon, CornersOutIcon } from "@phosphor-icons/react"
import { motion, useReducedMotion } from "motion/react"
import Link from "next/link"

import { whiteButton } from "@/components/marketing/button-styles"
import { revealMotion } from "@/components/marketing/reveal"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type FeatureCardProps = {
  title: string
  description: string
  bullets: readonly string[]
  /** CSS background for the soft glow behind the visual, e.g. a radial-gradient. */
  glow: string
  /** Server-rendered picture of the feature; shown in the card and, larger, in the dialog. */
  visual: React.ReactNode
  /** Position in the grid, for a staggered entrance. */
  index: number
  className?: string
  /** Height of the visual area in the card. */
  visualClassName?: string
}

/** The soft brand glow behind a card's content. */
function Glow({ glow }: { glow: string }) {
  return <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-60" style={{ background: glow }} />
}

/** The picture area. Decorative. In the dialog it brings its own glow; in the card, the card has one. */
function VisualStage({ glow, visual, className }: { glow?: string; visual: React.ReactNode; className?: string }) {
  return (
    <div inert aria-hidden className={cn("relative isolate overflow-hidden select-none", className)}>
      {glow && <Glow glow={glow} />}
      {visual}
    </div>
  )
}

/**
 * One Features bento card: title, an expand button that opens a detail dialog (bigger visual,
 * description, facts and Get started), and the visual. Enters like every landing block
 * (`revealMotion`), staggered by its position in the row.
 */
export function FeatureCard({
  title,
  description,
  bullets,
  glow,
  visual,
  index,
  className,
  visualClassName,
}: FeatureCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.article
      className={cn(
        "relative isolate flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10",
        className
      )}
      {...revealMotion(reduceMotion, (index % 3) * 0.08)}
    >
      <Glow glow={glow} />
      <div className="flex items-start justify-between gap-4 p-6 md:p-7">
        <h3 className="max-w-md font-heading text-xl leading-snug font-medium text-balance md:text-2xl">{title}</h3>
        <Dialog>
          <DialogTrigger
            render={<Button variant="outline" size="icon-sm" className="shrink-0" aria-label={`More about: ${title}`} />}
          >
            <CornersOutIcon />
          </DialogTrigger>
          <DialogContent className="dark max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto text-foreground sm:max-w-2xl">
            {/* Same height as in the card, so the visual's layout holds. */}
            <VisualStage glow={glow} visual={visual} className={cn("-mx-6 -mt-6 shrink-0 bg-card", visualClassName)} />
            <DialogHeader>
              <DialogTitle className="text-lg">{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <ul className="flex flex-col gap-2">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2.5">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Link href="/auth/sign-up" className={cn(buttonVariants(), whiteButton)}>
                Get started
              </Link>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <VisualStage visual={visual} className={cn("flex-1", visualClassName)} />
    </motion.article>
  )
}
