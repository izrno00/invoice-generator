import { describe, expect, it } from "vitest"

import {
  centsToInput,
  MAX_PRICE_CENTS,
  parseMoneyInput,
  parseQuantityInput,
  parseVatInput,
  vatBpToInput,
  vatRateToBp,
} from "@/lib/invoices/money"

describe("parseMoneyInput", () => {
  it.each([
    ["12", 1200],
    ["12.5", 1250],
    ["12.50", 1250],
    ["12,50", 1250],
    ["0.29", 29],
    ["0,07", 7],
    ["0", 0],
    [" 3.10 ", 310],
    ["12.", 1200],
    ["9999999.99", MAX_PRICE_CENTS],
  ])("%j → %d cents", (input, cents) => {
    expect(parseMoneyInput(input)).toBe(cents)
  })

  it.each(["", "-1", "1.234", "1,234.56", "1 000", "abc", ".5", "1e3", "10000000"])("rejects %j", (input) => {
    expect(parseMoneyInput(input)).toBeNull()
  })
})

describe("parseVatInput", () => {
  it.each([
    ["0", 0],
    ["17", 1700],
    ["7.5", 750],
    ["7,25", 725],
    ["100", 10000],
  ])("%j → %d bp", (input, bp) => {
    expect(parseVatInput(input)).toBe(bp)
  })

  it.each(["100.01", "101", "-5", "7.125", "x"])("rejects %j", (input) => {
    expect(parseVatInput(input)).toBeNull()
  })
})

describe("parseQuantityInput", () => {
  it("accepts whole numbers from 1", () => {
    expect(parseQuantityInput("1")).toBe(1)
    expect(parseQuantityInput(" 40 ")).toBe(40)
  })

  it.each(["0", "1.5", "1,5", "-2", "", "10001"])("rejects %j", (input) => {
    expect(parseQuantityInput(input)).toBeNull()
  })
})

describe("back to form strings", () => {
  it("formats cents and VAT for the inputs", () => {
    expect(centsToInput(1250)).toBe("12.50")
    expect(centsToInput(7)).toBe("0.07")
    expect(vatBpToInput(1750)).toBe("17.5")
    expect(vatBpToInput(1700)).toBe("17")
    expect(vatBpToInput(725)).toBe("7.25")
    expect(vatBpToInput(0)).toBe("0")
  })

  it("reads numeric(5,2) VAT rates as basis points", () => {
    expect(vatRateToBp(17.5)).toBe(1750)
    expect(vatRateToBp(7.25)).toBe(725)
    expect(vatRateToBp(0.07)).toBe(7)
  })
})
