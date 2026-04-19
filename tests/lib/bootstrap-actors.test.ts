import { mkdtemp, mkdir, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { loadBootstrapActorFixtures } from "@/lib/bootstrap-actors"

const tempDirs: string[] = []

afterEach(async () => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()
    if (!dir) continue
    await import("node:fs/promises").then(({ rm }) => rm(dir, { recursive: true, force: true }))
  }
})

describe("loadBootstrapActorFixtures", () => {
  it("parses blank price_max as fra pricing", async () => {
    const rootDir = await mkdtemp(path.join(os.tmpdir(), "repair-price-fixtures-"))
    tempDirs.push(rootDir)
    const bootstrapDir = path.join(rootDir, "data", "imports", "bootstrap")
    await mkdir(bootstrapDir, { recursive: true })

    await writeFile(
      path.join(bootstrapDir, "actors.csv"),
      [
        "actor_slug,name,category,description,long_description,address,postal_code,county,county_slug,municipality,municipality_slug,city,area,lat,lng,phone,email,website,instagram,opening_hours,opening_hours_osm,tags,benefits,how_to_use,image,nationwide,service_area_county_slugs,service_area_municipality_slugs",
        "phonefix-hamar,PhoneFix Hamar,reparasjon,Kort beskrivelse,Lang beskrivelse,Storgata 1,2317,Innlandet,innlandet,Hamar,hamar,Hamar,,60.7945,11.0680,41125261,,https://example.no,,Man-fre 10:00-18:00,Mo-Fr 10:00-18:00,reparasjon|lokal,Forlenger levetiden,Beskriv feilen,,false,,",
      ].join("\n"),
      "utf8",
    )

    await writeFile(
      path.join(bootstrapDir, "actor_sources.csv"),
      [
        "actor_slug,type,title,url,captured_at,note",
        "phonefix-hamar,website,Offisiell nettside,https://example.no,2026-04-19,Primarkilde",
      ].join("\n"),
      "utf8",
    )

    await writeFile(
      path.join(bootstrapDir, "actor_repair_services.csv"),
      [
        "actor_slug,problem_type,item_types,price_min,price_max,eta_days",
        "phonefix-hamar,screen,phone,1299,,",
      ].join("\n"),
      "utf8",
    )

    const fixtures = await loadBootstrapActorFixtures(rootDir)

    expect(fixtures[0]?.repairServices).toEqual([
      {
        problemType: "screen",
        itemTypes: ["phone"],
        priceMin: 1299,
        priceMax: null,
        etaDays: null,
      },
    ])
  })
})
