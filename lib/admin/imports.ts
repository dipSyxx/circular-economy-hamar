import {
  Prisma,
  type Actor as PrismaActor,
  ActorImportAction,
  ActorImportBatchStatus,
  ActorImportMatchStrategy,
  ActorImportRowType,
  type ActorCategory,
  type ItemType,
  type ProblemType,
  type SourceType,
} from "@prisma/client"
import { parseCsv, type CsvRow } from "@/lib/csv"
import { prisma } from "@/lib/prisma"
import { categoryOrder, supportsRepairServices } from "@/lib/categories"
import { repairServiceRowMatchesScope } from "@/lib/category-repair-scope"
import { getCountyBySlug, getMunicipalityBySlug, normalizeActorGeo } from "@/lib/geo"
import {
  assertActorCanAcceptRepairServices,
  assertActorCategorySupportsExistingRepairServices,
  assertRepairServicesAllowed,
  prepareActorPersistData,
  replaceActorBrowseScopes,
  replaceActorServiceAreas,
} from "@/lib/actor-write"
import { seedCanonicalGeoTaxonomy } from "@/lib/geo-taxonomy"
import { formatCategoryLabel } from "@/lib/enum-labels"
import { ITEM_TYPES, PROBLEM_TYPES } from "@/lib/prisma-enums"
import { canonicalizeSourceUrl, getActorQualitySummary } from "@/lib/source-quality"
import type { ActorImportBatchSummary, ActorImportRowSummary } from "@/lib/data"
import { refreshAutomationStateForActors, refreshAutomationStateForCounties } from "@/lib/admin/automation"

type ImportPreviewInput = {
  filename: string
  actorsCsv: string
  actorSourcesCsv?: string
  actorRepairServicesCsv?: string
  createdById?: string | null
}

type ExistingActor = Pick<
  PrismaActor,
  | "id"
  | "name"
  | "slug"
  | "category"
  | "description"
  | "longDescription"
  | "address"
  | "postalCode"
  | "country"
  | "county"
  | "countySlug"
  | "municipality"
  | "municipalitySlug"
  | "city"
  | "area"
  | "lat"
  | "lng"
  | "phone"
  | "email"
  | "website"
  | "instagram"
  | "openingHours"
  | "openingHoursOsm"
  | "tags"
  | "benefits"
  | "howToUse"
  | "image"
  | "nationwide"
>

type PreviewRow = {
  rowType: "actor" | "actor_source" | "actor_repair_service"
  rowNumber: number
  rawData: Record<string, unknown>
  normalizedData?: Record<string, unknown> | null
  matchStrategy?: "slug" | "website_host" | "name_postal" | "none" | null
  matchedActorId?: string | null
  action: "create" | "update" | "skip" | "error"
  validationErrors: string[]
  warnings: string[]
}

type PreviewActorTarget = {
  slug: string
  existingActor: ExistingActor | null
  action: PreviewRow["action"]
  normalizedData?: Record<string, unknown> | null
  matchedActorId?: string | null
  category?: ActorCategory
}

const actorCategorySet = new Set(categoryOrder)
const sourceTypes = new Set<SourceType>(["website", "social", "google_reviews", "article", "map"])
const problemTypes = new Set<string>(PROBLEM_TYPES)
const itemTypes = new Set<string>(ITEM_TYPES)

const toInputJson = (value: unknown): Prisma.InputJsonValue => {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

const normalizeText = (value?: string | null) => value?.trim() ?? ""

const splitList = (value?: string | null) =>
  (value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)

const normalizeOptional = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const parseBoolean = (value?: string | null) => {
  const normalized = value?.trim().toLowerCase()
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "ja"
}

const parseNumber = (value?: string | null) => {
  const normalized = value?.trim()
  if (!normalized) return null
  const parsed = Number(normalized.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

const buildCanonicalSourceKey = (actorKey: string, url?: string | null) => {
  const canonical = canonicalizeSourceUrl(url)
  return canonical.canonicalUrl ? `${actorKey}|${canonical.canonicalUrl}` : null
}

const normalizeWebsiteMatchValue = (value?: string | null) => {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(withProtocol)
    const pathname = url.pathname.replace(/\/+$/, "")
    return `${url.hostname.toLowerCase()}${pathname}` || url.hostname.toLowerCase()
  } catch {
    return null
  }
}

const buildNamePostalKey = (name?: string | null, postalCode?: string | null) => {
  const normalizedName = normalizeText(name).toLowerCase()
  const normalizedPostalCode = normalizeText(postalCode)
  if (!normalizedName || !normalizedPostalCode) return null
  return `${normalizedName}::${normalizedPostalCode}`
}

const pickRowValue = (row: CsvRow, ...keys: string[]) => {
  for (const key of keys) {
    const value = row[key]
    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }
  return ""
}

const buildActorPayload = (row: CsvRow, existingActor: ExistingActor | null) => {
  const slug = pickRowValue(row, "actor_slug", "slug")
  const geo = normalizeActorGeo({
    address: normalizeOptional(pickRowValue(row, "address")) ?? existingActor?.address ?? null,
    postalCode: normalizeOptional(pickRowValue(row, "postal_code")) ?? existingActor?.postalCode ?? null,
    countySlug: normalizeOptional(pickRowValue(row, "county_slug")) ?? existingActor?.countySlug ?? null,
    county: normalizeOptional(pickRowValue(row, "county")) ?? existingActor?.county ?? null,
    municipalitySlug:
      normalizeOptional(pickRowValue(row, "municipality_slug")) ?? existingActor?.municipalitySlug ?? null,
    municipality: normalizeOptional(pickRowValue(row, "municipality")) ?? existingActor?.municipality ?? null,
    city: normalizeOptional(pickRowValue(row, "city")) ?? existingActor?.city ?? null,
    area: normalizeOptional(pickRowValue(row, "area")) ?? existingActor?.area ?? null,
  })

  return {
    name: normalizeOptional(pickRowValue(row, "name")) ?? existingActor?.name ?? "",
    slug,
    category: (pickRowValue(row, "category") || existingActor?.category || "") as ActorCategory,
    description: normalizeOptional(pickRowValue(row, "description")) ?? existingActor?.description ?? "",
    longDescription:
      normalizeOptional(pickRowValue(row, "long_description")) ??
      existingActor?.longDescription ??
      normalizeOptional(pickRowValue(row, "description")) ??
      "",
    address: normalizeOptional(pickRowValue(row, "address")) ?? existingActor?.address ?? "",
    postalCode: geo.postalCode,
    country: "Norway",
    county: geo.county,
    countySlug: geo.countySlug,
    municipality: geo.municipality,
    municipalitySlug: geo.municipalitySlug,
    city: geo.city,
    area: geo.area,
    lat: parseNumber(pickRowValue(row, "lat")) ?? existingActor?.lat ?? null,
    lng: parseNumber(pickRowValue(row, "lng")) ?? existingActor?.lng ?? null,
    phone: normalizeOptional(pickRowValue(row, "phone")) ?? existingActor?.phone ?? null,
    email: normalizeOptional(pickRowValue(row, "email")) ?? existingActor?.email ?? null,
    website: normalizeOptional(pickRowValue(row, "website")) ?? existingActor?.website ?? null,
    instagram: normalizeOptional(pickRowValue(row, "instagram")) ?? existingActor?.instagram ?? null,
    openingHours: splitList(pickRowValue(row, "opening_hours")).length
      ? splitList(pickRowValue(row, "opening_hours"))
      : existingActor?.openingHours ?? [],
    openingHoursOsm:
      normalizeOptional(pickRowValue(row, "opening_hours_osm")) ?? existingActor?.openingHoursOsm ?? null,
    tags: splitList(pickRowValue(row, "tags")).length ? splitList(pickRowValue(row, "tags")) : existingActor?.tags ?? [],
    benefits:
      splitList(pickRowValue(row, "benefits")).length ? splitList(pickRowValue(row, "benefits")) : existingActor?.benefits ?? [],
      howToUse:
        splitList(pickRowValue(row, "how_to_use")).length
          ? splitList(pickRowValue(row, "how_to_use"))
          : existingActor?.howToUse ?? [],
      image: normalizeOptional(pickRowValue(row, "image")) ?? existingActor?.image ?? null,
      nationwide: pickRowValue(row, "nationwide")
        ? parseBoolean(pickRowValue(row, "nationwide"))
        : existingActor?.nationwide ?? false,
      serviceAreaCountySlugs: splitList(pickRowValue(row, "service_area_county_slugs")),
      serviceAreaMunicipalitySlugs: splitList(pickRowValue(row, "service_area_municipality_slugs")),
    }
  }

const hasActorDifferences = (existingActor: ExistingActor, normalized: Record<string, unknown>) => {
  const comparableExisting = {
    name: existingActor.name,
    slug: existingActor.slug,
    category: existingActor.category,
    description: existingActor.description,
    longDescription: existingActor.longDescription,
    address: existingActor.address,
    postalCode: existingActor.postalCode,
    country: existingActor.country,
    county: existingActor.county,
    countySlug: existingActor.countySlug,
    municipality: existingActor.municipality,
    municipalitySlug: existingActor.municipalitySlug,
    city: existingActor.city,
    area: existingActor.area,
    lat: existingActor.lat,
    lng: existingActor.lng,
    phone: existingActor.phone,
    email: existingActor.email,
    website: existingActor.website,
    instagram: existingActor.instagram,
    openingHours: existingActor.openingHours,
    openingHoursOsm: existingActor.openingHoursOsm,
    tags: existingActor.tags,
    benefits: existingActor.benefits,
    howToUse: existingActor.howToUse,
    image: existingActor.image,
    nationwide: existingActor.nationwide,
    serviceAreaCountySlugs: [],
    serviceAreaMunicipalitySlugs: [],
  }

  return JSON.stringify(comparableExisting) !== JSON.stringify(normalized)
}

const serializeBatch = (batch: {
  id: string
  filename: string
  status: ActorImportBatchStatus
  targetCounties: string[]
  totalRows: number
  createCount: number
  updateCount: number
  skipCount: number
  errorCount: number
  warningCount: number
  errorSummary: unknown
  createdAt: Date
  appliedAt: Date | null
  createdBy?: { id: string; name: string | null; email: string | null } | null
}): ActorImportBatchSummary => ({
  id: batch.id,
  filename: batch.filename,
  status: batch.status,
  targetCounties: batch.targetCounties,
  totalRows: batch.totalRows,
  createCount: batch.createCount,
  updateCount: batch.updateCount,
  skipCount: batch.skipCount,
  errorCount: batch.errorCount,
  warningCount: batch.warningCount,
  errorSummary: (batch.errorSummary as Record<string, unknown> | null) ?? null,
  createdBy: batch.createdBy,
  createdAt: batch.createdAt.toISOString(),
  appliedAt: batch.appliedAt?.toISOString() ?? null,
})

const serializeRow = (row: {
  id: string
  batchId: string
  rowType: ActorImportRowType
  rowNumber: number
  rawData: unknown
  normalizedData: unknown
  matchStrategy: ActorImportMatchStrategy | null
  matchedActorId: string | null
  action: ActorImportAction
  validationErrors: string[]
  warnings: string[]
  appliedAt: Date | null
  createdAt: Date
}): ActorImportRowSummary => ({
  id: row.id,
  batchId: row.batchId,
  rowType: row.rowType,
  rowNumber: row.rowNumber,
  rawData: (row.rawData as Record<string, unknown>) ?? {},
  normalizedData: (row.normalizedData as Record<string, unknown> | null) ?? null,
  matchStrategy: row.matchStrategy,
  matchedActorId: row.matchedActorId,
  action: row.action,
  validationErrors: row.validationErrors,
  warnings: row.warnings,
  appliedAt: row.appliedAt?.toISOString() ?? null,
  createdAt: row.createdAt.toISOString(),
})

export const listActorImportBatches = async () => {
  const batches = await prisma.actorImportBatch.findMany({
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return batches.map(serializeBatch)
}

const listActorImportRows = async (batchId: string) => {
  const rows = await prisma.actorImportRow.findMany({
    where: { batchId },
    orderBy: [{ rowType: "asc" }, { rowNumber: "asc" }],
  })

  return rows.map(serializeRow)
}

export const createActorImportPreview = async (input: ImportPreviewInput) => {
  const actorRows = parseCsv(input.actorsCsv)
  if (actorRows.length === 0) {
    throw new Error("actors.csv er påkrevd og kan ikke være tom.")
  }

  const [sourceRows, repairServiceRows, existingActors, existingSources, existingServices] = await Promise.all([
    Promise.resolve(input.actorSourcesCsv ? parseCsv(input.actorSourcesCsv) : []),
    Promise.resolve(input.actorRepairServicesCsv ? parseCsv(input.actorRepairServicesCsv) : []),
    prisma.actor.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        longDescription: true,
        address: true,
        postalCode: true,
        country: true,
        county: true,
        countySlug: true,
        municipality: true,
        municipalitySlug: true,
        city: true,
        area: true,
        lat: true,
        lng: true,
        phone: true,
        email: true,
        website: true,
        instagram: true,
        openingHours: true,
        openingHoursOsm: true,
        tags: true,
        benefits: true,
        howToUse: true,
        image: true,
        nationwide: true,
      },
    }),
    prisma.actorSource.findMany({
      select: {
        id: true,
        actorId: true,
        type: true,
        url: true,
        title: true,
        note: true,
        capturedAt: true,
      },
    }),
    prisma.actorRepairService.findMany({
      select: {
        id: true,
        actorId: true,
        problemType: true,
        itemTypes: true,
        priceMin: true,
        priceMax: true,
        etaDays: true,
      },
    }),
  ])

  const actorsBySlug = new Map(existingActors.map((actor) => [actor.slug, actor]))
  const actorsByWebsiteHost = new Map(
    existingActors.flatMap((actor) => {
      const host = normalizeWebsiteMatchValue(actor.website)
      return host ? [[host, actor] as const] : []
    }),
  )
  const actorsByNamePostal = new Map(
    existingActors.flatMap((actor) => {
      const key = buildNamePostalKey(actor.name, actor.postalCode)
      return key ? [[key, actor] as const] : []
    }),
  )
  const repairServiceCountByActorId = new Map<string, number>()
  for (const service of existingServices) {
    repairServiceCountByActorId.set(service.actorId, (repairServiceCountByActorId.get(service.actorId) ?? 0) + 1)
  }
  const existingSourcesByActorId = new Map<string, typeof existingSources>()
  const sourcesByActorKey = new Map<string, (typeof existingSources)[number]>()
  for (const source of existingSources) {
    const bucket = existingSourcesByActorId.get(source.actorId) ?? []
    bucket.push(source)
    existingSourcesByActorId.set(source.actorId, bucket)
    const canonicalKey = buildCanonicalSourceKey(source.actorId, source.url)
    if (canonicalKey && !sourcesByActorKey.has(canonicalKey)) {
      sourcesByActorKey.set(canonicalKey, source)
    }
  }
  const servicesByActorKey = new Map(
    existingServices.map((service) => [
      `${service.actorId}|${service.problemType}|${[...service.itemTypes].sort().join(",")}`,
      service,
    ]),
  )

  const previewRows: PreviewRow[] = []
  const actorTargets = new Map<string, PreviewActorTarget>()
  const seenActorSlugs = new Set<string>()
  const actorMunicipalitySlugsInBatch = new Set(
    actorRows
      .map((row) =>
        normalizeActorGeo({
          county: normalizeOptional(pickRowValue(row, "county")) ?? null,
          countySlug: normalizeOptional(pickRowValue(row, "county_slug")) ?? null,
          municipality: normalizeOptional(pickRowValue(row, "municipality")) ?? null,
          municipalitySlug: normalizeOptional(pickRowValue(row, "municipality_slug")) ?? null,
          city: normalizeOptional(pickRowValue(row, "city")) ?? null,
          address: normalizeOptional(pickRowValue(row, "address")) ?? null,
          postalCode: normalizeOptional(pickRowValue(row, "postal_code")) ?? null,
        }).municipalitySlug,
      )
      .filter(Boolean),
  )

  for (const [index, row] of actorRows.entries()) {
    const rowNumber = index + 2
    const validationErrors: string[] = []
    const warnings: string[] = []
    const rawData = row as Record<string, unknown>
    const slug = pickRowValue(row, "actor_slug", "slug")

    if (!slug) {
      validationErrors.push("actor_slug er påkrevd.")
    } else if (seenActorSlugs.has(slug)) {
      validationErrors.push("actor_slug er duplisert i actors.csv.")
    } else {
      seenActorSlugs.add(slug)
    }

    let matchedActor: ExistingActor | null = null
    let matchStrategy: PreviewRow["matchStrategy"] = "none"

    if (slug) {
      matchedActor = actorsBySlug.get(slug) ?? null
      if (matchedActor) {
        matchStrategy = "slug"
      }
    }

    if (!matchedActor) {
      const host = normalizeWebsiteMatchValue(pickRowValue(row, "website"))
      if (host) {
        matchedActor = actorsByWebsiteHost.get(host) ?? null
        if (matchedActor) {
          matchStrategy = "website_host"
        }
      }
    }

    const actorPayload = buildActorPayload(row, matchedActor)
    const namePostalKey = buildNamePostalKey(actorPayload.name, actorPayload.postalCode)
    if (!matchedActor && namePostalKey) {
      matchedActor = actorsByNamePostal.get(namePostalKey) ?? null
      if (matchedActor) {
        matchStrategy = "name_postal"
      }
    }

    if (!actorPayload.name) validationErrors.push("name er påkrevd.")
    if (!actorCategorySet.has(actorPayload.category)) validationErrors.push("category er ugyldig.")
    if (!actorPayload.description) validationErrors.push("description er påkrevd.")
    if (!actorPayload.longDescription) validationErrors.push("long_description er påkrevd.")
    if (!actorPayload.address) validationErrors.push("address er påkrevd.")
    if (!actorPayload.county || actorPayload.county === "Ukjent fylke") validationErrors.push("county er påkrevd.")
    if (!actorPayload.municipality || actorPayload.municipality === "Ukjent sted") {
      validationErrors.push("municipality er påkrevd.")
    }
    if (actorPayload.lat === null || actorPayload.lng === null) validationErrors.push("lat og lng er påkrevd.")
    if (actorPayload.countySlug && !getCountyBySlug(actorPayload.countySlug)) {
      validationErrors.push("county_slug er ugyldig.")
    }
    for (const countySlug of actorPayload.serviceAreaCountySlugs) {
      if (!getCountyBySlug(countySlug)) {
        validationErrors.push(`service_area_county_slugs inneholder ugyldig fylke: ${countySlug}`)
      }
    }
    for (const municipalitySlug of actorPayload.serviceAreaMunicipalitySlugs) {
      if (!getMunicipalityBySlug(municipalitySlug) && !actorMunicipalitySlugsInBatch.has(municipalitySlug)) {
        validationErrors.push(
          `service_area_municipality_slugs inneholder ukjent kommune: ${municipalitySlug}`,
        )
      }
    }
    if (!supportsRepairServices(actorPayload.category) && matchedActor) {
      const existingRepairServices = repairServiceCountByActorId.get(matchedActor.id) ?? 0
      if (existingRepairServices > 0) {
        validationErrors.push(
          "Eksisterende reparasjonstjenester ma fjernes for en ikke-reparasjonskategori.",
        )
      }
    }

    const normalizedData: Record<string, unknown> = {
      ...actorPayload,
      lat: actorPayload.lat,
      lng: actorPayload.lng,
    }

    const action: PreviewRow["action"] =
      validationErrors.length > 0
        ? "error"
        : matchedActor
          ? hasActorDifferences(matchedActor, normalizedData)
            ? "update"
            : "skip"
          : "create"

    if (action === "skip") {
      warnings.push("Ingen endringer funnet mot eksisterende aktør.")
    }

    previewRows.push({
      rowType: "actor",
      rowNumber,
      rawData,
      normalizedData,
      matchStrategy,
      matchedActorId: matchedActor?.id ?? null,
      action,
      validationErrors,
      warnings,
    })

    if (slug) {
      actorTargets.set(slug, {
        slug,
        existingActor: matchedActor,
        action,
        normalizedData,
        matchedActorId: matchedActor?.id ?? null,
        category: actorPayload.category,
      })
    }
  }

  const seenSourceKeys = new Set<string>()
  const sourcePreviewIndexesByActorSlug = new Map<string, number[]>()
  for (const [index, row] of sourceRows.entries()) {
    const rowNumber = index + 2
    const validationErrors: string[] = []
    const warnings: string[] = []
    const rawData = row as Record<string, unknown>
    const actorSlug = pickRowValue(row, "actor_slug")
    const type = (pickRowValue(row, "type") || "website") as SourceType
    const title = normalizeOptional(pickRowValue(row, "title"))
    const url = normalizeOptional(pickRowValue(row, "url"))

    if (!actorSlug) validationErrors.push("actor_slug er påkrevd.")
    if (!sourceTypes.has(type)) validationErrors.push("type er ugyldig.")
    if (!title) validationErrors.push("title er påkrevd.")
    if (!url) validationErrors.push("url er påkrevd.")

    const actorTarget = actorSlug ? actorTargets.get(actorSlug) : null
    const matchedActor = actorTarget?.existingActor ?? (actorSlug ? actorsBySlug.get(actorSlug) ?? null : null)
    if (!actorTarget && !matchedActor && actorSlug) {
      validationErrors.push("actor_slug matcher ingen importert eller eksisterende aktør.")
    }
    if (actorTarget?.action === "error") {
      validationErrors.push("Kilde kan ikke importeres fordi aktørraden inneholder feil.")
    }

    const duplicateKey = actorSlug && url ? buildCanonicalSourceKey(actorSlug, url) : null
    if (duplicateKey && seenSourceKeys.has(duplicateKey)) {
      warnings.push("Duplikat kilde i samme batch. Raden blir hoppet over.")
    } else if (duplicateKey) {
      seenSourceKeys.add(duplicateKey)
    }

    const canonicalSource = canonicalizeSourceUrl(url)
    if (!canonicalSource.canonicalUrl) {
      warnings.push("URL kunne ikke normaliseres til en kanonisk kilde.")
    }

    const normalizedData = {
      actorSlug,
      type,
      title,
      url,
      canonicalUrl: canonicalSource.canonicalUrl,
      host: canonicalSource.host,
      capturedAt: normalizeOptional(pickRowValue(row, "captured_at")),
      note: normalizeOptional(pickRowValue(row, "note")),
    }

    const existingKey = matchedActor && url ? buildCanonicalSourceKey(matchedActor.id, url) : null
    const existingSource = existingKey ? sourcesByActorKey.get(existingKey) ?? null : null
    const action: PreviewRow["action"] =
      validationErrors.length > 0
        ? "error"
        : warnings.some((warning) => warning.includes("Duplikat"))
          ? "skip"
          : existingSource
            ? "update"
            : "create"

    previewRows.push({
      rowType: "actor_source",
      rowNumber,
      rawData,
      normalizedData: {
        ...normalizedData,
        existingSourceId: existingSource?.id ?? null,
      },
      matchStrategy: actorTarget || matchedActor ? "slug" : "none",
      matchedActorId: matchedActor?.id ?? null,
      action,
      validationErrors,
      warnings,
    })

    if (actorSlug) {
      const bucket = sourcePreviewIndexesByActorSlug.get(actorSlug) ?? []
      bucket.push(previewRows.length - 1)
      sourcePreviewIndexesByActorSlug.set(actorSlug, bucket)
    }
  }

  for (const [actorSlug, rowIndexes] of sourcePreviewIndexesByActorSlug.entries()) {
    const actorTarget = actorTargets.get(actorSlug) ?? null
    const matchedActor = actorTarget?.existingActor ?? actorsBySlug.get(actorSlug) ?? null
    const previewSources = rowIndexes
      .map((rowIndex) => previewRows[rowIndex])
      .filter((row) => row.action !== "error")
      .map((row) => {
        const normalized = (row.normalizedData ?? {}) as Record<string, unknown>
        return {
          type: normalized.type as SourceType,
          title: normalized.title as string,
          url: normalized.url as string,
          capturedAt: normalized.capturedAt as string | null,
          note: normalized.note as string | null,
        }
      })
    const existingActorSources = matchedActor ? existingSourcesByActorId.get(matchedActor.id) ?? [] : []
    const qualitySummary = getActorQualitySummary({
      verificationStatus: "editorial_verified",
      verifiedAt: new Date(),
      sources: [...existingActorSources, ...previewSources],
    })

    if (qualitySummary.hasWeakSourceSet || qualitySummary.hasLowDiversitySourceSet) {
      for (const rowIndex of rowIndexes) {
        const row = previewRows[rowIndex]
        if (qualitySummary.hasWeakSourceSet) {
          row.warnings.push("Kildesettet er svakt og bor styrkes med flere eller sterkere kilder.")
        }
        if (qualitySummary.hasLowDiversitySourceSet) {
          row.warnings.push("Kildesettet har lav host-diversitet og bor fa flere uavhengige kilder.")
        }
      }
    }
  }

  const seenServiceKeys = new Set<string>()
  for (const [index, row] of repairServiceRows.entries()) {
    const rowNumber = index + 2
    const validationErrors: string[] = []
    const warnings: string[] = []
    const rawData = row as Record<string, unknown>
    const actorSlug = pickRowValue(row, "actor_slug")
    const problemType = pickRowValue(row, "problem_type") as ProblemType
    const serviceItemTypes = splitList(pickRowValue(row, "item_types")) as ItemType[]
    const sortedItemTypes = [...serviceItemTypes].sort()
    const priceMin = parseNumber(pickRowValue(row, "price_min"))
    const priceMax = parseNumber(pickRowValue(row, "price_max"))
    const etaDays = parseNumber(pickRowValue(row, "eta_days"))

    if (!actorSlug) validationErrors.push("actor_slug er påkrevd.")
    if (!problemTypes.has(problemType)) validationErrors.push("problem_type er ugyldig.")
    if (sortedItemTypes.length === 0 || sortedItemTypes.some((item) => !itemTypes.has(item))) {
      validationErrors.push("item_types er påkrevd og må være gyldige.")
    }
    if (priceMin === null || priceMax === null) validationErrors.push("price_min og price_max er påkrevd.")

    const actorTarget = actorSlug ? actorTargets.get(actorSlug) : null
    const matchedActor = actorTarget?.existingActor ?? (actorSlug ? actorsBySlug.get(actorSlug) ?? null : null)
    const category = actorTarget?.category ?? matchedActor?.category

    if (!actorTarget && !matchedActor && actorSlug) {
      validationErrors.push("actor_slug matcher ingen importert eller eksisterende aktør.")
    }
    if (actorTarget?.action === "error") {
      validationErrors.push("Tjenesten kan ikke importeres fordi aktørraden inneholder feil.")
    }
    if (!category || !supportsRepairServices(category)) {
      validationErrors.push("Reparasjonsdata kan bare brukes for reparasjonskategorier.")
    }

    if (
      category &&
      supportsRepairServices(category) &&
      validationErrors.length === 0 &&
      !repairServiceRowMatchesScope(category, problemType, sortedItemTypes)
    ) {
      validationErrors.push(
        `Reparasjonstjenesten matcher ikke aktørkategorien «${formatCategoryLabel(category)}» (problemtype eller varetyper).`,
      )
    }

    const duplicateKey = `${actorSlug}|${problemType}|${sortedItemTypes.join(",")}`
    if (seenServiceKeys.has(duplicateKey)) {
      warnings.push("Duplikat tjeneste i samme batch. Raden blir hoppet over.")
    } else {
      seenServiceKeys.add(duplicateKey)
    }

    const existingKey = matchedActor ? `${matchedActor.id}|${problemType}|${sortedItemTypes.join(",")}` : null
    const existingService = existingKey ? servicesByActorKey.get(existingKey) ?? null : null
    const action: PreviewRow["action"] =
      validationErrors.length > 0
        ? "error"
        : warnings.some((warning) => warning.includes("Duplikat"))
          ? "skip"
          : existingService
            ? "update"
            : "create"

    previewRows.push({
      rowType: "actor_repair_service",
      rowNumber,
      rawData,
      normalizedData: {
        actorSlug,
        problemType,
        itemTypes: sortedItemTypes,
        priceMin,
        priceMax,
        etaDays,
        existingServiceId: existingService?.id ?? null,
      },
      matchStrategy: actorTarget || matchedActor ? "slug" : "none",
      matchedActorId: matchedActor?.id ?? null,
      action,
      validationErrors,
      warnings,
    })
  }

  const counts = previewRows.reduce(
    (acc, row) => {
      acc.totalRows += 1
      if (row.action === "create") acc.createCount += 1
      if (row.action === "update") acc.updateCount += 1
      if (row.action === "skip") acc.skipCount += 1
      if (row.action === "error") acc.errorCount += 1
      if (row.warnings.length > 0) acc.warningCount += 1
      return acc
    },
    {
      totalRows: 0,
      createCount: 0,
      updateCount: 0,
      skipCount: 0,
      errorCount: 0,
      warningCount: 0,
    },
  )

  const targetCounties = Array.from(
    new Set(
      previewRows
        .filter((row) => row.rowType === "actor")
        .map((row) => String(row.normalizedData?.countySlug ?? ""))
        .filter(Boolean),
    ),
  )

  const errorSummary = {
    topErrors: previewRows.flatMap((row) => row.validationErrors).slice(0, 10),
    rowTypeCounts: previewRows.reduce<Record<string, number>>((acc, row) => {
      if (row.validationErrors.length > 0) {
        acc[row.rowType] = (acc[row.rowType] ?? 0) + 1
      }
      return acc
    }, {}),
  }

  const batch = await prisma.actorImportBatch.create({
    data: {
      filename: input.filename,
      status: ActorImportBatchStatus.preview,
      targetCounties,
      totalRows: counts.totalRows,
      createCount: counts.createCount,
      updateCount: counts.updateCount,
      skipCount: counts.skipCount,
      errorCount: counts.errorCount,
      warningCount: counts.warningCount,
      errorSummary: toInputJson(errorSummary),
      createdById: input.createdById ?? null,
      rows: {
        create: previewRows.map((row) => ({
          rowType: row.rowType as ActorImportRowType,
          rowNumber: row.rowNumber,
          rawData: toInputJson(row.rawData),
          normalizedData: row.normalizedData ? toInputJson(row.normalizedData) : undefined,
          matchStrategy: row.matchStrategy as ActorImportMatchStrategy | undefined,
          matchedActorId: row.matchedActorId ?? undefined,
          action: row.action as ActorImportAction,
          validationErrors: row.validationErrors,
          warnings: row.warnings,
        })),
      },
    },
  })

  const details = await getActorImportBatchDetails(batch.id)
  if (!details) {
    throw new Error("Kunne ikke lese forhåndsvisningen etter lagring.")
  }

  return details
}

export const applyActorImportBatch = async (batchId: string, reviewerId?: string | null) => {
  const batch = await prisma.actorImportBatch.findUnique({
    where: { id: batchId },
    include: {
      rows: {
        orderBy: [{ rowType: "asc" }, { rowNumber: "asc" }],
      },
    },
  })

  if (!batch) {
    throw new Error("Import batch ble ikke funnet.")
  }
  if (batch.status === ActorImportBatchStatus.applied) {
    throw new Error("Import batch er allerede brukt.")
  }
  if (batch.errorCount > 0) {
    throw new Error("Import batch inneholder feil og kan ikke brukes.")
  }

  const appliedAt = new Date()
  const actorIdBySlug = new Map<string, string>()
  const actorCategoryBySlug = new Map<string, ActorCategory>()
  const touchedActorIds = new Set<string>()

  const geoRows = batch.rows
    .filter((item) => item.rowType === ActorImportRowType.actor)
    .map((row) => {
      const normalized = (row.normalizedData as Record<string, unknown> | null) ?? {}
      return {
        county: (normalized.county as string | null) ?? null,
        countySlug: (normalized.countySlug as string | null) ?? null,
        municipality: (normalized.municipality as string | null) ?? null,
        municipalitySlug: (normalized.municipalitySlug as string | null) ?? null,
      }
    })

  await seedCanonicalGeoTaxonomy(prisma, geoRows)

  await prisma.$transaction(async (tx) => {

    for (const row of batch.rows.filter((item) => item.rowType === ActorImportRowType.actor)) {
      const normalized = (row.normalizedData as Record<string, unknown> | null) ?? {}
      const slug = String(normalized.slug ?? "")
      if (!slug) continue

      if (row.action === ActorImportAction.skip && row.matchedActorId) {
        actorIdBySlug.set(slug, row.matchedActorId)
        touchedActorIds.add(row.matchedActorId)
        const existingActor = await tx.actor.findUnique({
          where: { id: row.matchedActorId },
          select: { category: true },
        })
        if (existingActor) {
          actorCategoryBySlug.set(slug, existingActor.category)
        }
        continue
      }
      if (row.action === ActorImportAction.error) {
        continue
      }

      const category = normalized.category as ActorCategory
      await assertActorCategorySupportsExistingRepairServices(
        tx,
        row.action === ActorImportAction.update ? row.matchedActorId : null,
        category,
      )
      const prepared = await prepareActorPersistData(
        tx,
        {
          name: String(normalized.name ?? ""),
          slug,
          category,
          description: String(normalized.description ?? ""),
          longDescription: String(normalized.longDescription ?? ""),
          address: String(normalized.address ?? ""),
          postalCode: (normalized.postalCode as string | null) ?? null,
          county: (normalized.county as string | null) ?? null,
          countySlug: (normalized.countySlug as string | null) ?? null,
          municipality: (normalized.municipality as string | null) ?? null,
          municipalitySlug: (normalized.municipalitySlug as string | null) ?? null,
          city: (normalized.city as string | null) ?? null,
          area: (normalized.area as string | null) ?? null,
          lat: Number(normalized.lat ?? 0),
          lng: Number(normalized.lng ?? 0),
          phone: (normalized.phone as string | null) ?? null,
          email: (normalized.email as string | null) ?? null,
          website: (normalized.website as string | null) ?? null,
          instagram: (normalized.instagram as string | null) ?? null,
          openingHours: ((normalized.openingHours as string[]) ?? []).filter(Boolean),
          openingHoursOsm: (normalized.openingHoursOsm as string | null) ?? null,
          tags: ((normalized.tags as string[]) ?? []).filter(Boolean),
          benefits: ((normalized.benefits as string[]) ?? []).filter(Boolean),
          howToUse: ((normalized.howToUse as string[]) ?? []).filter(Boolean),
          image: (normalized.image as string | null) ?? null,
          nationwide: Boolean(normalized.nationwide),
          serviceAreaCountySlugs: ((normalized.serviceAreaCountySlugs as string[]) ?? []).filter(Boolean),
          serviceAreaMunicipalitySlugs: ((normalized.serviceAreaMunicipalitySlugs as string[]) ?? []).filter(Boolean),
        },
        { createMissingMunicipality: true },
      )

      const data = {
        ...prepared.actorData,
        status: "approved" as const,
        verificationStatus: "editorial_verified" as const,
        verifiedAt: appliedAt,
        reviewedById: reviewerId ?? batch.createdById ?? null,
        reviewedAt: appliedAt,
      }

      if (row.action === ActorImportAction.update && row.matchedActorId) {
        const updated = await tx.actor.update({
          where: { id: row.matchedActorId },
          data,
          select: { id: true },
        })
        actorIdBySlug.set(slug, updated.id)
        touchedActorIds.add(updated.id)
        actorCategoryBySlug.set(slug, category)
        await replaceActorServiceAreas(tx, updated.id, prepared.serviceAreaLinks)
        await replaceActorBrowseScopes(tx, updated.id, prepared.browseScopes)
      } else {
        const created = await tx.actor.create({
          data: {
            ...data,
            createdById: reviewerId ?? batch.createdById ?? null,
          },
          select: { id: true },
        })
        actorIdBySlug.set(slug, created.id)
        touchedActorIds.add(created.id)
        actorCategoryBySlug.set(slug, category)
        await replaceActorServiceAreas(tx, created.id, prepared.serviceAreaLinks)
        await replaceActorBrowseScopes(tx, created.id, prepared.browseScopes)
      }
    }

    for (const row of batch.rows.filter((item) => item.rowType === ActorImportRowType.actor_source)) {
      if (row.action === ActorImportAction.error || row.action === ActorImportAction.skip) continue
      const normalized = (row.normalizedData as Record<string, unknown> | null) ?? {}
      const actorSlug = String(normalized.actorSlug ?? "")
      const actorId = actorIdBySlug.get(actorSlug) ?? row.matchedActorId ?? null
      if (!actorId) continue

      const type = normalized.type as SourceType
      const url = String(normalized.url ?? "")
      const canonicalUrl = canonicalizeSourceUrl(url).canonicalUrl
      const existingSourcesForActor = await tx.actorSource.findMany({
        where: { actorId },
        select: { id: true, url: true },
      })
      const existing = existingSourcesForActor.find(
        (source) => canonicalizeSourceUrl(source.url).canonicalUrl === canonicalUrl,
      )

      const sourceData = {
        actorId,
        type,
        title: String(normalized.title ?? ""),
        url,
        capturedAt: normalized.capturedAt ? new Date(String(normalized.capturedAt)) : null,
        note: (normalized.note as string | null) ?? null,
      }

      if (existing) {
        await tx.actorSource.update({
          where: { id: existing.id },
          data: sourceData,
        })
      } else {
        await tx.actorSource.create({ data: sourceData })
      }
    }

    for (const row of batch.rows.filter((item) => item.rowType === ActorImportRowType.actor_repair_service)) {
      if (row.action === ActorImportAction.error || row.action === ActorImportAction.skip) continue
      const normalized = (row.normalizedData as Record<string, unknown> | null) ?? {}
      const actorSlug = String(normalized.actorSlug ?? "")
      const actorId = actorIdBySlug.get(actorSlug) ?? row.matchedActorId ?? null
      if (!actorId) continue
      const actorCategory = actorCategoryBySlug.get(actorSlug)
      if (actorCategory) {
        assertRepairServicesAllowed(actorCategory, 1)
      }
      await assertActorCanAcceptRepairServices(tx, actorId)

      const itemTypesValue = [...((normalized.itemTypes as ItemType[]) ?? [])].sort()
      const problemTypeValue = normalized.problemType as ProblemType
      const existingServices = await tx.actorRepairService.findMany({
        where: {
          actorId,
          problemType: problemTypeValue,
        },
        select: {
          id: true,
          itemTypes: true,
        },
      })
      const existing = existingServices.find(
        (service) => JSON.stringify([...service.itemTypes].sort()) === JSON.stringify(itemTypesValue),
      )

      const serviceData = {
        actorId,
        problemType: problemTypeValue,
        itemTypes: itemTypesValue,
        priceMin: Number(normalized.priceMin ?? 0),
        priceMax: Number(normalized.priceMax ?? 0),
        etaDays: normalized.etaDays === null || normalized.etaDays === undefined ? null : Number(normalized.etaDays),
      }

      if (existing) {
        await tx.actorRepairService.update({
          where: { id: existing.id },
          data: serviceData,
        })
      } else {
        await tx.actorRepairService.create({ data: serviceData })
      }
    }

    await tx.actorImportBatch.update({
      where: { id: batch.id },
      data: {
        status: ActorImportBatchStatus.applied,
        appliedAt,
      },
    })

    await tx.actorImportRow.updateMany({
      where: { batchId: batch.id },
      data: { appliedAt },
    })
  }, { timeout: 20000, maxWait: 10000 })

  const appliedBatch = await prisma.actorImportBatch.findUnique({
    where: { id: batch.id },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  if (!appliedBatch) {
    throw new Error("Kunne ikke lese oppdatert import batch.")
  }

  await refreshAutomationStateForActors(Array.from(touchedActorIds), batch.targetCounties)
  if (batch.targetCounties.length > 0) {
    await refreshAutomationStateForCounties(batch.targetCounties)
  }

  return serializeBatch(appliedBatch)
}

export const getActorImportBatchDetails = async (batchId: string) => {
  const batch = await prisma.actorImportBatch.findUnique({
    where: { id: batchId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  if (!batch) {
    return null
  }

  const rows = await listActorImportRows(batchId)
  return {
    batch: serializeBatch(batch),
    rows,
  }
}
