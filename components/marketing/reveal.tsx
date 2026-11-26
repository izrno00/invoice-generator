"use client"

import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

/**
 * The landing page entrance, shared by Reveal and FeatureCard (the hero's CSS `animate-fade-up` in
 * app/globals.css uses the same numbers): rise 40px, fade in and sharpen from an 8px blur over
 * 0.8s. It starts once the block is 10% of the screen height above the bottom edge, so it's seen.
 * With reduced motion the block simply shows.
 */
export function revealMotion(reduceMotion: boolean | null, delay = 0) {
  return {
    initial: reduceMotion ? false : { opacity: 0, y: 40, filter: "blur(8px)" },
    // `filter: none` once done, so a settled block isn't kept on its own compositing layer.
    whileInView: { opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } },
    viewport: { once: true, margin: "0px 0px -10% 0px" },
    transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
  } as const
}

type RevealProps = {
  children: ReactNode
  className?: string
  /** Seconds to wait once in view; stagger siblings in a row with it (0, 0.08, 0.16). */
  delay?: number
  /** Render as a list item when the block is a card in a list. */
  as?: "div" | "li"
}

/** Landing page scroll reveal: one block (a heading with its text, a card, a visual) enters as a whole. */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const motionProps = { className, ...revealMotion(useReducedMotion(), delay) }

  return as === "li" ? (
    <motion.li {...motionProps}>{children}</motion.li>
  ) : (
    <motion.div {...motionProps}>{children}</motion.div>
  )
}
