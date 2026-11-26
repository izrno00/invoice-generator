import { box, cylinder, face, line, ring, viewBox, type Shape, type Tone, type Vec3 } from "@/components/marketing/iso"
import { cn } from "@/lib/utils"

/** Designers: three stacked layers joined by dashed guides, shapes on the top one. */
function designers(): Shape[] {
  const plate = (z: number) => box([0, 0, z], [56, 56, 3])
  const guides = (z0: number, z1: number) =>
    ([[56, 0], [56, 56], [0, 56]] as const).map(([x, y]) => line([[x, y, z0], [x, y, z1]], { dashed: true, faint: true }))
  return [
    ...plate(0),
    ...guides(3, 16),
    ...plate(16),
    ...guides(19, 32),
    ...plate(32),
    line(ring([18, 20, 35], 9, "z"), { closed: true }),
    line([[30, 30, 35], [46, 30, 35], [46, 46, 35], [30, 46, 35]], { closed: true }),
  ]
}

/** Developers: an open laptop with code lines on the screen and a keyboard on the deck. */
function developers(): Shape[] {
  // A point on the screen: u across (0..1), v up (0..1); the lid leans back.
  const screen = (u: number, v: number): Vec3 => [2 + 60 * u, -10 * v, 3 + 42 * v]
  const code = ([from, v, to]: readonly [number, number, number]) => line([screen(from, v), screen(to, v)], { faint: true })
  return [
    face([screen(0, 0), screen(1, 0), screen(1, 1), screen(0, 1)], "left"),
    line([screen(0.06, 0.08), screen(0.94, 0.08), screen(0.94, 0.92), screen(0.06, 0.92)], { closed: true, faint: true }),
    ...([[0.14, 0.76, 0.5], [0.22, 0.64, 0.72], [0.22, 0.52, 0.6], [0.3, 0.4, 0.66], [0.14, 0.28, 0.4]] as const).map(code),
    ...box([0, 0, 0], [64, 44, 3]),
    line([[8, 6, 3], [56, 6, 3], [56, 26, 3], [8, 26, 3]], { closed: true, faint: true }),
    ...[11, 16, 21].map((y) => line([[8, y, 3], [56, y, 3]], { faint: true })),
    line([[24, 31, 3], [40, 31, 3], [40, 40, 3], [24, 40, 3]], { closed: true, faint: true }),
  ]
}

/** Writers: a row of standing pages with text lines, and a dashed line running off. */
function writers(): Shape[] {
  const pages = [0, 1, 2, 3, 4].flatMap((i) => {
    const x = i * 10 + 2
    return [
      ...box([i * 10, 0, 0], [2, 36, 48]),
      ...([[44, 16], [40, 21], [36, 13]] as const).map(([z, length]) =>
        line([[x, 31, z], [x, 31 - length, z]], { faint: true })
      ),
    ]
  })
  return [...pages, line([[42, 18, 0], [76, 18, 0]], { dashed: true, faint: true })]
}

/** Photographers: a camera body with a viewfinder hump, shutter button and lens. */
function photographers(): Shape[] {
  return [
    ...box([0, 0, 0], [54, 30, 34]),
    line([[6, 30, 28], [16, 30, 28], [16, 30, 23], [6, 30, 23]], { closed: true, faint: true }),
    ...box([18, 6, 34], [18, 18, 7]),
    ...cylinder([44, 12, 34], 3.5, 3, "z"),
    ...cylinder([28, 30, 15], 11, 9, "y"),
    line(ring([28, 39, 15], 7, "y"), { closed: true, faint: true }),
  ]
}

/** Consultants: a bar chart on a plate, with a dashed inset like a page margin. */
function consultants(): Shape[] {
  return [
    ...box([0, 0, 0], [72, 36, 4]),
    line([[5, 5, 4], [67, 5, 4], [67, 31, 4], [5, 31, 4]], { closed: true, dashed: true, faint: true }),
    ...[14, 26, 40].flatMap((height, i) => box([10 + 20 * i, 12, 4], [12, 12, height])),
  ]
}

export const ILLUSTRATIONS = { designers, developers, writers, photographers, consultants } as const
export type IllustrationName = keyof typeof ILLUSTRATIONS

const VIEW_WIDTH = 120
const VIEW_HEIGHT = 100

const TONE_CLASS: Record<Tone, string> = {
  top: "fill-muted",
  right: "fill-card",
  left: "fill-background",
  line: "fill-none",
  detail: "fill-none [stroke-opacity:0.55]",
}

/**
 * An isometric line illustration in the style of a technical drawing. Strokes use the current text
 * colour and faces use the theme's surface tokens, so it follows whatever theme it's placed in.
 * Decorative: hidden from assistive tech.
 */
export function FreelancerIllustration({ name, className }: { name: IllustrationName; className?: string }) {
  const shapes = ILLUSTRATIONS[name]()
  return (
    <svg
      viewBox={viewBox(shapes, VIEW_WIDTH, VIEW_HEIGHT)}
      aria-hidden
      className={cn("overflow-visible", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {shapes.map((shape, index) => {
        const points = shape.points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ")
        const props = {
          points,
          vectorEffect: "non-scaling-stroke" as const,
          strokeDasharray: shape.dashed ? "2 3" : undefined,
          className: TONE_CLASS[shape.tone],
        }
        return shape.closed ? <polygon key={index} {...props} /> : <polyline key={index} {...props} />
      })}
    </svg>
  )
}
