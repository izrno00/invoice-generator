import { describe, expect, it } from "vitest"

import {
  COMET_CYCLE,
  COMET_DURATION,
  COMET_GAP,
  cometsAt,
  cycleLines,
  endFade,
  frameAt,
  LINE_COUNT,
  linePoint,
  lineStrength,
} from "@/components/marketing/ribbon-geometry"

describe("comet schedule", () => {
  it("runs a pair of comets, then a second pair on other lines, then a gap, every 7.5s", () => {
    expect(COMET_CYCLE).toBe(2 * COMET_DURATION + COMET_GAP)
    expect(COMET_CYCLE).toBe(7.5)

    const [a, b, c, d] = cycleLines(0)
    expect(cometsAt(0).map((comet) => comet.line)).toEqual([a, b])
    expect(cometsAt(3.4).map((comet) => comet.line)).toEqual([a, b])
    expect(cometsAt(3.6).map((comet) => comet.line)).toEqual([c, d])
    expect(cometsAt(6.9).map((comet) => comet.line)).toEqual([c, d])
    expect(cometsAt(7.2)).toEqual([])
    expect(cometsAt(7.5 + 0.1)).toHaveLength(2)
  })

  it("moves the head at a steady speed from the start to just past the end over 3.5s", () => {
    expect(cometsAt(0)[0].head).toBe(0)
    expect(cometsAt(1.75)[0].head).toBeCloseTo(0.54, 2)
    expect(cometsAt(3.4999)[0].head).toBeGreaterThan(1)
    expect(cometsAt(3.5)[0].head).toBe(0)
  })

  it("puts each pair on different lines, the same lines all cycle, new lines next cycle", () => {
    for (let cycle = 0; cycle < 50; cycle++) {
      const lines = cycleLines(cycle)
      expect(new Set(lines).size).toBe(4)
      for (const line of lines) {
        expect(line).toBeGreaterThanOrEqual(0)
        expect(line).toBeLessThan(LINE_COUNT)
      }
    }

    expect(cometsAt(0.5).map((comet) => comet.line)).toEqual(cometsAt(3.0).map((comet) => comet.line))
    expect(cometsAt(0.5)).toEqual(cometsAt(0.5))

    const cycles = Array.from({ length: 10 }, (_, cycle) => cycleLines(cycle).join(","))
    expect(new Set(cycles).size).toBeGreaterThan(1)
  })
})

describe("ribbon geometry", () => {
  const width = 1905
  const height = 992
  const times = [0, 4.2, 9.7, 18.3]

  it("has 16 lines with a fixed brightness between 0.78 and 1", () => {
    expect(LINE_COUNT).toBe(16)
    for (let line = 0; line < LINE_COUNT; line++) {
      expect(lineStrength(line)).toBeGreaterThanOrEqual(0.78)
      expect(lineStrength(line)).toBeLessThanOrEqual(1)
    }
  })

  it("fades the lines out at both ends", () => {
    expect(endFade(0)).toBe(0)
    expect(endFade(1)).toBe(0)
    expect(endFade(0.5)).toBe(1)
    expect(endFade(0.05)).toBeGreaterThan(0)
    expect(endFade(0.05)).toBeLessThan(1)
    expect(endFade(0.96)).toBeGreaterThan(0)
    expect(endFade(0.96)).toBeLessThan(1)
  })

  it("draws every line as clean arcs: no wiggles, at most one gentle inflection", () => {
    for (const time of times) {
      const frame = frameAt(width, height, time)
      for (let line = 0; line < LINE_COUNT; line++) {
        const points = Array.from({ length: 401 }, (_, i) => linePoint(frame, line, i / 400))
        let lastSign = 0
        let changes = 0
        for (let i = 1; i < points.length - 1; i++) {
          const a = { x: points[i].x - points[i - 1].x, y: points[i].y - points[i - 1].y }
          const b = { x: points[i + 1].x - points[i].x, y: points[i + 1].y - points[i].y }
          const cross = a.x * b.y - a.y * b.x
          const turn = cross / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y) || 1)
          if (Math.abs(turn) < 1e-4) continue
          const sign = Math.sign(turn)
          if (lastSign !== 0 && sign !== lastSign) changes++
          lastSign = sign
        }
        expect(changes, `line ${line} at ${time}s`).toBeLessThanOrEqual(1)
      }
    }
  })

  it("always heads up and to the right", () => {
    const frame = frameAt(width, height, 6)
    for (let line = 0; line < LINE_COUNT; line++) {
      for (let i = 0; i < 100; i++) {
        const p = linePoint(frame, line, i / 100)
        const q = linePoint(frame, line, (i + 1) / 100)
        expect(q.x).toBeGreaterThan(p.x)
        expect(q.y).toBeLessThan(p.y)
      }
    }
  })

  it("fans in from the left and bottom edges, pinches, and fans out through the top and right edges", () => {
    const frame = frameAt(width, height, 0)
    const starts = frame.lines.map((line) => line.start)
    const pinches = frame.lines.map((line) => line.pinch)
    const ends = frame.lines.map((line) => line.end)

    // Top line enters at the left edge; bottom line rises from below the bottom edge.
    expect(starts[0].x).toBeLessThan(0)
    expect(starts[LINE_COUNT - 1].y).toBeGreaterThan(height)

    // The pinch is tight compared with the fan.
    const pinchSpread = Math.max(...pinches.map((p) => p.y)) - Math.min(...pinches.map((p) => p.y))
    const fanSpread = Math.max(...starts.map((p) => p.y)) - Math.min(...starts.map((p) => p.y))
    expect(pinchSpread).toBeLessThan(fanSpread / 4)

    // The top-right is as open as the bottom-left: the steepest line leaves through the top
    // edge, the gentlest through the right edge, well apart.
    expect(ends[LINE_COUNT - 1].y).toBeLessThan(0)
    expect(ends[0].x).toBeGreaterThan(width)
    const endSpread = Math.hypot(ends[0].x - ends[LINE_COUNT - 1].x, ends[0].y - ends[LINE_COUNT - 1].y)
    expect(endSpread).toBeGreaterThan(fanSpread)
    for (const end of ends) expect(end.x).toBeGreaterThan(width * 0.65)
  })
})
