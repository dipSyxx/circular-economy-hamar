import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import {
  getCountyBySlug,
  getCountySortOrder,
  getMunicipalityByName,
  getMunicipalityBySlug,
  knownMunicipalities,
  normalizeActorGeo,
  norwayCounties,
  slugifyNorwegian,
  type ActorGeoInput,
} from "@/lib/geo"

type GeoDbClient = Prisma.TransactionClient | typeof prisma

type CanonicalCountyRecord = {
  id: string
  slug: string
  name: string
}

type CanonicalMunicipalityRecord = {
  id: string
  slug: string
  name: string
  countyId: string
}

type ResolveGeoOptions = {
  createMissingMunicipality?: boolean
}

const dedupeByKey = <T>(items: T[], getKey: (item: T) => string) => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = getKey(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const resolveCountyDefinition = (value?: string | null) => {
  if (!value) return null
  return getCountyBySlug(value)
}

const upsertCounty = async (db: GeoDbClient, slug: string) => {
  const county = getCountyBySlug(slug)
  if (!county) {
    throw new Error(`Ugyldig fylke: ${slug}`)
  }

  return db.county.upsert({
    where: { slug: county.slug },
    update: {
      name: county.name,
      sortOrder: getCountySortOrder(county.slug),
    },
    create: {
      slug: county.slug,
      name: county.name,
      sortOrder: getCountySortOrder(county.slug),
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  })
}

const createMunicipalityRecord = async (
  db: GeoDbClient,
  county: CanonicalCountyRecord,
  municipality: { slug: string; name: string },
) => {
  const siblings = await db.municipality.count({
    where: { countyId: county.id },
  })

  return db.municipality.upsert({
    where: {
      countyId_slug: {
        countyId: county.id,
        slug: municipality.slug,
      },
    },
    update: {
      name: municipality.name,
    },
    create: {
      countyId: county.id,
      slug: municipality.slug,
      name: municipality.name,
      sortOrder: siblings,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      countyId: true,
    },
  })
}

export const seedCanonicalGeoTaxonomy = async (
  db: GeoDbClient,
  extraMunicipalities: Array<Pick<ActorGeoInput, "county" | "countySlug" | "municipality" | "municipalitySlug">> = [],
) => {
  for (const county of norwayCounties) {
    await upsertCounty(db, county.slug)
  }

  const normalizedExtraMunicipalities = dedupeByKey(
    extraMunicipalities
      .map((item) => normalizeActorGeo(item))
      .filter((item) => resolveCountyDefinition(item.countySlug) && item.municipality && item.municipalitySlug),
    (item) => `${item.countySlug}:${item.municipalitySlug}`,
  )

  const municipalityDefinitions = dedupeByKey(
    [
      ...knownMunicipalities,
      ...normalizedExtraMunicipalities.map((item) => ({
        slug: item.municipalitySlug,
        name: item.municipality,
        countySlug: item.countySlug,
        countyName: item.county,
      })),
    ],
    (item) => `${item.countySlug}:${item.slug}`,
  )

  for (const municipality of municipalityDefinitions) {
    const county = await upsertCounty(db, municipality.countySlug)
    await createMunicipalityRecord(db, county, municipality)
  }
}

export const resolveCanonicalActorGeo = async (
  db: GeoDbClient,
  input: ActorGeoInput,
  options: ResolveGeoOptions = {},
) => {
  const normalizedGeo = normalizeActorGeo(input)
  const countyDefinition = getCountyBySlug(normalizedGeo.countySlug)

  if (!countyDefinition) {
    throw new Error("Velg et gyldig fylke.")
  }

  const countyRecord = await upsertCounty(db, countyDefinition.slug)

  let municipalityRecord = await db.municipality.findFirst({
    where: {
      countyId: countyRecord.id,
      OR: [
        { slug: normalizedGeo.municipalitySlug },
        { name: normalizedGeo.municipality },
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      countyId: true,
    },
  })

  if (!municipalityRecord) {
    const municipalityDefinition =
      getMunicipalityBySlug(normalizedGeo.municipalitySlug, countyRecord.slug) ??
      getMunicipalityByName(normalizedGeo.municipality, countyRecord.slug)

    if (!municipalityDefinition && !options.createMissingMunicipality) {
      throw new Error("Velg en gyldig kommune.")
    }

    municipalityRecord = await createMunicipalityRecord(db, countyRecord, {
      slug: municipalityDefinition?.slug ?? slugifyNorwegian(normalizedGeo.municipality),
      name: municipalityDefinition?.name ?? normalizedGeo.municipality,
    })
  }

  return {
    normalizedGeo: {
      ...normalizedGeo,
      county: countyRecord.name,
      countySlug: countyRecord.slug,
      municipality: municipalityRecord.name,
      municipalitySlug: municipalityRecord.slug,
    },
    countyRecord,
    municipalityRecord,
  }
}

export const resolveCountyRecordsBySlugs = async (db: GeoDbClient, countySlugs: string[]) => {
  const normalizedSlugs = Array.from(new Set(countySlugs.map((slug) => slugifyNorwegian(slug)).filter(Boolean)))
  const records: CanonicalCountyRecord[] = []

  for (const slug of normalizedSlugs) {
    records.push(await upsertCounty(db, slug))
  }

  return records
}

export const resolveMunicipalityRecordsBySlugs = async (
  db: GeoDbClient,
  municipalitySlugs: string[],
  options: ResolveGeoOptions = {},
) => {
  const normalizedSlugs = Array.from(
    new Set(municipalitySlugs.map((slug) => slugifyNorwegian(slug)).filter(Boolean)),
  )
  const existing = await db.municipality.findMany({
    where: {
      slug: { in: normalizedSlugs },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      countyId: true,
      county: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  })

  const groupedBySlug = new Map<string, typeof existing>()
  for (const municipality of existing) {
    const bucket = groupedBySlug.get(municipality.slug) ?? []
    bucket.push(municipality)
    groupedBySlug.set(municipality.slug, bucket)
  }

  const records: CanonicalMunicipalityRecord[] = []

  for (const slug of normalizedSlugs) {
    const matches = groupedBySlug.get(slug) ?? []
    if (matches.length > 1) {
      throw new Error(`Kommuneslug er tvetydig og ma spesifiseres tydeligere: ${slug}`)
    }
    if (matches.length === 1) {
      records.push(matches[0])
      continue
    }

    const municipalityDefinition = getMunicipalityBySlug(slug)
    if (!municipalityDefinition || !options.createMissingMunicipality) {
      throw new Error(`Ukjent kommune i service area: ${slug}`)
    }

    const county = await upsertCounty(db, municipalityDefinition.countySlug)
    records.push(await createMunicipalityRecord(db, county, municipalityDefinition))
  }

  return records
}
