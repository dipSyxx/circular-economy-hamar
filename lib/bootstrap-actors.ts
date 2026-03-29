import { readFile } from "node:fs/promises"
import path from "node:path"
import type { ItemType, ProblemType, SourceType, VerificationStatus } from "@prisma/client"
import { parseCsv } from "@/lib/csv"
import type { ActorPersistInput, ActorRepairServiceInput } from "@/lib/actor-write"

type BootstrapActorFixture = {
  actor: ActorPersistInput
  verificationStatus: VerificationStatus
  verifiedAt: Date | null
  sources: Array<{
    type: SourceType
    title: string
    url: string
    capturedAt: Date | null
    note: string | null
  }>
  repairServices: ActorRepairServiceInput[]
}

const splitList = (value?: string | null) =>
  (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)

const toOptional = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const toNumber = (value?: string | null) => {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const parsed = Number(trimmed.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

const toBoolean = (value?: string | null) => {
  const normalized = value?.trim().toLowerCase()
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "ja"
}

const toDate = (value?: string | null) => {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const loadBootstrapActorFixtures = async (
  rootDir = process.cwd(),
): Promise<BootstrapActorFixture[]> => {
  const directory = path.join(rootDir, "data", "imports", "bootstrap")
  const [actorsCsv, sourcesCsv, repairServicesCsv] = await Promise.all([
    readFile(path.join(directory, "actors.csv"), "utf8"),
    readFile(path.join(directory, "actor_sources.csv"), "utf8"),
    readFile(path.join(directory, "actor_repair_services.csv"), "utf8"),
  ])

  const actorRows = parseCsv(actorsCsv)
  const sourceRows = parseCsv(sourcesCsv)
  const repairServiceRows = parseCsv(repairServicesCsv)

  const sourcesBySlug = new Map<string, BootstrapActorFixture["sources"]>()
  for (const row of sourceRows) {
    const actorSlug = row.actor_slug?.trim()
    if (!actorSlug) continue
    const bucket = sourcesBySlug.get(actorSlug) ?? []
    bucket.push({
      type: (row.type?.trim() || "website") as SourceType,
      title: row.title?.trim() ?? "",
      url: row.url?.trim() ?? "",
      capturedAt: toDate(row.captured_at),
      note: toOptional(row.note),
    })
    sourcesBySlug.set(actorSlug, bucket)
  }

  const repairServicesBySlug = new Map<string, ActorRepairServiceInput[]>()
  for (const row of repairServiceRows) {
    const actorSlug = row.actor_slug?.trim()
    if (!actorSlug) continue
    const bucket = repairServicesBySlug.get(actorSlug) ?? []
    bucket.push({
      problemType: row.problem_type.trim() as ProblemType,
      itemTypes: splitList(row.item_types) as ItemType[],
      priceMin: toNumber(row.price_min) ?? 0,
      priceMax: toNumber(row.price_max) ?? 0,
      etaDays: toNumber(row.eta_days),
    })
    repairServicesBySlug.set(actorSlug, bucket)
  }

  return actorRows.map((row) => {
    const slug = row.actor_slug.trim()
    const actor = {
      name: row.name.trim(),
      slug,
      category: row.category.trim() as ActorPersistInput["category"],
      description: row.description.trim(),
      longDescription: row.long_description.trim(),
      address: row.address.trim(),
      postalCode: toOptional(row.postal_code),
      county: toOptional(row.county),
      countySlug: toOptional(row.county_slug),
      municipality: toOptional(row.municipality),
      municipalitySlug: toOptional(row.municipality_slug),
      city: toOptional(row.city),
      area: toOptional(row.area),
      lat: toNumber(row.lat) ?? 0,
      lng: toNumber(row.lng) ?? 0,
      phone: toOptional(row.phone),
      email: toOptional(row.email),
      website: toOptional(row.website),
      instagram: toOptional(row.instagram),
      openingHours: splitList(row.opening_hours),
      openingHoursOsm: toOptional(row.opening_hours_osm),
      tags: splitList(row.tags),
      benefits: splitList(row.benefits),
      howToUse: splitList(row.how_to_use),
      image: toOptional(row.image),
      nationwide: toBoolean(row.nationwide),
      serviceAreaCountySlugs: splitList(row.service_area_county_slugs),
      serviceAreaMunicipalitySlugs: splitList(row.service_area_municipality_slugs),
    } satisfies ActorPersistInput

    return {
      actor,
      verificationStatus: "editorial_verified" satisfies VerificationStatus,
      verifiedAt: null,
      sources: sourcesBySlug.get(slug) ?? [],
      repairServices: repairServicesBySlug.get(slug) ?? [],
    }
  })
}
