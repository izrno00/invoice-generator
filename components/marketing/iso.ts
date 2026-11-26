/**
 * A tiny isometric drawing kit for the landing page line illustrations. Scenes are built from 3D
 * boxes, planes, rings and cylinders, projected to 2D and painted back to front (later shapes
 * cover earlier ones), so there's no hidden-line maths.
 *
 * Axes: x runs right-down on screen, y left-down, z up. The viewer looks from +x +y +z, so a box
 * shows its top, its x-max face ("right") and its y-max face ("left").
 */

export type Vec3 = readonly [number, number, number]
export type Point = readonly [number, number]

/** How a shape is painted: a filled face (lit from above) or an unfilled line. */
export type Tone = "top" | "left" | "right" | "line" | "detail"

export type Shape = { points: Point[]; tone: Tone; closed: boolean; dashed?: boolean }

const COS_30 = Math.cos(Math.PI / 6)

export function project([x, y, z]: Vec3): Point {
  return [(x - y) * COS_30, (x + y) / 2 - z]
}

/** A filled, outlined face. */
export function face(points: Vec3[], tone: "top" | "left" | "right"): Shape {
  return { points: points.map(project), tone, closed: true }
}

/** An unfilled line; `detail` lines are fainter (text marks, guides). */
export function line(
  points: Vec3[],
  { closed = false, dashed = false, faint = false }: { closed?: boolean; dashed?: boolean; faint?: boolean } = {}
): Shape {
  return { points: points.map(project), tone: faint ? "detail" : "line", closed, dashed }
}

/** A solid box from its min corner and size: left and right faces, then the top. */
export function box([x, y, z]: Vec3, [w, d, h]: Vec3): Shape[] {
  const [x1, y1, z1] = [x + w, y + d, z + h]
  return [
    face([[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]], "left"),
    face([[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]], "right"),
    face([[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]], "top"),
  ]
}

/** Points on a circle lying flat ("z") or facing the viewer's left ("y"). */
export function ring([cx, cy, cz]: Vec3, r: number, axis: "y" | "z", segments = 48): Vec3[] {
  return Array.from({ length: segments }, (_, i) => {
    const a = (2 * Math.PI * i) / segments
    return axis === "z"
      ? ([cx + r * Math.cos(a), cy + r * Math.sin(a), cz] as const)
      : ([cx + r * Math.cos(a), cy, cz + r * Math.sin(a)] as const)
  })
}

/** Convex hull (monotone chain), used for a cylinder's silhouette. */
function hull(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list: Point[]) => {
    const out: Point[] = []
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop()
      out.push(p)
    }
    out.pop()
    return out
  }
  return [...half(sorted), ...half([...sorted].reverse())]
}

/**
 * A cylinder along +y or +z from `start`: its silhouette (the hull of both end circles), then the
 * visible end cap.
 */
export function cylinder(start: Vec3, r: number, length: number, axis: "y" | "z"): Shape[] {
  const end: Vec3 = axis === "y" ? [start[0], start[1] + length, start[2]] : [start[0], start[1], start[2] + length]
  const side = hull([...ring(start, r, axis), ...ring(end, r, axis)].map(project))
  return [
    { points: side, tone: axis === "y" ? "right" : "left", closed: true },
    face(ring(end, r, axis), axis === "y" ? "left" : "top"),
  ]
}

/** A fixed-size viewBox centred on the scene, so every illustration is drawn at the same scale. */
export function viewBox(shapes: Shape[], width: number, height: number): string {
  const xs = shapes.flatMap((s) => s.points.map((p) => p[0]))
  const ys = shapes.flatMap((s) => s.points.map((p) => p[1]))
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2
  return [cx - width / 2, cy - height / 2, width, height].map((n) => +n.toFixed(2)).join(" ")
}

/** Scene bounds, for checking that a scene fits its viewBox. */
export function bounds(shapes: Shape[]) {
  const xs = shapes.flatMap((s) => s.points.map((p) => p[0]))
  const ys = shapes.flatMap((s) => s.points.map((p) => p[1]))
  return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }
}
