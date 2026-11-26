"use client"

import { useEffect, useRef } from "react"

import {
  COMET_TAIL,
  cometsAt,
  endFade,
  frameAt,
  LINE_COUNT,
  lineShare,
  linePoint,
  lineStrength,
  type Frame,
} from "@/components/marketing/ribbon-geometry"
import { cn } from "@/lib/utils"

/** Samples per line. Where the ends fade, each sample is its own stroke so the fade is smooth. */
const SAMPLES = 200
const LINE_WIDTH = 1.5
const LINE_ALPHA = 0.95

/** Comets: a touch thicker and brighter than the lines, but still subtle. */
const COMET_ALPHA = 0.75
const COMET_WIDTH = 2
const COMET_SEGMENTS = 18

type Palette = { lines: string[]; comet: string }

/**
 * Reads the theme tokens as colours canvas understands. A probe element resolves `var(...)` and
 * `color-mix(...)`, so each line gets its own step from teal (top) through lime to yellow-lime.
 */
function readPalette(host: HTMLElement): Palette {
  const probe = document.createElement("span")
  probe.style.display = "none"
  host.appendChild(probe)
  const read = (value: string) => {
    probe.style.color = value
    return getComputedStyle(probe).color
  }
  const lines = Array.from({ length: LINE_COUNT }, (_, line) => {
    const u = lineShare(line)
    return u < 0.5
      ? read(`color-mix(in oklch, var(--ribbon-start), var(--primary) ${Math.round(u * 200)}%)`)
      : read(`color-mix(in oklch, var(--primary), var(--ribbon-end) ${Math.round((u - 0.5) * 200)}%)`)
  })
  const palette = { lines, comet: read("var(--comet-violet)") }
  probe.remove()
  return palette
}

function drawRibbon(ctx: CanvasRenderingContext2D, frame: Frame, palette: Palette) {
  ctx.lineWidth = LINE_WIDTH
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  for (let line = 0; line < LINE_COUNT; line++) {
    ctx.strokeStyle = palette.lines[line]
    const strength = LINE_ALPHA * lineStrength(line)
    let previous = linePoint(frame, line, 0)
    let solid: { x: number; y: number }[] = []

    const flushSolid = () => {
      if (solid.length < 2) return
      ctx.globalAlpha = strength
      ctx.beginPath()
      ctx.moveTo(solid[0].x, solid[0].y)
      for (let i = 1; i < solid.length; i++) ctx.lineTo(solid[i].x, solid[i].y)
      ctx.stroke()
    }

    for (let i = 1; i <= SAMPLES; i++) {
      const s = i / SAMPLES
      const point = linePoint(frame, line, s)
      const fade = Math.min(endFade((i - 1) / SAMPLES), endFade(s))
      if (fade >= 1) {
        if (solid.length === 0) solid.push(previous)
        solid.push(point)
      } else {
        flushSolid()
        solid = []
        const alpha = strength * endFade((i - 0.5) / SAMPLES)
        if (alpha > 0.004) {
          ctx.globalAlpha = alpha
          ctx.beginPath()
          ctx.moveTo(previous.x, previous.y)
          ctx.lineTo(point.x, point.y)
          ctx.stroke()
        }
      }
      previous = point
    }
    flushSolid()
  }
  ctx.globalAlpha = 1
}

function drawComets(ctx: CanvasRenderingContext2D, frame: Frame, palette: Palette, elapsed: number) {
  ctx.lineWidth = COMET_WIDTH
  ctx.lineCap = "round"
  const color = palette.comet

  for (const comet of cometsAt(elapsed)) {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    const tail = comet.head - COMET_TAIL

    // Tail: short segments whose alpha rises from the tail to the head.
    for (let i = 0; i < COMET_SEGMENTS; i++) {
      const a = tail + (COMET_TAIL * i) / COMET_SEGMENTS
      const b = tail + (COMET_TAIL * (i + 1)) / COMET_SEGMENTS
      if (b <= 0 || a >= 1) continue
      const sa = Math.max(0, a)
      const sb = Math.min(1, b)
      const strength = (i + 1) / COMET_SEGMENTS
      ctx.globalAlpha = COMET_ALPHA * strength * strength * endFade((sa + sb) / 2)
      const p = linePoint(frame, comet.line, sa)
      const q = linePoint(frame, comet.line, sb)
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(q.x, q.y)
      ctx.stroke()
    }

    // Head: a small, softly glowing dot.
    if (comet.head > 0 && comet.head < 1) {
      const head = linePoint(frame, comet.line, comet.head)
      ctx.globalAlpha = COMET_ALPHA * endFade(comet.head)
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(head.x, head.y, 1.6, 0, 2 * Math.PI)
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }
  ctx.globalAlpha = 1
}

/**
 * The hero's animated ribbon: 16 clean lines fanning in from the bottom-left, pinching behind the
 * product window and fanning out again in the top-right, with pairs of purple comets running
 * along them. Geometry and timing live in `ribbon-geometry.ts`; colours come from the
 * theme tokens in globals.css.
 *
 * Under `prefers-reduced-motion` it draws a single still frame with no comets. The loop stops while
 * the hero is off-screen. It is decorative, so it's hidden from assistive tech.
 */
export function HeroRibbon({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const palette = readPalette(canvas.parentElement ?? document.body)
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let width = 0
    let height = 0
    let frameId = 0
    let visible = true
    let startedAt = performance.now()
    let pausedAt: number | null = null

    const draw = (now: number) => {
      if (width === 0 || height === 0) return
      const elapsed = motion.matches ? 0 : (now - startedAt) / 1000
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const scale = canvas.width / width
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      const frame = frameAt(width, height, elapsed)
      drawRibbon(ctx, frame, palette)
      if (!motion.matches) drawComets(ctx, frame, palette, elapsed)
      canvas.dataset.ready = "true"
    }

    const loop = (now: number) => {
      draw(now)
      frameId = requestAnimationFrame(loop)
    }

    const start = () => {
      cancelAnimationFrame(frameId)
      if (motion.matches || !visible) {
        draw(performance.now())
        return
      }
      if (pausedAt !== null) {
        // Resume where it left off instead of jumping ahead.
        startedAt += performance.now() - pausedAt
        pausedAt = null
      }
      frameId = requestAnimationFrame(loop)
    }

    const stop = () => {
      cancelAnimationFrame(frameId)
      if (pausedAt === null) pausedAt = performance.now()
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      draw(performance.now())
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    intersectionObserver.observe(canvas)
    const onMotionChange = () => {
      startedAt = performance.now()
      pausedAt = null
      start()
    }
    motion.addEventListener("change", onMotionChange)

    resize()
    start()

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      motion.removeEventListener("change", onMotionChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "pointer-events-none size-full opacity-0 transition-opacity duration-700 data-[ready=true]:opacity-100",
        className
      )}
    />
  )
}
