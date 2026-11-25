import { describe, expect, it } from "vitest"

import { containsAnyOf, escapeIlike, quoteFilterValue } from "@/lib/supabase/filters"

describe("escapeIlike", () => {
  it("leaves ordinary text alone, including commas and brackets", () => {
    expect(escapeIlike("Anić, d.o.o. (BA)")).toBe("Anić, d.o.o. (BA)")
  })

  it.each([
    ["100%", "100\\%"],
    ["first_last", "first\\_last"],
    ["back\\slash", "back\\\\slash"],
  ])("escapes the wildcard characters in %j", (value, expected) => {
    expect(escapeIlike(value)).toBe(expected)
  })

  it("narrows * to a single character, since PostgREST would read it as %", () => {
    expect(escapeIlike("a*b")).toBe("a_b")
  })
})

describe("quoteFilterValue", () => {
  it("wraps the value in quotes, so , . ( ) stay part of it", () => {
    expect(quoteFilterValue("a,b.(c)")).toBe('"a,b.(c)"')
  })

  it("escapes quotes and backslashes", () => {
    expect(quoteFilterValue('say "hi" \\ bye')).toBe('"say \\"hi\\" \\\\ bye"')
  })
})

describe("containsAnyOf", () => {
  it("builds one quoted ilike condition per column", () => {
    expect(containsAnyOf(["full_name", "email"], "ana")).toBe('full_name.ilike."%ana%",email.ilike."%ana%"')
  })

  it("can't be broken out of with filter syntax", () => {
    expect(containsAnyOf(["email"], 'x",user_id.neq."0')).toBe('email.ilike."%x\\",user\\\\_id.neq.\\"0%"')
  })

  it("escapes for ilike first, then for the filter string", () => {
    // The pattern `%50\%%` needs its backslash doubled inside the quotes.
    expect(containsAnyOf(["email"], "50%")).toBe('email.ilike."%50\\\\%%"')
  })
})
