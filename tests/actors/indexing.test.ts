import { describe, expect, it } from "vitest"
import { buildActorBrowseScopes, buildActorSearchText } from "../../lib/actors/indexing"

describe("actor browse indexing", () => {
  it("builds base, service-area, and nationwide scopes without duplicates", () => {
    const scopes = buildActorBrowseScopes({
      name: "Kirppis Hamar",
      category: "brukt",
      description: "Bruktbutikk",
      county: "Innlandet",
      countySlug: "innlandet",
      municipality: "Hamar",
      municipalitySlug: "hamar",
      nationwide: true,
      serviceAreaCountySlugs: ["akershus"],
      serviceAreaMunicipalitySlugs: ["baerum"],
      tags: ["vintage"],
    })

    expect(scopes).toContainEqual({ countySlug: "innlandet", municipalitySlug: null, priority: 0 })
    expect(scopes).toContainEqual({ countySlug: "innlandet", municipalitySlug: "hamar", priority: 0 })
    expect(scopes).toContainEqual({ countySlug: "akershus", municipalitySlug: null, priority: 1 })
    expect(scopes).toContainEqual({ countySlug: "akershus", municipalitySlug: "baerum", priority: 1 })
    expect(scopes.some((scope) => scope.priority === 2)).toBe(true)

    const uniqueKeys = new Set(scopes.map((scope) => `${scope.countySlug}:${scope.municipalitySlug ?? "*"}`))
    expect(uniqueKeys.size).toBe(scopes.length)
  })

  it("builds a persisted search text from browse-relevant fields", () => {
    const searchText = buildActorSearchText({
      name: "Kirppis Hamar",
      category: "brukt",
      description: "Bruktbutikk",
      address: "Aslak Bolts gate 48",
      county: "Innlandet",
      municipality: "Hamar",
      city: "Hamar",
      tags: ["vintage", "møbler"],
    })

    expect(searchText).toContain("Kirppis Hamar")
    expect(searchText).toContain("Bruktbutikk")
    expect(searchText).toContain("Innlandet")
    expect(searchText).toContain("vintage")
  })
})
