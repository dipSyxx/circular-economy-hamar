export type CountyDefinition = {
  slug: string
  name: string
}

export type MunicipalityDefinition = {
  slug: string
  name: string
  countySlug: string
  countyName: string
}

export type ActorGeoInput = {
  address?: string | null
  postalCode?: string | null
  county?: string | null
  countySlug?: string | null
  municipality?: string | null
  municipalitySlug?: string | null
  city?: string | null
  area?: string | null
}

export type NormalizedActorGeo = {
  postalCode: string | null
  country: "Norway"
  county: string
  countySlug: string
  municipality: string
  municipalitySlug: string
  city: string
  area: string | null
}

export const norwayCounties: CountyDefinition[] = [
  { slug: "agder", name: "Agder" },
  { slug: "akershus", name: "Akershus" },
  { slug: "buskerud", name: "Buskerud" },
  { slug: "finnmark", name: "Finnmark" },
  { slug: "innlandet", name: "Innlandet" },
  { slug: "more-og-romsdal", name: "More og Romsdal" },
  { slug: "nordland", name: "Nordland" },
  { slug: "oslo", name: "Oslo" },
  { slug: "rogaland", name: "Rogaland" },
  { slug: "telemark", name: "Telemark" },
  { slug: "troms", name: "Troms" },
  { slug: "trondelag", name: "Trondelag" },
  { slug: "vestfold", name: "Vestfold" },
  { slug: "vestland", name: "Vestland" },
  { slug: "ostfold", name: "Ostfold" },
]

export const knownMunicipalities: MunicipalityDefinition[] = [
  { slug: "hamar", name: "Hamar", countySlug: "innlandet", countyName: "Innlandet" },
  { slug: "ringsaker", name: "Ringsaker", countySlug: "innlandet", countyName: "Innlandet" },
  { slug: "lillehammer", name: "Lillehammer", countySlug: "innlandet", countyName: "Innlandet" },
  { slug: "baerum", name: "Baerum", countySlug: "akershus", countyName: "Akershus" },
  { slug: "asker", name: "Asker", countySlug: "akershus", countyName: "Akershus" },
  { slug: "oslo", name: "Oslo", countySlug: "oslo", countyName: "Oslo" },
  { slug: "bergen", name: "Bergen", countySlug: "vestland", countyName: "Vestland" },
  { slug: "trondheim", name: "Trondheim", countySlug: "trondelag", countyName: "Trondelag" },
  { slug: "stavanger", name: "Stavanger", countySlug: "rogaland", countyName: "Rogaland" },
  { slug: "tromso", name: "Tromso", countySlug: "troms", countyName: "Troms" },
  { slug: "kristiansand", name: "Kristiansand", countySlug: "agder", countyName: "Agder" },
  { slug: "drammen", name: "Drammen", countySlug: "buskerud", countyName: "Buskerud" },
]

export function slugifyNorwegian(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const countyLookup = new Map(
  norwayCounties.flatMap((county) => [
    [county.slug, county],
    [county.name.toLowerCase(), county],
    [slugifyNorwegian(county.name), county],
  ]),
)

const countyByNameLookup = new Map(norwayCounties.map((county) => [county.name.toLowerCase(), county]))
const countySortOrder = new Map(norwayCounties.map((county, index) => [county.slug, index]))

const municipalityLookup = new Map(
  knownMunicipalities.flatMap((municipality) => [
    [`${municipality.countySlug}:${municipality.slug}`, municipality],
    [`${municipality.countySlug}:${municipality.name.toLowerCase()}`, municipality],
    [`${municipality.countySlug}:${slugifyNorwegian(municipality.name)}`, municipality],
  ]),
)

const municipalityLookupBySlug = new Map(
  knownMunicipalities.flatMap((municipality) => [
    [municipality.slug, municipality],
    [municipality.name.toLowerCase(), municipality],
    [slugifyNorwegian(municipality.name), municipality],
  ]),
)

const municipalitiesByCounty = new Map<string, MunicipalityDefinition[]>(
  norwayCounties.map((county) => [county.slug, []]),
)

for (const municipality of knownMunicipalities) {
  const bucket = municipalitiesByCounty.get(municipality.countySlug) ?? []
  bucket.push(municipality)
  municipalitiesByCounty.set(municipality.countySlug, bucket)
}

for (const bucket of municipalitiesByCounty.values()) {
  bucket.sort((left, right) => left.name.localeCompare(right.name, "no", { sensitivity: "base" }))
}

const cityAliases = new Map<
  string,
  {
    municipality: string
    municipalitySlug: string
    county: string
    countySlug: string
  }
>([
  [
    "furnes",
    {
      municipality: "Ringsaker",
      municipalitySlug: "ringsaker",
      county: "Innlandet",
      countySlug: "innlandet",
    },
  ],
  [
    "hamar",
    {
      municipality: "Hamar",
      municipalitySlug: "hamar",
      county: "Innlandet",
      countySlug: "innlandet",
    },
  ],
  [
    "lillehammer",
    {
      municipality: "Lillehammer",
      municipalitySlug: "lillehammer",
      county: "Innlandet",
      countySlug: "innlandet",
    },
  ],
  [
    "gjettum",
    {
      municipality: "Baerum",
      municipalitySlug: "baerum",
      county: "Akershus",
      countySlug: "akershus",
    },
  ],
  [
    "stabekk",
    {
      municipality: "Baerum",
      municipalitySlug: "baerum",
      county: "Akershus",
      countySlug: "akershus",
    },
  ],
])

const parseAddress = (address?: string | null) => {
  const raw = address?.trim()
  if (!raw) return { postalCode: null, city: null }

  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean)
  const tail = parts.at(-1) ?? ""
  const match = tail.match(/(\d{4})\s+(.+)$/)
  const parsedCity = match?.[2]?.trim() || tail || null

  return {
    postalCode: match?.[1] ?? null,
    city: parsedCity,
  }
}

export function getCountyBySlug(slug: string) {
  return countyLookup.get(slugifyNorwegian(slug)) ?? null
}

export function getCountyByName(name: string) {
  return countyByNameLookup.get(name.trim().toLowerCase()) ?? null
}

export function getCountySortOrder(slug: string) {
  return countySortOrder.get(slug) ?? norwayCounties.length
}

export function getMunicipalityBySlug(slug: string, countySlug?: string | null) {
  if (countySlug) {
    return municipalityLookup.get(`${slugifyNorwegian(countySlug)}:${slugifyNorwegian(slug)}`) ?? null
  }
  return municipalityLookupBySlug.get(slugifyNorwegian(slug)) ?? null
}

export function getMunicipalityByName(name: string, countySlug?: string | null) {
  if (countySlug) {
    return municipalityLookup.get(`${slugifyNorwegian(countySlug)}:${name.trim().toLowerCase()}`) ?? null
  }
  return municipalityLookupBySlug.get(name.trim().toLowerCase()) ?? null
}

export function getMunicipalitiesForCounty(countySlug: string) {
  return municipalitiesByCounty.get(slugifyNorwegian(countySlug)) ?? []
}

export function formatActorGeoLabel(input: {
  city?: string | null
  municipality?: string | null
  county?: string | null
  nationwide?: boolean
}) {
  if (input.nationwide) {
    return "Landsdekkende i Norge"
  }

  const parts = [input.city, input.municipality, input.county]
    .map((part) => part?.trim())
    .filter(Boolean)

  return Array.from(new Set(parts)).join(", ")
}

export function normalizeActorGeo(input: ActorGeoInput): NormalizedActorGeo {
  const parsedAddress = parseAddress(input.address)
  const postalCode = input.postalCode?.trim() || parsedAddress.postalCode
  const area = input.area?.trim() || null
  const providedCity = input.city?.trim() || parsedAddress.city || null

  const normalizedCountySlugInput = input.countySlug?.trim()
  const normalizedCountyInput = input.county?.trim()
  const normalizedMunicipalitySlugInput = input.municipalitySlug?.trim()
  const normalizedMunicipalityInput = input.municipality?.trim()
  const cityAlias = providedCity ? cityAliases.get(slugifyNorwegian(providedCity)) : null
  const matchedCounty =
    (normalizedCountySlugInput ? countyLookup.get(slugifyNorwegian(normalizedCountySlugInput)) : null) ??
    (normalizedCountyInput ? countyLookup.get(slugifyNorwegian(normalizedCountyInput)) : null) ??
    null

  const matchedMunicipality =
    (normalizedMunicipalitySlugInput
      ? getMunicipalityBySlug(normalizedMunicipalitySlugInput, matchedCounty?.slug)
      : null) ??
    (normalizedMunicipalityInput ? getMunicipalityByName(normalizedMunicipalityInput, matchedCounty?.slug) : null) ??
    null

  const municipality =
    matchedMunicipality?.name ?? normalizedMunicipalityInput ?? cityAlias?.municipality ?? providedCity ?? "Ukjent sted"
  const municipalitySlug =
    matchedMunicipality?.slug ??
    normalizedMunicipalitySlugInput?.trim() ??
    cityAlias?.municipalitySlug ??
    slugifyNorwegian(municipality)
  const city = providedCity || normalizedMunicipalityInput || municipality || "Ukjent sted"

  const fallbackCountySlug =
    matchedMunicipality?.countySlug ??
    cityAlias?.countySlug ??
    normalizedCountySlugInput ??
    slugifyNorwegian(normalizedCountyInput ?? "")
  const fallbackCountyName =
    matchedMunicipality?.countyName ?? cityAlias?.county ?? normalizedCountyInput ?? "Ukjent fylke"
  const county = matchedCounty?.name ?? countyLookup.get(fallbackCountySlug)?.name ?? fallbackCountyName
  const countySlug =
    matchedCounty?.slug ?? countyLookup.get(fallbackCountySlug)?.slug ?? slugifyNorwegian(county || "Ukjent fylke")

  return {
    postalCode: postalCode || null,
    country: "Norway",
    county,
    countySlug,
    municipality,
    municipalitySlug,
    city,
    area,
  }
}
