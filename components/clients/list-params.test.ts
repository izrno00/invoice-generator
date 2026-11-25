import { describe, expect, it } from "vitest"

import { clientsListHref, pageItems, parseListParams, SEARCH_MAX_LENGTH } from "@/components/clients/list-params"

describe("parseListParams", () => {
  it("defaults to no search and page 1", () => {
    expect(parseListParams({})).toEqual({ q: "", page: 1 })
  })

  it("trims and shortens the search", () => {
    expect(parseListParams({ q: "  ana ", page: "3" })).toEqual({ q: "ana", page: 3 })
    expect(parseListParams({ q: "a".repeat(SEARCH_MAX_LENGTH + 1) }).q).toHaveLength(SEARCH_MAX_LENGTH)
  })

  it.each(["0", "-1", "1.5", "abc", "", "1e3", "9999999"])("falls back to page 1 for page=%j", (page) => {
    expect(parseListParams({ page }).page).toBe(1)
  })

  it("ignores repeated parameters", () => {
    expect(parseListParams({ q: ["a", "b"], page: ["2", "3"] })).toEqual({ q: "", page: 1 })
  })
})

describe("clientsListHref", () => {
  it.each([
    [{}, "/clients"],
    [{ q: "", page: 1 }, "/clients"],
    [{ page: 2 }, "/clients?page=2"],
    [{ q: "a & b" }, "/clients?q=a+%26+b"],
    [{ q: "ana", page: 3 }, "/clients?q=ana&page=3"],
  ])("%j → %s", (params, expected) => {
    expect(clientsListHref(params)).toBe(expected)
  })
})

describe("pageItems", () => {
  it.each([
    [1, 1, [1]],
    [1, 4, [1, 2, 3, 4]],
    [1, 10, [1, 2, "gap", 10]],
    [4, 10, [1, 2, 3, 4, 5, "gap", 10]],
    [5, 10, [1, "gap", 4, 5, 6, "gap", 10]],
    [10, 10, [1, "gap", 9, 10]],
  ])("page %i of %i", (page, pageCount, expected) => {
    expect(pageItems(page, pageCount)).toEqual(expected)
  })
})
