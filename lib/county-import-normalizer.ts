import { supportsRepairServices } from "@/lib/categories"
import { parseCsv, type CsvRow } from "@/lib/csv"
import { getCountyBySlug, slugifyNorwegian } from "@/lib/geo"
import { canonicalizeSourceUrl } from "@/lib/source-quality"

const actorHeaders = [
  "actor_slug",
  "name",
  "category",
  "description",
  "long_description",
  "address",
  "postal_code",
  "county",
  "county_slug",
  "municipality",
  "municipality_slug",
  "city",
  "area",
  "lat",
  "lng",
  "phone",
  "email",
  "website",
  "instagram",
  "opening_hours",
  "opening_hours_osm",
  "tags",
  "benefits",
  "how_to_use",
  "image",
  "nationwide",
  "service_area_county_slugs",
  "service_area_municipality_slugs",
] as const

const actorSourceHeaders = ["actor_slug", "type", "title", "url", "captured_at", "note"] as const
const actorRepairServiceHeaders = [
  "actor_slug",
  "problem_type",
  "item_types",
  "price_min",
  "price_max",
  "eta_days",
] as const

const socialHosts = new Set(["facebook.com", "www.facebook.com", "instagram.com", "www.instagram.com"])
const groceryHosts = new Set([
  "bunnpris.no",
  "coop.no",
  "joker.no",
  "kiwi.no",
  "meny.no",
  "obs.no",
  "rema.no",
  "spar.no",
  "www.bunnpris.no",
  "www.coop.no",
  "www.joker.no",
  "www.kiwi.no",
  "www.meny.no",
  "www.obs.no",
  "www.rema.no",
  "www.spar.no",
])
const nonRepairRetailHosts = new Set([
  ...groceryHosts,
  "bondekompaniet.no",
  "byggmax.no",
  "monter.no",
  "power.no",
  "www.bondekompaniet.no",
  "www.byggmax.no",
  "www.monter.no",
  "www.power.no",
  "www.xl-bygg.no",
  "xl-bygg.no",
])
const genericGroceryTags = new Set(["convenience store", "grocery store", "hypermarket", "supermarket"])
const buildingStoreTags = new Set(["building materials store"])
const lowSignalTags = new Set(["service", "store"])
const repairCuePattern = /fix|iphone|mobil|repar|service|skomaker|sykkel|systue|verksted|elektro/i
const groceryChainPattern = /\b(bunnpris|coop|extra|joker|kiwi|matkroken|meny|obs|rema|spar)\b/i

const agderMunicipalityOverrides: Record<string, { municipality: string; municipalitySlug: string }> = {
  brekkesto: { municipality: "Lillesand", municipalitySlug: "lillesand" },
  byglandsfjord: { municipality: "Bygland", municipalitySlug: "bygland" },
  brennasen: { municipality: "Kristiansand", municipalitySlug: "kristiansand" },
  evje: { municipality: "Evje og Hornnes", municipalitySlug: "evje-og-hornnes" },
  fevik: { municipality: "Kristiansand", municipalitySlug: "kristiansand" },
  finsland: { municipality: "Kristiansand", municipalitySlug: "kristiansand" },
  hamresanden: { municipality: "Kristiansand", municipalitySlug: "kristiansand" },
  his: { municipality: "Arendal", municipalitySlug: "arendal" },
  hisoy: { municipality: "Arendal", municipalitySlug: "arendal" },
  homborsund: { municipality: "Grimstad", municipalitySlug: "grimstad" },
  hornnes: { municipality: "Evje og Hornnes", municipalitySlug: "evje-og-hornnes" },
  "hovden-i-setesdal": { municipality: "Bykle", municipalitySlug: "bykle" },
  nednes: { municipality: "Arendal", municipalitySlug: "arendal" },
  nodeland: { municipality: "Kristiansand", municipalitySlug: "kristiansand" },
  rysstad: { municipality: "Valle", municipalitySlug: "valle" },
  saltrød: { municipality: "Arendal", municipalitySlug: "arendal" },
  saltrod: { municipality: "Arendal", municipalitySlug: "arendal" },
  sogne: { municipality: "Kristiansand", municipalitySlug: "kristiansand" },
  sondaled: { municipality: "Risor", municipalitySlug: "risor" },
  songe: { municipality: "Tvedestrand", municipalitySlug: "tvedestrand" },
  sundebru: { municipality: "Gjerstad", municipalitySlug: "gjerstad" },
  tveit: { municipality: "Kristiansand", municipalitySlug: "kristiansand" },
}

const agderCanonicalMunicipalities = new Set([
  "amli",
  "arendal",
  "birkenes",
  "bygland",
  "bykle",
  "evje-og-hornnes",
  "farsund",
  "flekkefjord",
  "froland",
  "gjerstad",
  "grimstad",
  "haegebostad",
  "iveland",
  "kristiansand",
  "kvinesdal",
  "lillesand",
  "lindesnes",
  "lyngdal",
  "risor",
  "sirdal",
  "tvedestrand",
  "valle",
  "vegarshei",
  "vennesla",
])

const agderExcludedLocalities = new Set(["lyefjell", "vang-i-valdres"])

const categoryTagSeeds: Record<string, string[]> = {
  baerekraftig_mat: ["mat", "lokal"],
  brukt: ["brukt", "lokal"],
  gjenvinning: ["gjenvinning", "lokal"],
  mobelreparasjon: ["reparasjon", "mobler", "lokal"],
  mottak_ombruk: ["ombruk", "innlevering", "lokal"],
  ombruksverksted: ["ombruk", "verksted", "lokal"],
  reparasjon: ["reparasjon", "lokal"],
  reparasjon_sko_klar: ["reparasjon", "klaer", "lokal"],
  sykkelverksted: ["sykkel", "reparasjon", "lokal"],
  utleie: ["utleie", "lokal"],
}

const categoryBenefits: Record<string, string[]> = {
  baerekraftig_mat: ["Kan bidra til mindre matsvinn", "Gir mer bevisste matvalg", "Gir lokale alternativer"],
  brukt: ["Forlenger levetiden pa varer", "Reduserer avfall", "Gir rimeligere alternativer"],
  gjenvinning: ["Gjor det enklere a sortere riktig", "Sikrer bedre materialgjenvinning", "Reduserer restavfall"],
  mobelreparasjon: ["Forlenger levetiden pa mobler", "Kan spare kostnader", "Bevarer eksisterende materialer"],
  mottak_ombruk: ["Gjor det enklere a levere inn brukbare varer", "Holder ressurser i omlop", "Stotter lokal ombruk"],
  ombruksverksted: ["Gir nytt liv til materialer", "Stotter kreativt ombruk", "Reduserer unodvendig avfall"],
  reparasjon: ["Forlenger levetiden pa produkter", "Kan vare rimeligere enn nykjop", "Reduserer avfall"],
  reparasjon_sko_klar: ["Forlenger levetiden pa sko og klaer", "Kan redusere nykjop", "Tar vare pa det du allerede eier"],
  sykkelverksted: ["Holder sykler lenger i bruk", "Kan redusere transportutslipp", "Forebygger unodvendig utskifting"],
  utleie: ["Reduserer behovet for a eie", "Gir tilgang ved behov", "Kan spare plass og penger"],
}

const categoryHowToUse: Record<string, string[]> = {
  baerekraftig_mat: ["Sjekk utvalget hos aktoren", "Sporsmal om lokale eller baerekraftige alternativer", "Velg det som passer behovet ditt"],
  brukt: ["Besok stedet eller kontakt aktoren", "Sjekk utvalg og eventuelle innleveringsmuligheter", "Velg brukt nar det dekker behovet"],
  gjenvinning: ["Sjekk hva som tas imot", "Sorter varene for du drar", "Lever inn pa riktig mottakspunkt"],
  mobelreparasjon: ["Ta kontakt for vurdering av skade", "Be om pris og forventet leveringstid", "Reparer nar det gir nytt liv til moblet"],
  mottak_ombruk: ["Sjekk hva som kan leveres inn", "Sorter varene i forkant", "Lever inn mens varene fortsatt kan brukes"],
  ombruksverksted: ["Ta kontakt om materiale eller prosjekt", "Avklar hva verkstedet kan hjelpe med", "Velg ombruk fremfor kassering nar det er mulig"],
  reparasjon: ["Beskriv feilen for aktoren", "Be om prisoverslag og leveringstid", "Reparer for du vurderer a kjope nytt"],
  reparasjon_sko_klar: ["Ta med plagget eller skoene for vurdering", "Be om anbefalt reparasjon", "Velg reparasjon for du erstatter varen"],
  sykkelverksted: ["Fortell hva som er galt med sykkelen", "Avklar service eller reparasjon", "Vedlikehold regelmessig for lengre levetid"],
  utleie: ["Sjekk tilgjengelighet og vilkar", "Bestill for perioden du trenger", "Lever tilbake slik avtalen beskriver"],
}

type NormalizationIssue = {
  actorSlug: string
  actorName: string
  category: string
  reasons: string[]
}

type CountyNormalizationSummary = {
  sourceActors: number
  keptActors: number
  excludedActors: number
  flaggedActors: number
  sourceRows: number
  keptSourceRows: number
  actorsNeedingRepairServices: string[]
}

export type CountyImportNormalizationResult = {
  actorsCsv: string
  actorSourcesCsv: string
  actorRepairServicesCsv: string
  report: string
  summary: CountyNormalizationSummary
}

type NormalizeCountyImportInput = {
  countySlug: string
  actorsCsv: string
  actorSourcesCsv?: string
  actorRepairServicesCsv?: string
}

const normalizeWhitespace = (value?: string | null) => value?.trim().replace(/\s+/g, " ") ?? ""

const ensureSentence = (value: string) => {
  const trimmed = normalizeWhitespace(value)
  if (!trimmed) return ""
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

const splitList = (value?: string | null) =>
  (value ?? "")
    .split("|")
    .map((item) => normalizeWhitespace(item))
    .filter(Boolean)

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)))

const normalizeBoolean = (value?: string | null) => {
  const normalized = normalizeWhitespace(value).toLowerCase()
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "ja"
}

const csvEscape = (value: string) => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`
  }
  return value
}

const stringifyCsv = (headers: readonly string[], rows: CsvRow[]) => {
  const lines = [headers.join(",")]
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header] ?? "")).join(","))
  }
  return lines.join("\n")
}

const normalizeTagAlias = (value: string) => {
  const normalized = normalizeWhitespace(value).toLowerCase()
  if (!normalized || lowSignalTags.has(normalized)) return []

  switch (normalized) {
    case "asian grocery store":
    case "food store":
    case "grocery store":
    case "health food store":
    case "hypermarket":
    case "supermarket":
      return ["mat"]
    case "building materials store":
      return ["byggevarer"]
    case "cell phone store":
      return ["mobil", "elektronikk"]
    case "clothing store":
    case "used clothing store":
      return ["klaer"]
    case "electronics store":
    case "electronics repair shop":
      return ["elektronikk"]
    case "home goods store":
      return ["interior"]
    case "shoe store":
      return ["sko"]
    case "thrift store":
      return ["gjenbruk"]
    default:
      return []
  }
}

const addNameHeuristicTags = (name: string) => {
  const normalized = slugifyNorwegian(name)
  const tags: string[] = []
  if (/(brukt|fretex|gjenbruk|kirppis|bazar|ombruk)/.test(normalized)) tags.push("gjenbruk")
  if (/(mobil|iphone|data|pc|elektro)/.test(normalized)) tags.push("elektronikk")
  if (/(sykkel|bike)/.test(normalized)) tags.push("sykkel")
  if (/(systue|klaer|tekstil|sko)/.test(normalized)) tags.push("klaer")
  if (/(helsekost|sunkost|marked|mat)/.test(normalized)) tags.push("mat")
  return tags
}

const buildTags = (category: string, name: string, rawTags: string[]) =>
  unique([
    ...(categoryTagSeeds[category] ?? ["lokal"]),
    ...rawTags.flatMap((tag) => normalizeTagAlias(tag)),
    ...addNameHeuristicTags(name),
  ]).slice(0, 6)

const getPreferredWebsite = (row: CsvRow, sources: CsvRow[]) => {
  const currentWebsite = normalizeWhitespace(row.website)
  const websiteSources = sources
    .filter((source) => normalizeWhitespace(source.type) === "website")
    .map((source) => normalizeWhitespace(source.url))
    .filter(Boolean)

  const candidates = unique([currentWebsite, ...websiteSources])
  const primary = candidates.find((candidate) => {
    const { host } = canonicalizeSourceUrl(candidate)
    return host ? !socialHosts.has(host) : false
  })

  return primary ?? candidates[0] ?? ""
}

const getHost = (value?: string | null) => canonicalizeSourceUrl(value).host ?? ""

const isSocialWebsite = (value?: string | null) => socialHosts.has(getHost(value))

const isGenericGrocery = (row: CsvRow) => {
  const host = getHost(row.website)
  const name = normalizeWhitespace(row.name)
  return groceryHosts.has(host) || groceryChainPattern.test(name)
}

const isSuspiciousRepairRetail = (row: CsvRow) => {
  const host = getHost(row.website)
  const tags = splitList(row.tags).map((tag) => tag.toLowerCase())
  return (
    nonRepairRetailHosts.has(host) ||
    groceryChainPattern.test(normalizeWhitespace(row.name)) ||
    tags.some((tag) => genericGroceryTags.has(tag) || buildingStoreTags.has(tag)) ||
    (!repairCuePattern.test(row.name) && !repairCuePattern.test(row.description))
  )
}

const isSuspiciousOmbrukRetail = (row: CsvRow) => {
  const host = getHost(row.website)
  const tags = splitList(row.tags).map((tag) => tag.toLowerCase())
  return tags.some((tag) => buildingStoreTags.has(tag)) || host.endsWith("bygg.no") || host.includes("byggmax")
}

const buildLongDescription = (row: CsvRow, countyName: string) => {
  const location = normalizeWhitespace(row.city) || normalizeWhitespace(row.municipality) || countyName
  const description = ensureSentence(row.description)
  const intros: Record<string, string> = {
    baerekraftig_mat: "er en lokal aktor for mer bevisste matvalg",
    brukt: "er en lokal aktor for gjenbruk",
    gjenvinning: "er et lokalt tilbud for gjenvinning",
    mobelreparasjon: "er en lokal aktor for mobelreparasjon",
    mottak_ombruk: "er et lokalt mottak for ombruk",
    ombruksverksted: "er et lokalt verksted for ombruk",
    reparasjon: "er en lokal aktor for reparasjon",
    reparasjon_sko_klar: "er en lokal aktor for reparasjon av sko og klaer",
    sykkelverksted: "er et lokalt sykkelverksted",
    utleie: "er en lokal aktor for utleie",
  }

  return `${normalizeWhitespace(row.name)} i ${location} ${intros[row.category] ?? "er en lokal aktor" } i ${countyName}. ${description}`.trim()
}

const normalizeLocality = (countySlug: string, row: CsvRow) => {
  const municipalitySlugInput =
    normalizeWhitespace(row.municipality_slug) ||
    slugifyNorwegian(normalizeWhitespace(row.municipality) || normalizeWhitespace(row.city))
  const citySlug = slugifyNorwegian(normalizeWhitespace(row.city))
  const override =
    (countySlug === "agder" && agderMunicipalityOverrides[municipalitySlugInput]) ||
    (countySlug === "agder" && citySlug ? agderMunicipalityOverrides[citySlug] : undefined)

  if (!override) {
    return {
      municipality: normalizeWhitespace(row.municipality),
      municipalitySlug: municipalitySlugInput,
      city: normalizeWhitespace(row.city) || normalizeWhitespace(row.municipality),
    }
  }

  return {
    municipality: override.municipality,
    municipalitySlug: override.municipalitySlug,
    city: normalizeWhitespace(row.city) || normalizeWhitespace(row.municipality) || override.municipality,
  }
}

const buildActorRow = (countySlug: string, countyName: string, row: CsvRow, sources: CsvRow[]) => {
  const locality = normalizeLocality(countySlug, row)
  const normalizedRow: CsvRow = {
    actor_slug: normalizeWhitespace(row.actor_slug),
    name: normalizeWhitespace(row.name),
    category: normalizeWhitespace(row.category),
    description: ensureSentence(row.description),
    long_description: buildLongDescription(
      {
        ...row,
        municipality: locality.municipality,
        city: locality.city,
      },
      countyName,
    ),
    address: normalizeWhitespace(row.address),
    postal_code: normalizeWhitespace(row.postal_code),
    county: countyName,
    county_slug: countySlug,
    municipality: locality.municipality,
    municipality_slug: locality.municipalitySlug,
    city: locality.city,
    area: normalizeWhitespace(row.area),
    lat: normalizeWhitespace(row.lat),
    lng: normalizeWhitespace(row.lng),
    phone: normalizeWhitespace(row.phone),
    email: normalizeWhitespace(row.email),
    website: getPreferredWebsite(row, sources),
    instagram: normalizeWhitespace(row.instagram),
    opening_hours: splitList(row.opening_hours).join("|"),
    opening_hours_osm: normalizeWhitespace(row.opening_hours_osm),
    tags: buildTags(normalizeWhitespace(row.category), normalizeWhitespace(row.name), splitList(row.tags)).join("|"),
    benefits: (categoryBenefits[normalizeWhitespace(row.category)] ?? ["Stotter sirkulaer bruk av ressurser"]).join("|"),
    how_to_use: (categoryHowToUse[normalizeWhitespace(row.category)] ?? ["Ta kontakt med aktoren og avklar tilbudet"]).join("|"),
    image: normalizeWhitespace(row.image),
    nationwide: normalizeBoolean(row.nationwide) ? "true" : "false",
    service_area_county_slugs: unique(splitList(row.service_area_county_slugs).map((value) => slugifyNorwegian(value))).join("|"),
    service_area_municipality_slugs: unique(
      splitList(row.service_area_municipality_slugs).map((value) => slugifyNorwegian(value)),
    ).join("|"),
  }

  return normalizedRow
}

const buildExclusionReasons = (countySlug: string, row: CsvRow) => {
  const reasons: string[] = []
  const localitySlug = normalizeWhitespace(row.municipality_slug)
  const citySlug = slugifyNorwegian(normalizeWhitespace(row.city))

  if (countySlug === "agder" && (agderExcludedLocalities.has(localitySlug) || agderExcludedLocalities.has(citySlug))) {
    reasons.push("Lokasjonen ser ut til a vare utenfor Agder og bor ikke importeres automatisk.")
  }
  if (row.category === "baerekraftig_mat" && isGenericGrocery(row)) {
    reasons.push("Generisk dagligvarekjede i baerekraftig_mat.")
  }
  if (row.category === "reparasjon" && isSuspiciousRepairRetail(row)) {
    reasons.push("Kategorien reparasjon matcher ikke aktorprofilen godt nok for auto-import.")
  }
  if (row.category === "mottak_ombruk" && isSuspiciousOmbrukRetail(row)) {
    reasons.push("Kategorien mottak_ombruk matcher ikke butikktype og bor avklares manuelt.")
  }

  return reasons
}

const buildFlags = (countySlug: string, row: CsvRow, hasRepairServices: boolean) => {
  const flags: string[] = []

  if (!normalizeWhitespace(row.website)) {
    flags.push("Mangler nettsted.")
  } else if (isSocialWebsite(row.website)) {
    flags.push("Facebook eller sosial profil brukes som hovednettsted.")
  }

  if (!normalizeWhitespace(row.opening_hours_osm)) {
    flags.push("Mangler opening_hours_osm.")
  }

  if (supportsRepairServices(row.category) && !hasRepairServices) {
    flags.push("Mangler actor_repair_services.")
  }

  if (countySlug === "agder" && !agderCanonicalMunicipalities.has(normalizeWhitespace(row.municipality_slug))) {
    flags.push("Kommunefeltet ser ut til a bruke et tettsted eller delomrade og bor sjekkes manuelt.")
  }

  return flags
}

const formatIssueSection = (title: string, issues: NormalizationIssue[]) => {
  if (issues.length === 0) {
    return `## ${title}\n\nIngen.\n`
  }

  const lines = [`## ${title}`, ""]
  for (const issue of issues) {
    lines.push(`- \`${issue.actorSlug}\` (${issue.category}): ${issue.reasons.join("; ")}`)
  }
  lines.push("")
  return lines.join("\n")
}

const buildReport = (
  countyName: string,
  summary: CountyNormalizationSummary,
  excluded: NormalizationIssue[],
  flagged: NormalizationIssue[],
) => {
  const header = [
    `# ${countyName} County Import Normalization Report`,
    "",
    `- Source actors: ${summary.sourceActors}`,
    `- Kept actors: ${summary.keptActors}`,
    `- Excluded actors: ${summary.excludedActors}`,
    `- Flagged actors: ${summary.flaggedActors}`,
    `- Source rows kept: ${summary.keptSourceRows} / ${summary.sourceRows}`,
    "",
  ]

  const repairFollowUp =
    summary.actorsNeedingRepairServices.length === 0
      ? "## Repair Follow-up\n\nIngen.\n"
      : [
          "## Repair Follow-up",
          "",
          ...summary.actorsNeedingRepairServices.map((slug) => `- \`${slug}\`: Mangler actor_repair_services.`),
          "",
        ].join("\n")

  return [
    ...header,
    formatIssueSection("Excluded Actors", excluded),
    formatIssueSection("Flagged Actors", flagged),
    repairFollowUp,
  ].join("\n")
}

export const normalizeCountyImportDataset = ({
  countySlug,
  actorsCsv,
  actorSourcesCsv,
  actorRepairServicesCsv,
}: NormalizeCountyImportInput): CountyImportNormalizationResult => {
  const countyName = getCountyBySlug(countySlug)?.name ?? countySlug
  const actorRows = parseCsv(actorsCsv)
  const sourceRows = actorSourcesCsv ? parseCsv(actorSourcesCsv) : []
  const repairServiceRows = actorRepairServicesCsv ? parseCsv(actorRepairServicesCsv) : []
  const repairServiceSlugs = new Set(repairServiceRows.map((row) => normalizeWhitespace(row.actor_slug)).filter(Boolean))
  const sourcesBySlug = new Map<string, CsvRow[]>()

  for (const row of sourceRows) {
    const actorSlug = normalizeWhitespace(row.actor_slug)
    if (!actorSlug) continue
    const bucket = sourcesBySlug.get(actorSlug) ?? []
    bucket.push(row)
    sourcesBySlug.set(actorSlug, bucket)
  }

  const keptActors: CsvRow[] = []
  const excludedActors: NormalizationIssue[] = []
  const flaggedActors: NormalizationIssue[] = []
  const keptActorSlugs = new Set<string>()

  for (const actorRow of actorRows) {
    const rawActor = {
      ...actorRow,
      actor_slug: normalizeWhitespace(actorRow.actor_slug),
      category: normalizeWhitespace(actorRow.category),
      municipality_slug: slugifyNorwegian(normalizeWhitespace(actorRow.municipality_slug) || normalizeWhitespace(actorRow.municipality)),
      city: normalizeWhitespace(actorRow.city) || normalizeWhitespace(actorRow.municipality),
      name: normalizeWhitespace(actorRow.name),
      description: ensureSentence(actorRow.description),
      website: normalizeWhitespace(actorRow.website),
      tags: splitList(actorRow.tags).join("|"),
    }

    const reasons = buildExclusionReasons(countySlug, rawActor)
    if (reasons.length > 0) {
      excludedActors.push({
        actorSlug: rawActor.actor_slug,
        actorName: rawActor.name,
        category: rawActor.category,
        reasons,
      })
      continue
    }

    const normalizedActor = buildActorRow(
      countySlug,
      countyName,
      {
        ...actorRow,
        website: rawActor.website,
      },
      sourcesBySlug.get(rawActor.actor_slug) ?? [],
    )

    keptActors.push(normalizedActor)
    keptActorSlugs.add(normalizedActor.actor_slug)

    const actorFlags = buildFlags(countySlug, normalizedActor, repairServiceSlugs.has(normalizedActor.actor_slug))
    if (actorFlags.length > 0) {
      flaggedActors.push({
        actorSlug: normalizedActor.actor_slug,
        actorName: normalizedActor.name,
        category: normalizedActor.category,
        reasons: actorFlags,
      })
    }
  }

  const seenSourceKeys = new Set<string>()
  const keptSources: CsvRow[] = []
  for (const sourceRow of sourceRows) {
    const actorSlug = normalizeWhitespace(sourceRow.actor_slug)
    if (!keptActorSlugs.has(actorSlug)) continue

    const normalizedSource: CsvRow = {
      actor_slug: actorSlug,
      type: normalizeWhitespace(sourceRow.type) || "website",
      title: normalizeWhitespace(sourceRow.title) || "Kilde",
      url: normalizeWhitespace(sourceRow.url),
      captured_at: normalizeWhitespace(sourceRow.captured_at),
      note: normalizeWhitespace(sourceRow.note),
    }

    const canonical = canonicalizeSourceUrl(normalizedSource.url).canonicalUrl ?? normalizedSource.url
    const dedupeKey = `${normalizedSource.actor_slug}|${normalizedSource.type}|${canonical}`
    if (seenSourceKeys.has(dedupeKey)) continue
    seenSourceKeys.add(dedupeKey)
    keptSources.push(normalizedSource)
  }

  const keptRepairServices = repairServiceRows
    .filter((row) => keptActorSlugs.has(normalizeWhitespace(row.actor_slug)))
    .map((row) =>
      actorRepairServiceHeaders.reduce<CsvRow>((acc, header) => {
        acc[header] = normalizeWhitespace(row[header])
        return acc
      }, {}),
    )

  const summary: CountyNormalizationSummary = {
    sourceActors: actorRows.length,
    keptActors: keptActors.length,
    excludedActors: excludedActors.length,
    flaggedActors: flaggedActors.length,
    sourceRows: sourceRows.length,
    keptSourceRows: keptSources.length,
    actorsNeedingRepairServices: flaggedActors
      .filter((issue) => issue.reasons.includes("Mangler actor_repair_services."))
      .map((issue) => issue.actorSlug),
  }

  return {
    actorsCsv: stringifyCsv(actorHeaders, keptActors),
    actorSourcesCsv: stringifyCsv(actorSourceHeaders, keptSources),
    actorRepairServicesCsv: stringifyCsv(actorRepairServiceHeaders, keptRepairServices),
    report: buildReport(countyName, summary, excludedActors, flaggedActors),
    summary,
  }
}
