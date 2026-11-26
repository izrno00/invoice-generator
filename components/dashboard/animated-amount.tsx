"use client"

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { useLayoutEffect } from "react"

import { formatAmount } from "@/lib/invoices/format"

/**
 * An amount that counts up (PRD §6.15 AC9): from zero when it first appears,
 * then from the previous value (e.g. after switching currency). The server
 * renders the final value, so it's right without JavaScript and for screen
 * readers; reduced motion skips the animation.
 */
export function AnimatedAmount({ cents }: { cents: number }) {
  const reduceMotion = useReducedMotion()
  const value = useMotionValue(cents)
  const text = useTransform(value, (latest) => formatAmount(Math.round(latest)))

  // Layout effect: resets to zero before the browser paints the hydrated value.
  useLayoutEffect(() => {
    if (reduceMotion) {
      value.jump(cents)
      return
    }
    const from = value.get() === cents ? 0 : value.get()
    value.jump(from)
    const controls = animate(value, cents, { duration: 0.9, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [cents, reduceMotion, value])

  return (
    <>
      <motion.span aria-hidden>{text}</motion.span>
      <span className="sr-only">{formatAmount(cents)}</span>
    </>
  )
}
