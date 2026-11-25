import { describe, expect, it } from "vitest"

import {
  CLIENT_FORM_ERROR,
  CLIENT_LIMITS,
  clientDisplayName,
  clientSchema,
  clientToFormValues,
  EMPTY_CLIENT_MESSAGE,
  EMPTY_CLIENT_VALUES,
  matchClientDetails,
  UNNAMED_CLIENT,
  type ClientFormValues,
} from "@/lib/validation/client"

const empty = EMPTY_CLIENT_VALUES

function parse(overrides: Partial<ClientFormValues>) {
  return clientSchema.safeParse({ ...empty, ...overrides })
}

function errorFor(field: string, overrides: Partial<ClientFormValues>) {
  const result = parse(overrides)
  if (result.success) return undefined
  return result.error.issues.find((issue) => issue.path[0] === field)?.message
}

describe("clientSchema", () => {
  describe("at least one field", () => {
    it("rejects an empty form with a form-level error", () => {
      expect(errorFor(CLIENT_FORM_ERROR, {})).toBe(EMPTY_CLIENT_MESSAGE)
    })

    it("treats whitespace as empty", () => {
      const blank = { fullName: "  ", companyName: "\t", email: " ", address: " \n ", vatId: "  " }
      expect(errorFor(CLIENT_FORM_ERROR, blank)).toBe(EMPTY_CLIENT_MESSAGE)
    })

    it.each([
      ["fullName", "Ana Anić"],
      ["companyName", "Acme"],
      ["email", "ana@example.com"],
      ["address", "Street 1"],
      ["vatId", "BA123"],
    ] as const)("accepts only %s", (field, value) => {
      const result = parse({ [field]: value })
      expect(result.success && result.data[field]).toBe(value)
    })
  })

  it("stores blank fields as null", () => {
    expect(clientSchema.parse({ ...empty, companyName: "Acme", vatId: "   " })).toEqual({
      fullName: null,
      companyName: "Acme",
      email: null,
      address: null,
      vatId: null,
    })
  })

  it("trims names and collapses the whitespace inside them", () => {
    const result = clientSchema.parse({ ...empty, fullName: "  Ana \t  Anić ", companyName: "Acme \n  d.o.o. " })
    expect(result.fullName).toBe("Ana Anić")
    expect(result.companyName).toBe("Acme d.o.o.")
  })

  it("keeps the lines of an address and normalises Windows line breaks", () => {
    const result = clientSchema.parse({ ...empty, address: " Street 1\r\n71000  Sarajevo\r\n" })
    expect(result.address).toBe("Street 1\n71000  Sarajevo")
  })

  describe("email", () => {
    it("is trimmed and lowercased", () => {
      const result = parse({ email: "  Ana.Anic@Example.COM " })
      expect(result.success && result.data.email).toBe("ana.anic@example.com")
    })

    it.each(["ana", "ana@", "@example.com", "ana@example"])("rejects %j", (email) => {
      expect(errorFor("email", { email })).toBe("Enter a valid email address")
    })

    it("rejects an address over the limit", () => {
      const email = `${"a".repeat(CLIENT_LIMITS.email)}@example.com`
      expect(errorFor("email", { email })).toBe("Email address is too long")
    })
  })

  describe("max lengths", () => {
    it.each([
      ["fullName", "Full name", CLIENT_LIMITS.fullName],
      ["companyName", "Company name", CLIENT_LIMITS.companyName],
      ["address", "Address", CLIENT_LIMITS.address],
      ["vatId", "VAT ID", CLIENT_LIMITS.vatId],
    ] as const)("%s allows the limit and rejects one more", (field, label, max) => {
      expect(parse({ [field]: "a".repeat(max) }).success).toBe(true)
      expect(errorFor(field, { [field]: "a".repeat(max + 1) })).toBe(
        `${label} must be at most ${max.toLocaleString("en-US")} characters`
      )
    })
  })
})

describe("clientToFormValues", () => {
  it("turns nulls into empty strings and round-trips through the schema", () => {
    const stored = clientSchema.parse({ ...empty, fullName: "Ana", email: "ana@example.com" })
    const values = clientToFormValues(stored)
    expect(values).toEqual({ ...empty, fullName: "Ana", email: "ana@example.com" })
    expect(clientSchema.parse(values)).toEqual(stored)
  })
})

describe("clientDisplayName", () => {
  it.each([
    [{ companyName: "Acme", fullName: "Ana", email: "a@example.com" }, "Acme"],
    [{ companyName: null, fullName: "Ana", email: "a@example.com" }, "Ana"],
    [{ companyName: "  ", fullName: null, email: "a@example.com" }, "a@example.com"],
    [{ companyName: null, fullName: null, email: null }, UNNAMED_CLIENT],
  ])("%j → %s", (client, expected) => {
    expect(clientDisplayName(client)).toBe(expected)
  })
})

describe("matchClientDetails", () => {
  const ana = { fullName: "Ana Anić", companyName: "Acme", email: "ana@example.com" }
  const none = { fullName: null, companyName: null, email: null }

  it("lists every detail the two share", () => {
    expect(matchClientDetails(ana, ana)).toEqual(["email", "company", "name"])
  })

  it("ignores case and extra whitespace", () => {
    const other = { fullName: " ana   ANIĆ ", companyName: "ACME", email: "ANA@example.com" }
    expect(matchClientDetails(ana, other)).toEqual(["email", "company", "name"])
  })

  it("never matches on empty details", () => {
    expect(matchClientDetails(none, none)).toEqual([])
    expect(matchClientDetails({ ...none, fullName: "  " }, { ...none, fullName: "" })).toEqual([])
  })

  it("doesn't match partial values or one field against another", () => {
    expect(matchClientDetails(ana, { ...none, companyName: "Acme Ltd" })).toEqual([])
    expect(matchClientDetails(ana, { ...none, fullName: "Acme" })).toEqual([])
  })
})
