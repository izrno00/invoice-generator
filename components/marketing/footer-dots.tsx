import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

type Side = "left" | "right"

/** Grid pitch in px; the lime lights sit on the same grid as the muted dots. */
const TILE = 16
const LIGHTS_PER_SIDE = 20
/** How long a light stays on / off, in seconds. Each light draws its own pair. */
const ON_RANGE = [2, 8] as const
const OFF_RANGE = [3, 12] as const

/**
 * The patches the muted grid shows through, in px from the panel's outer edge and the top:
 * [x, y, x radius, y radius]. Lights are placed inside them, so they always sit on visible dots.
 */
const CLUSTERS: Record<Side, [number, number, number, number][]> = {
  left: [
    [150, 110, 170, 110],
    [300, 280, 140, 100],
    [130, 460, 190, 110],
  ],
  right: [
    [120, 90, 160, 100],
    [280, 300, 150, 110],
    [170, 470, 180, 100],
  ],
}

type Light = {
  col: number
  row: number
  /** Seconds for one on + off round. */
  cycle: number
  /** Share of the round the light is on, in %. */
  onPercent: number
  /** Where in its round the light starts, in seconds (used as a negative delay). */
  phase: number
}

/** Small seeded PRNG (mulberry32), so the "random" city is the same on every render. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** Picks distinct grid cells inside the side's clusters, each with its own on/off timing. */
function makeLights(side: Side, seed: number): Light[] {
  const random = seeded(seed)
  const between = ([min, max]: readonly [number, number]) => min + random() * (max - min)
  const taken = new Set<string>()
  const lights: Light[] = []

  while (lights.length < LIGHTS_PER_SIDE) {
    const [cx, cy, rx, ry] = CLUSTERS[side][Math.floor(random() * CLUSTERS[side].length)]
    // Uniform over the inner 80% of the ellipse, where the dots are clearly visible.
    const angle = random() * Math.PI * 2
    const r = Math.sqrt(random()) * 0.8
    const col = Math.floor((cx + Math.cos(angle) * rx * r) / TILE)
    const row = Math.floor((cy + Math.sin(angle) * ry * r) / TILE)
    const key = `${col}-${row}`
    if (col < 0 || row < 0 || taken.has(key)) continue
    taken.add(key)

    const on = between(ON_RANGE)
    const cycle = round1(on + between(OFF_RANGE))
    lights.push({
      col,
      row,
      cycle,
      onPercent: round1((on / cycle) * 100),
      phase: round1(random() * cycle),
    })
  }
  return lights
}

const LIGHTS: Record<Side, Light[]> = { left: makeLights("left", 7), right: makeLights("right", 23) }

const lightName = (side: Side, i: number) => `footer-light-${side}-${i}`

/**
 * One keyframes rule per light: on from 0% to its on-share, off for the rest. `step-end` makes
 * every switch instant, like a lamp. Motion only runs when the visitor hasn't asked for less.
 */
const LIGHTS_CSS = (["left", "right"] as const)
  .flatMap((side) =>
    LIGHTS[side].map((light, i) => {
      const name = lightName(side, i)
      return (
        `@keyframes ${name}{0%{opacity:1}${light.onPercent}%,100%{opacity:0}}` +
        `@media (prefers-reduced-motion:no-preference){.${name}{animation:${name} ${light.cycle}s step-end -${light.phase}s infinite}}`
      )
    })
  )
  .join("")

/**
 * Footer decoration: a muted dot grid in patches on both sides of the page, like a city seen
 * from far above, with lime "windows" switching on and off at their own random pace. Fades out
 * toward the content and only shows from xl, where the page has side gutters. Purely decorative.
 */
export function FooterDots() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
      <style href="footer-lights" precedence="default">
        {LIGHTS_CSS}
      </style>
      <DotPanel side="left" />
      <DotPanel side="right" />
    </div>
  )
}

function DotPanel({ side }: { side: Side }) {
  const isLeft = side === "left"
  const edge = isLeft ? "left" : "right"
  const fade = `linear-gradient(to ${isLeft ? "right" : "left"}, #000 35%, transparent)`
  const patches = CLUSTERS[side]
    .map(([x, y, rx, ry]) => {
      const atX = isLeft ? `${x}px` : `calc(100% - ${x}px)`
      return `radial-gradient(ellipse ${rx}px ${ry}px at ${atX} ${y}px, #000 20%, transparent 100%)`
    })
    .join(", ")

  const grid: CSSProperties = {
    backgroundImage: "radial-gradient(circle, var(--color-muted-foreground) 1px, transparent 1.5px)",
    backgroundSize: `${TILE}px ${TILE}px`,
    backgroundPosition: `${edge} top`,
    maskImage: patches,
  }

  return (
    // Reaches from the page edge 4rem past the content column's edge (max-w-6xl = 72rem).
    <div
      className={cn("absolute inset-y-0 w-[calc((100%-72rem)/2+4rem)]", isLeft ? "left-0" : "right-0")}
      style={{ maskImage: fade }}
    >
      <div className="absolute inset-0 opacity-30" style={grid} />
      {LIGHTS[side].map((light, i) => (
        <span
          key={`${light.col}-${light.row}`}
          className={cn("absolute size-[3px] rounded-full bg-primary", lightName(side, i))}
          style={{
            [edge]: light.col * TILE + TILE / 2 - 1.5,
            top: light.row * TILE + TILE / 2 - 1.5,
            // The state the animation starts in, so the first frame (and reduced motion) matches it.
            opacity: light.phase < (light.onPercent / 100) * light.cycle ? 1 : 0,
          }}
        />
      ))}
    </div>
  )
}
