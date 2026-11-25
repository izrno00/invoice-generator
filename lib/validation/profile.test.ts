import { describe, expect, it } from "vitest"

import {
  isSenderComplete,
  PROFILE_LIMITS,
  profileSchema,
  profileToFormValues,
  type ProfileFormValues,
} from "@/lib/validation/profile"

const empty: ProfileFormValues = {
  fullName: "",
  companyName: "",
  email: "",
  address: "",
  vatId: "",
  website: "",
  defaultCurrency: "EUR",
}

function parse(overrides: Partial<Record<keyof ProfileFormValues, unknown>>) {
  return profileSchema.safeParse({ ...empty, ...overrides })
}

function errorFor(field: keyof ProfileFormValues, value: unknown) {
  const result = parse({ [field]: value })
  if (result.success) return undefined
  return result.error.issues.find((issue) => issue.path[0] === field)?.message
}

describe("profileSchema", () => {
  it("stores an empty form as nulls and keeps the currency", () => {
    expect(profileSchema.parse(empty)).toEqual({
      fullName: null,
      companyName: null,
      email: null,
      address: null,
      vatId: null,
      website: null,
      defaultCurrency: "EUR",
    })
  })

  it("trims every text field, and whitespace-only becomes null", () => {
    const result = profileSchema.parse({
      ...empty,
      fullName: "  Ana Anić  ",
      companyName: "   ",
      email: " ana@example.com ",
      vatId: "\tBA123\n",
    })
    expect(result.fullName).toBe("Ana Anić")
    expect(result.companyName).toBeNull()
    expect(result.email).toBe("ana@example.com")
    expect(result.vatId).toBe("BA123")
  })

  it("normalises Windows line breaks in the address", () => {
    const result = profileSchema.parse({ ...empty, address: " Street 1\r\n71000 Sarajevo\r\n" })
    expect(result.address).toBe("Street 1\n71000 Sarajevo")
  })

  describe("email", () => {
    it("accepts a valid address", () => {
      expect(parse({ email: "ana@example.com" }).success).toBe(true)
    })

    it.each(["ana", "ana@", "@example.com", "ana@example"])("rejects %j", (email) => {
      expect(errorFor("email", email)).toBe("Enter a valid email address")
    })

    it("rejects an address over the limit", () => {
      const email = `${"a".repeat(PROFILE_LIMITS.email)}@example.com`
      expect(errorFor("email", email)).toBe("Email address is too long")
    })
  })

  describe("website", () => {
    it.each([
      ["example.com", "https://example.com"],
      ["www.example.co.uk", "https://www.example.co.uk"],
      ["  example.com  ", "https://example.com"],
      ["http://example.com", "http://example.com"],
      ["https://example.com/about?x=1", "https://example.com/about?x=1"],
      ["HTTPS://Example.com", "HTTPS://Example.com"],
      ["xn--80ak6aa92e.xn--p1ai", "https://xn--80ak6aa92e.xn--p1ai"],
    ])("accepts %j as %j", (input, expected) => {
      const result = parse({ website: input })
      expect(result.success && result.data.website).toBe(expected)
    })

    it.each([
      "example",
      "exa mple.com",
      "ftp://example.com",
      "javascript:alert(1)",
      "mailto:ana@example.com",
      "https://user:pass@example.com",
      "example.c",
      "example..com",
      "1.2.3.4",
      "localhost:3000",
    ])("rejects %j", (website) => {
      expect(errorFor("website", website)).toBe("Enter a valid website, like example.com")
    })

    it("counts the added https:// towards the limit", () => {
      const host = `${"a".repeat(PROFILE_LIMITS.website - "https://".length - ".com".length)}.com`
      expect(parse({ website: host }).success).toBe(true)
      expect(errorFor("website", `a${host}`)).toBe("Website must be at most 500 characters")
    })
  })

  describe("max lengths", () => {
    it.each([
      ["fullName", "Full name", PROFILE_LIMITS.fullName],
      ["companyName", "Company name", PROFILE_LIMITS.companyName],
      ["address", "Address", PROFILE_LIMITS.address],
      ["vatId", "VAT ID", PROFILE_LIMITS.vatId],
    ] as const)("%s allows the limit and rejects one more", (field, label, max) => {
      expect(parse({ [field]: "a".repeat(max) }).success).toBe(true)
      expect(errorFor(field, "a".repeat(max + 1))).toBe(
        `${label} must be at most ${max.toLocaleString("en-US")} characters`
      )
    })
  })

  describe("defaultCurrency", () => {
    it.each(["EUR", "USD", "BAM", "GBP"])("accepts %s", (currency) => {
      expect(parse({ defaultCurrency: currency }).success).toBe(true)
    })

    it.each(["JPY", "", "eur"])("rejects %j", (currency) => {
      expect(errorFor("defaultCurrency", currency)).toBe("Choose a currency")
    })
  })
})

describe("profileToFormValues", () => {
  it("turns nulls into empty strings and round-trips through the schema", () => {
    const stored = profileSchema.parse({ ...empty, fullName: "Ana", website: "example.com", defaultCurrency: "BAM" })
    const values = profileToFormValues(stored)
    expect(values).toEqual({ ...empty, fullName: "Ana", website: "https://example.com", defaultCurrency: "BAM" })
    expect(profileSchema.parse(values)).toEqual(stored)
  })
})

describe("isSenderComplete", () => {
  it.each([
    [{ fullName: "Ana", companyName: null, email: "ana@example.com" }, true],
    [{ fullName: null, companyName: "Acme", email: "ana@example.com" }, true],
    [{ fullName: "Ana", companyName: "Acme", email: "ana@example.com" }, true],
    [{ fullName: "Ana", companyName: "Acme", email: null }, false],
    [{ fullName: null, companyName: null, email: "ana@example.com" }, false],
    [{ fullName: null, companyName: null, email: null }, false],
  ])("%j → %s", (profile, expected) => {
    expect(isSenderComplete(profile)).toBe(expected)
  })
})
