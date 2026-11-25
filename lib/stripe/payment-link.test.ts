import { describe, expect, it } from "vitest"

import {
  isPaymentTokenShape,
  paymentLinkNote,
  paymentLinkStatus,
  STRIPE_MINIMUM_CENTS,
} from "@/lib/stripe/payment-link"
import { newPaymentToken } from "@/lib/stripe/token"

describe("paymentLinkStatus", () => {
  it("has no link without a Stripe account that can take payments", () => {
    expect(paymentLinkStatus({ connected: false, totalCents: 10_000, currency: "EUR" })).toBe("not_connected")
  })

  it("has no link below Stripe's minimum, and one from the minimum up", () => {
    for (const currency of ["EUR", "USD", "GBP", "BAM"] as const) {
      const minimum = STRIPE_MINIMUM_CENTS[currency]
      expect(paymentLinkStatus({ connected: true, totalCents: minimum - 1, currency })).toBe("below_minimum")
      expect(paymentLinkStatus({ connected: true, totalCents: minimum, currency })).toBe("included")
    }
  })

  it("checks the connection before the amount", () => {
    expect(paymentLinkStatus({ connected: false, totalCents: 1, currency: "EUR" })).toBe("not_connected")
  })
})

describe("paymentLinkNote", () => {
  it("uses the PRD wording", () => {
    expect(paymentLinkNote("included", "EUR")).toBe("A secure payment link will be included.")
    expect(paymentLinkNote("not_connected", "EUR")).toBe(
      "No payment link will be included. Connect Stripe to let clients pay online."
    )
    expect(paymentLinkNote("below_minimum", "EUR")).toBe(
      "No payment link will be included: online payments need at least EUR 0.50."
    )
    expect(paymentLinkNote("below_minimum", "BAM")).toContain("at least BAM 1.00")
  })
})

describe("payment tokens", () => {
  it("are 32 url-safe characters and unique", () => {
    const tokens = new Set(Array.from({ length: 50 }, newPaymentToken))
    expect(tokens.size).toBe(50)
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/)
      expect(isPaymentTokenShape(token)).toBe(true)
    }
  })

  it("rejects anything that can't be a token", () => {
    expect(isPaymentTokenShape("short")).toBe(false)
    expect(isPaymentTokenShape(`${"a".repeat(31)}/`)).toBe(false)
    expect(isPaymentTokenShape("a".repeat(129))).toBe(false)
  })
})
