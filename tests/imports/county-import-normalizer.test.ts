import { describe, expect, it } from "vitest"
import { parseCsv } from "@/lib/csv"

const actorsCsv = `actor_slug,name,category,description,long_description,address,postal_code,county,county_slug,municipality,municipality_slug,city,area,lat,lng,phone,email,website,instagram,opening_hours,opening_hours_osm,tags,benefits,how_to_use,image,nationwide,service_area_county_slugs,service_area_municipality_slugs
gjenbruk-arendal,Gjenbruksglede,brukt,Bruktbutikk med varer som far nytt liv.,Gjenbruksglede i Arendal bidrar til en mer sirkulaer okonomi. Bruktbutikk med varer som far nytt liv. Stedet er hentet fra Google Places og bor verifiseres for publisering.,Vestre gate 17,4836,Agder,agder,Arendal,arendal,Arendal,,58.46,8.76,99347637,,https://www.facebook.com/gjenbruksglede/,,mandag: 10:00-15:45,Mo 10:00-15:45,thrift store,Bidrar til sirkulaer okonomi|Forlenger levetiden pa varer|Lokal aktor,Besok stedet|Spor om tilbud|Velg brukt eller reparasjon,,false,,
phonefix-arendal,PhoneFix Arendal,reparasjon,Mobilverksted for skjerm, batteri og enklere elektronikkreparasjoner.,PhoneFix Arendal i Arendal bidrar til en mer sirkulaer okonomi. Mobilverksted for skjerm, batteri og enklere elektronikkreparasjoner. Stedet er hentet fra Google Places og bor verifiseres for publisering.,Torvgaten 1,4836,Agder,agder,Arendal,arendal,Arendal,,58.46,8.77,37000000,,https://phonefix.no/,,mandag: 09:00-17:00,Mo-Fr 09:00-17:00,cell phone store,Bidrar til sirkulaer okonomi|Forlenger levetiden pa varer|Lokal aktor,Besok stedet|Spor om tilbud|Velg brukt eller reparasjon,,false,,
rema-1000-myrene,REMA 1000 MYRENE,baerekraftig_mat,Matbutikk med utvalg av dagligvarer.,REMA 1000 MYRENE i Arendal bidrar til en mer sirkulaer okonomi. Matbutikk med utvalg av dagligvarer. Stedet er hentet fra Google Places og bor verifiseres for publisering.,Myreneveien 1,4847,Agder,agder,Arendal,arendal,Arendal,,58.45,8.78,37000001,,https://rema.no/,,mandag: 07:00-23:00,Mo-Su 07:00-23:00,grocery store,Bidrar til sirkulaer okonomi|Forlenger levetiden pa varer|Lokal aktor,Besok stedet|Spor om tilbud|Velg brukt eller reparasjon,,false,,
lyefjell-repair,E-service Stavanger AS,reparasjon,Reparasjon av elektronikk.,E-service Stavanger AS i Lyefjell bidrar til en mer sirkulaer okonomi. Reparasjon av elektronikk. Stedet er hentet fra Google Places og bor verifiseres for publisering.,Prestegardsmarka 6,4347,Agder,agder,Lyefjell,lyefjell,Lyefjell,,58.73,5.70,37000002,,https://www.e-servicestavanger.no/,,mandag: 08:00-16:00,Mo-Fr 08:00-16:00,electronics store,Bidrar til sirkulaer okonomi|Forlenger levetiden pa varer|Lokal aktor,Besok stedet|Spor om tilbud|Velg brukt eller reparasjon,,false,,`

const actorSourcesCsv = `actor_slug,type,title,url,captured_at,note
gjenbruk-arendal,website,Facebook-side,https://www.facebook.com/gjenbruksglede/,2026-04-15,
gjenbruk-arendal,map,Google Maps,https://maps.google.com/?cid=1234,2026-04-15,Kilde: Google Places API
phonefix-arendal,website,Offisiell nettside,https://phonefix.no/,2026-04-15,
phonefix-arendal,map,Google Maps,https://maps.google.com/?cid=2345,2026-04-15,Kilde: Google Places API
rema-1000-myrene,website,Offisiell nettside,https://rema.no/,2026-04-15,
lyefjell-repair,website,Offisiell nettside,https://www.e-servicestavanger.no/,2026-04-15,`

describe("normalizeCountyImportDataset", () => {
  it("filters obvious county noise and rewrites kept actor content", async () => {
    const { normalizeCountyImportDataset } = await import("@/lib/county-import-normalizer")

    const result = normalizeCountyImportDataset({
      countySlug: "agder",
      actorsCsv,
      actorSourcesCsv,
    })

    const actors = parseCsv(result.actorsCsv)
    const actorSources = parseCsv(result.actorSourcesCsv)

    expect(result.summary.keptActors).toBe(2)
    expect(result.summary.excludedActors).toBe(2)
    expect(actors.map((row) => row.actor_slug)).toEqual(["gjenbruk-arendal", "phonefix-arendal"])
    expect(new Set(actorSources.map((row) => row.actor_slug))).toEqual(new Set(["gjenbruk-arendal", "phonefix-arendal"]))

    const gjenbruk = actors.find((row) => row.actor_slug === "gjenbruk-arendal")
    expect(gjenbruk).toBeDefined()
    expect(gjenbruk?.long_description).not.toContain("Google Places")
    expect(gjenbruk?.long_description).toContain("Gjenbruksglede")
    expect(gjenbruk?.tags.split("|")).toEqual(expect.arrayContaining(["brukt", "gjenbruk", "lokal"]))
    expect(gjenbruk?.benefits.split("|")).toEqual(
      expect.arrayContaining(["Forlenger levetiden pa varer", "Reduserer avfall"]),
    )
    expect(gjenbruk?.how_to_use.split("|")).toEqual(
      expect.arrayContaining(["Besok stedet eller kontakt aktoren", "Velg brukt nar det dekker behovet"]),
    )

    expect(result.report).toContain("rema-1000-myrene")
    expect(result.report).toContain("Generisk dagligvarekjede")
    expect(result.report).toContain("lyefjell-repair")
    expect(result.report).toContain("utenfor Agder")
  })

  it("tracks repair actors that still need manual actor_repair_services work", async () => {
    const { normalizeCountyImportDataset } = await import("@/lib/county-import-normalizer")

    const result = normalizeCountyImportDataset({
      countySlug: "agder",
      actorsCsv,
      actorSourcesCsv,
    })

    expect(parseCsv(result.actorRepairServicesCsv)).toEqual([])
    expect(result.summary.actorsNeedingRepairServices).toEqual(["phonefix-arendal"])
    expect(result.summary.flaggedActors).toBe(2)
    expect(result.report).toContain("Mangler actor_repair_services")
    expect(result.report).toContain("Facebook eller sosial profil brukes som hovednettsted")
  })
})
