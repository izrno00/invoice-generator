/**
 * Pure maths behind the hero ribbon (components/marketing/hero-ribbon.tsx), kept free of the DOM
 * so it can be unit-tested.
 *
 * Every line is two smooth arcs (cubic Hermite segments) joined at a shared tangent:
 *  1. from the bottom-left fan (upper lines enter at the left edge, lower ones rise from the
 *     bottom edge) up to a tight pinch behind the product window's left side, and
 *  2. from the pinch out into a matching fan in the top-right (steep lines leave through the top
 *     edge, gentle ones through the right edge).
 * Lines leave the pinch at different angles, so the lower (lime) lines climb steeply and cross the
 * upper (teal) ones: that crossing is the ribbon's twist. Arcs can't wiggle, so there are no
 * S-bends; at most one gentle inflection where the sweep turns from climbing to flattening.
 *
 * Coordinates are fractions of the hero box (below the header), angles are in screen pixels.
 */

export type Point = { x: number; y: number }

/** Number of hairlines in the ribbon. */
export const LINE_COUNT = 16

/** Share of each line's length that fades in at the left end and out at the right end. */
const FADE_IN = 0.2
const FADE_OUT = 0.16

/** Slow crossing: each line drifts on its own phase, so neighbours slide past each other. */
const DRIFT_PERIODS = { angle: 21, start: 27, pinch: 17 }

type LineGeometry = {
  start: Point
  startTangent: Point
  pinch: Point
  /** Same direction on both sides of the pinch (a smooth join), sized to each arc's length. */
  pinchTangentIn: Point
  pinchTangentOut: Point
  end: Point
  endTangent: Point
  /** Share of the length in the first arc, so `s` moves at a roughly even speed. */
  split: number
}

/** Ribbon geometry for one frame, in pixels. */
export type Frame = {
  width: number
  height: number
  /** Seconds since the animation started. */
  time: number
  lines: LineGeometry[]
}

/** 0 for the top (teal) line, 1 for the bottom (lime) line. */
export function lineShare(line: number, count: number = LINE_COUNT): number {
  return count <= 1 ? 0 : line / (count - 1)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function fromAngle(degrees: number, length: number): Point {
  const radians = (degrees * Math.PI) / 180
  return { x: Math.cos(radians) * length, y: Math.sin(radians) * length }
}

function angleOf(v: Point): number {
  return (Math.atan2(v.y, v.x) * 180) / Math.PI
}

/** Where line `u` enters: along a curve that hugs the bottom-left corner. */
function startShare(u: number): Point {
  // Quadratic Bézier from the left edge, past the corner, to the bottom edge.
  const a = { x: -0.03, y: 0.8 }
  const b = { x: 0.02, y: 1.08 }
  const c = { x: 0.24, y: 1.06 }
  const k = 1 - u
  return { x: k * k * a.x + 2 * k * u * b.x + u * u * c.x, y: k * k * a.y + 2 * k * u * b.y + u * u * c.y }
}

/** Where line `v` leaves: along a curve that hugs the top-right corner (0 = top, 1 = right). */
function endShare(v: number): Point {
  // Quadratic Bézier from the top edge, past the corner, down the right edge.
  const a = { x: 0.78, y: -0.04 }
  const b = { x: 1.03, y: -0.05 }
  const c = { x: 1.03, y: 0.3 }
  const k = 1 - v
  return { x: k * k * a.x + 2 * k * v * b.x + v * v * c.x, y: k * k * a.y + 2 * k * v * b.y + v * v * c.y }
}

function lineGeometry(width: number, height: number, time: number, line: number, count: number): LineGeometry {
  const u = lineShare(line, count)
  const wave = (period: number, phase: number) => Math.sin((2 * Math.PI * time) / period + phase)

  const startU = Math.min(1, Math.max(0, u ** 1.25 + 0.025 * wave(DRIFT_PERIODS.start, u * 3.1)))
  const s = startShare(startU)
  const start = { x: s.x * width, y: s.y * height }

  const pinch = {
    x: (0.485 + 0.01 * (u - 0.5)) * width,
    y: (0.63 + 0.05 * (u - 0.5) + 0.01 * wave(DRIFT_PERIODS.pinch, u * 4.3)) * height,
  }
  // The top-right mirrors the bottom-left fan: steep (lime) lines leave through the top edge,
  // gentle (teal) ones through the right edge.
  const e = endShare(1 - u)
  const end = { x: e.x * width, y: e.y * height }

  const first = { x: pinch.x - start.x, y: pinch.y - start.y }
  const second = { x: end.x - pinch.x, y: end.y - pinch.y }
  const firstLength = Math.hypot(first.x, first.y)
  const secondLength = Math.hypot(second.x, second.y)

  // Upper (teal) lines leave the pinch on a gentle diagonal; lower (lime) ones climb almost
  // straight up before flattening, which opens the wide fan above the product window.
  const pinchAngle = lerp(-30, -74, u) + 4 * wave(DRIFT_PERIODS.angle, u * 2.6)

  const pinchTangentIn = fromAngle(pinchAngle, firstLength)
  const pinchTangentOut = fromAngle(pinchAngle, secondLength)

  // Each arc may bend only one way. Aim the free end at the arc's inner control point, then
  // flatten it a little: the control polygon stays convex, so there is no S-bend.
  const innerIn = { x: pinch.x - pinchTangentIn.x / 3, y: pinch.y - pinchTangentIn.y / 3 }
  const innerOut = { x: pinch.x + pinchTangentOut.x / 3, y: pinch.y + pinchTangentOut.y / 3 }
  const startAngle = angleOf({ x: innerIn.x - start.x, y: innerIn.y - start.y }) * 0.85
  const endAngle = angleOf({ x: end.x - innerOut.x, y: end.y - innerOut.y }) * 0.6

  return {
    start,
    startTangent: fromAngle(startAngle, firstLength),
    pinch,
    pinchTangentIn,
    pinchTangentOut,
    end,
    endTangent: fromAngle(endAngle, secondLength),
    split: firstLength / (firstLength + secondLength),
  }
}

export function frameAt(width: number, height: number, time: number, count: number = LINE_COUNT): Frame {
  return {
    width,
    height,
    time,
    lines: Array.from({ length: count }, (_, line) => lineGeometry(width, height, time, line, count)),
  }
}

/** Cubic Hermite point between `p0` and `p1` with tangents `m0` and `m1`. */
function hermite(p0: Point, m0: Point, p1: Point, m1: Point, t: number): Point {
  const t2 = t * t
  const t3 = t2 * t
  const h00 = 2 * t3 - 3 * t2 + 1
  const h10 = t3 - 2 * t2 + t
  const h01 = -2 * t3 + 3 * t2
  const h11 = t3 - t2
  return {
    x: h00 * p0.x + h10 * m0.x + h01 * p1.x + h11 * m1.x,
    y: h00 * p0.y + h10 * m0.y + h01 * p1.y + h11 * m1.y,
  }
}

/** Point of line `i` at `s` (0 = left end, 1 = top-right end), in pixels. */
export function linePoint(frame: Frame, line: number, s: number): Point {
  const g = frame.lines[line]
  const clamped = Math.min(1, Math.max(0, s))
  if (clamped <= g.split) {
    return hermite(g.start, g.startTangent, g.pinch, g.pinchTangentIn, clamped / g.split)
  }
  return hermite(g.pinch, g.pinchTangentOut, g.end, g.endTangent, (clamped - g.split) / (1 - g.split))
}

/** 0 at both ends, 1 in between: the lines dissolve instead of stopping abruptly. */
export function endFade(s: number): number {
  if (s <= 0 || s >= 1) return 0
  const fadeIn = Math.min(1, s / FADE_IN)
  const fadeOut = Math.min(1, (1 - s) / FADE_OUT)
  return smoothstep(Math.min(fadeIn, fadeOut))
}

/** A fixed brightness per line (0.78–1), so the bundle isn't perfectly uniform. */
export function lineStrength(line: number): number {
  const hash = Math.sin(line * 12.9898 + 4.1414) * 43758.5453
  return 0.78 + 0.22 * (hash - Math.floor(hash))
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

// ---------------------------------------------------------------------------------------------
// Comets
// ---------------------------------------------------------------------------------------------

/** All comets are purple (`--comet-violet`). */
export type Comet = {
  line: number
  /** Position of the head along the line, 0–1 (it runs a little past 1 so the tail can leave). */
  head: number
}

/** Seconds a comet takes to travel the whole ribbon. */
export const COMET_DURATION = 3.5
/** Pause after the second pair, before the cycle repeats. */
export const COMET_GAP = 0.5
/** Tail length as a share of the path. */
export const COMET_TAIL = 0.08
/** A pair of comets, then a second pair on other lines, then the gap. */
export const COMET_CYCLE = 2 * COMET_DURATION + COMET_GAP

/** Small, seeded PRNG (mulberry32), so each cycle's lines are random but reproducible. */
function random(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Four distinct lines for one cycle: two for the first pair, two for the second. */
export function cycleLines(cycle: number, count: number = LINE_COUNT, seed = 7): [number, number, number, number] {
  const next = random(seed * 100_003 + cycle * 9_973)
  // Keep the comets off the outermost lines, where they'd hug the edge of the bundle.
  const margin = Math.max(1, Math.floor(count * 0.1))
  const picked: number[] = []
  while (picked.length < 4) {
    const line = margin + Math.floor(next() * (count - 2 * margin))
    if (!picked.includes(line)) picked.push(line)
  }
  return [picked[0], picked[1], picked[2], picked[3]]
}

/** The comets on screen `elapsed` seconds after the animation started. */
export function cometsAt(elapsed: number, count: number = LINE_COUNT, seed = 7): Comet[] {
  const time = Math.max(0, elapsed)
  const cycle = Math.floor(time / COMET_CYCLE)
  const t = time - cycle * COMET_CYCLE
  const [firstA, firstB, secondA, secondB] = cycleLines(cycle, count, seed)
  // Steady speed: the faded ends already let a comet slip in and out softly.
  const head = (start: number) => ((t - start) / COMET_DURATION) * (1 + COMET_TAIL)

  if (t < COMET_DURATION) {
    const h = head(0)
    return [
      { line: firstA, head: h },
      { line: firstB, head: h },
    ]
  }
  if (t < 2 * COMET_DURATION) {
    const h = head(COMET_DURATION)
    return [
      { line: secondA, head: h },
      { line: secondB, head: h },
    ]
  }
  return []
}
