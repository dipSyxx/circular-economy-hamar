import { readFile } from "node:fs/promises"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { repairServiceRowMatchesScope } from "@/lib/category-repair-scope"
import { parseCsv } from "@/lib/csv"
import type { ItemType, ProblemType } from "@/lib/prisma-enums"

const countyDir = path.join(process.cwd(), "data", "imports", "counties", "agder")

const splitList = (value: string) =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)

describe("Agder actor_repair_services", () => {
  it("contains sourced Sykkelsport and PhoneFix rows that match the repair scope", async () => {
    const [actorsCsv, actorSourcesCsv, actorRepairServicesCsv] = await Promise.all([
      readFile(path.join(countyDir, "actors.csv"), "utf8"),
      readFile(path.join(countyDir, "actor_sources.csv"), "utf8"),
      readFile(path.join(countyDir, "actor_repair_services.csv"), "utf8"),
    ])

    const actors = parseCsv(actorsCsv)
    const actorSources = parseCsv(actorSourcesCsv)
    const repairServices = parseCsv(actorRepairServicesCsv)
    const actorsBySlug = new Map(actors.map((row) => [row.actor_slug, row]))
    const repairServicesByKey = new Map(
      repairServices.map((row) => [`${row.actor_slug}|${row.problem_type}|${row.item_types}`, row]),
    )

    expect(repairServices.length).toBeGreaterThan(0)
    expect(
      actorSources.some(
        (row) =>
          row.actor_slug === "sykkelsport-as-arendal" && row.url === "https://sykkelsport.no/service/",
      ),
    ).toBe(true)
    expect(
      actorSources.some(
        (row) =>
          row.actor_slug === "phonefix-arendal-arendal" &&
          row.url === "https://phonefix.no/" &&
          row.note.includes("1299") &&
          row.note.includes("skjerm"),
      ),
    ).toBe(true)

    const expectedRows = [
      ["phonefix-arendal-arendal", "screen", "phone", "1299", ""],
      ["sykkelsport-as-arendal", "chain", "bicycle", "399", "499"],
      ["sykkelsport-as-arendal", "brake", "bicycle", "899", "1099"],
      ["sykkelsport-as-arendal", "wheel", "bicycle", "899", "1099"],
      ["sykkelsport-as-arendal", "tire", "bicycle", "199", "350"],
    ] as const

    for (const [actorSlug, problemType, itemTypes, priceMin, priceMax] of expectedRows) {
      const row = repairServicesByKey.get(`${actorSlug}|${problemType}|${itemTypes}`)
      expect(row, `Missing repair row ${actorSlug}/${problemType}/${itemTypes}`).toBeDefined()
      expect(row?.price_min).toBe(priceMin)
      expect(row?.price_max ?? "").toBe(priceMax)
    }

    for (const row of repairServices) {
      const actor = actorsBySlug.get(row.actor_slug)
      expect(actor, `Missing actor for repair row ${row.actor_slug}`).toBeDefined()

      const priceMin = Number(row.price_min)
      const itemTypes = splitList(row.item_types) as ItemType[]

      expect(Number.isFinite(priceMin), `price_min must be numeric for ${row.actor_slug}`).toBe(true)

      if (row.price_max !== "" && row.price_max !== undefined) {
        const priceMax = Number(row.price_max)
        expect(Number.isFinite(priceMax), `price_max must be numeric when set for ${row.actor_slug}`).toBe(true)
        expect(priceMin, `price_min must be <= price_max for ${row.actor_slug}`).toBeLessThanOrEqual(priceMax)
      }

      expect(
        repairServiceRowMatchesScope(actor?.category ?? "", row.problem_type as ProblemType, itemTypes),
        `Repair row must match actor category scope for ${row.actor_slug}`,
      ).toBe(true)
    }
  })
})
