import { describe, expect, it } from "vitest"
import { parseActorBrowseFilters } from "../../lib/actors/search-params"
import { getMapResponseMode } from "../../lib/actors/map-mode"

describe("actor browse search params", () => {
  it("parses categories, tags, bounds and favoriteOnly", () => {
    const params = new URLSearchParams([
      ["q", "repair"],
      ["category", "reparasjon"],
      ["category", "sykkelverksted"],
      ["tag", "drop-in"],
      ["favoriteOnly", "true"],
      ["sort", "distance"],
      ["page", "3"],
      ["pageSize", "20"],
      ["lat", "60.79"],
      ["lng", "11.06"],
      ["north", "61"],
      ["south", "60"],
      ["east", "12"],
      ["west", "10"],
      ["zoom", "9"],
    ])

    const filters = parseActorBrowseFilters(params, { pageSize: 24 })

    expect(filters.q).toBe("repair")
    expect(filters.categories).toEqual(["reparasjon", "sykkelverksted"])
    expect(filters.tags).toEqual(["drop-in"])
    expect(filters.favoriteOnly).toBe(true)
    expect(filters.sort).toBe("distance")
    expect(filters.page).toBe(3)
    expect(filters.pageSize).toBe(20)
    expect(filters.bounds).toEqual({ north: 61, south: 60, east: 12, west: 10 })
    expect(filters.zoom).toBe(9)
  })

  it("uses fallback pagination when page and pageSize are omitted", () => {
    const filters = parseActorBrowseFilters(new URLSearchParams(), { pageSize: 24 })

    expect(filters.page).toBe(1)
    expect(filters.pageSize).toBe(24)
  })

  it("switches map responses to clusters at low zoom and points at high zoom", () => {
    expect(getMapResponseMode(6)).toBe("clusters")
    expect(getMapResponseMode(10)).toBe("clusters")
    expect(getMapResponseMode(11)).toBe("points")
    expect(getMapResponseMode(15)).toBe("points")
  })
})
