import { cn } from "@/lib/utils"

/**
 * Silky ribbon illustration behind the auth card.
 *
 * The ribbons sit on a large ring whose centre is off-screen to the top-right, so only a
 * diagonal arc of it is visible behind the card. The ring turns once every two minutes
 * (`animate-ribbon-spin` in globals.css), which makes the ribbons flow through that arc while
 * the arc itself stays put. It stops under `prefers-reduced-motion` and is hidden on phones.
 *
 * Everything is generated here at module load from a fixed seed, so the markup is the same on
 * every render. Colours are the preset's violet chart tokens with lime (`--primary`) accents.
 */
export function AuthRibbons({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      {/* Ring centre at (118%, -38%) of the page; outer radius 85vw. */}
      <div className="absolute top-[calc(-38%-85vw)] left-[calc(118%-85vw)] size-[170vw] animate-ribbon-spin will-change-transform motion-reduce:animate-none">
        <svg viewBox="-1000 -1000 2000 2000" className="size-full">
          <defs>
            {RIBBONS.map((ribbon) => (
              <linearGradient
                key={ribbon.id}
                id={ribbon.id}
                gradientUnits="userSpaceOnUse"
                x1={ribbon.from[0]}
                y1={ribbon.from[1]}
                x2={ribbon.to[0]}
                y2={ribbon.to[1]}
              >
                {/* Fade both ends so ribbons dissolve instead of stopping abruptly. */}
                <stop offset={0} stopOpacity={0} style={{ stopColor: ribbon.color }} />
                <stop offset={0.28} stopOpacity={1} style={{ stopColor: ribbon.color }} />
                <stop offset={0.72} stopOpacity={1} style={{ stopColor: ribbon.color }} />
                <stop offset={1} stopOpacity={0} style={{ stopColor: ribbon.color }} />
              </linearGradient>
            ))}
          </defs>
          {RIBBONS.map((ribbon) => (
            <g key={ribbon.id}>
              {ribbon.strips.map((strip, i) => (
                <path key={i} d={strip.d} fill={`url(#${ribbon.id})`} fillOpacity={strip.opacity} />
              ))}
              {ribbon.strands.map((strand, i) => (
                <path
                  key={i}
                  d={strand.d}
                  fill="none"
                  stroke={`url(#${ribbon.id})`}
                  strokeWidth={strand.width}
                  strokeOpacity={strand.opacity}
                />
              ))}
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Geometry (SVG units: the ring's outer radius is 1000)

const RING_INNER = 580
const RING_OUTER = 1000
/** Edges per ribbon; the body is drawn as strips between neighbouring edges. */
const EDGES = 10
/** Points sampled along each ribbon, joined with smooth curves. */
const SAMPLES = 7
/** Fine streaks per ribbon. */
const STRANDS = 15

/** Violet ribbons lead, spread evenly around the ring. */
const VIOLETS = [
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-3)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-5)",
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-2)",
]
/**
 * Narrow lime accents, evenly spaced and long enough to overlap their neighbours, so some lime
 * is always passing through the visible arc. Drawn after the violets so they stay on top.
 */
const LIME_RIBBONS = 5

const SPECS = [
  ...VIOLETS.map((color, i) => ({ color, angle: (i / VIOLETS.length) * 360, accent: false })),
  ...Array.from({ length: LIME_RIBBONS }, (_, i) => ({
    color: "var(--primary)",
    angle: ((i + 0.5) / LIME_RIBBONS) * 360,
    accent: true,
  })),
]

type Point = [number, number]
type Ribbon = {
  id: string
  color: string
  from: Point
  to: Point
  strips: { d: string; opacity: number }[]
  strands: { d: string; width: number; opacity: number }[]
}

const RIBBONS = buildRibbons(0x5eed)

function buildRibbons(seed: number): Ribbon[] {
  const random = mulberry32(seed)
  const between = (min: number, max: number) => min + random() * (max - min)

  return SPECS.map(({ color, angle, accent: isAccent }, index) => {
    const startAngle = angle + between(-8, 8)
    // Lime ribbons are longer (to overlap each other) but narrower and fainter, so violet leads.
    const span = isAccent ? between(125, 140) : between(90, 120)
    const width = isAccent ? between(90, 140) : between(220, 330)
    const startRadius = between(RING_INNER + width / 2, RING_OUTER - width / 2)
    const endRadius = between(RING_INNER + width / 2, RING_OUTER - width / 2)
    // A ribbon folds over itself where cos(twist) crosses 0; a small range means no fold.
    const twistStart = between(-0.35, 0.35) * Math.PI
    const twistAmount = between(0.3, 1.15) * Math.PI
    const strength = isAccent ? between(0.4, 0.5) : between(0.5, 0.75)

    const edgePoint = (t: number, u: number): Point => {
      const eased = t * t * (3 - 2 * t)
      const radius = startRadius + (endRadius - startRadius) * eased
      const spread = width * (0.4 + 0.6 * Math.sin(Math.PI * t)) * Math.cos(twistStart + twistAmount * t)
      const angle = ((startAngle + span * t) * Math.PI) / 180
      const r = radius + u * spread
      return [r * Math.cos(angle), r * Math.sin(angle)]
    }

    const edges = Array.from({ length: EDGES }, (_, j) => {
      const u = j / (EDGES - 1) - 0.5
      return Array.from({ length: SAMPLES }, (_, s) => edgePoint(s / (SAMPLES - 1), u))
    })

    // Body: strips between neighbouring edges, brighter towards the middle for a satin sheen.
    const strips = edges.slice(0, -1).map((edge, j) => {
      const across = Math.sin((Math.PI * (j + 0.5)) / (EDGES - 1))
      const opacity = strength * (0.35 + 0.65 * across ** 1.5) * between(0.75, 1)
      const back = [...edges[j + 1]].reverse()
      return { d: `${curve(edge)}L${fmt(back[0])}${segments(back)}Z`, opacity: round(opacity, 2) }
    })

    // Fine streaks along the ribbon give it the brushed-silk texture.
    const strands = Array.from({ length: STRANDS }, () => {
      const u = between(-0.48, 0.48)
      const points = Array.from({ length: SAMPLES }, (_, s) => edgePoint(s / (SAMPLES - 1), u))
      return { d: curve(points), width: round(between(0.6, 2.4), 1), opacity: round(between(0.15, 0.55), 2) }
    })

    return {
      id: `auth-ribbon-${index}`,
      color,
      from: edgePoint(0, 0).map(Math.round) as Point,
      to: edgePoint(1, 0).map(Math.round) as Point,
      strips,
      strands,
    }
  })
}

/** Smooth path through the points (Catmull-Rom converted to cubic Béziers). */
function curve(points: Point[]): string {
  return `M${fmt(points[0])}${segments(points)}`
}

/** The curve's segments without the initial move, for continuing an existing path. */
function segments(points: Point[]): string {
  let d = ""
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`
  }
  return d
}

/** Whole units are enough: one unit is under 2px even on wide screens. */
function fmt([x, y]: Point) {
  return `${Math.round(x)},${Math.round(y)}`
}

function round(value: number, digits: number) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** Small seeded PRNG so the illustration is identical on every render. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
