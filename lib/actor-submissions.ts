import { type ActorCategory, type ItemType, type ProblemType, type SourceType } from "@prisma/client"
import { supportsRepairServices } from "@/lib/categories"
import { getCountyByName, getMunicipalityByName, normalizeActorGeo } from "@/lib/geo"

export type SubmissionPayload = {
  actor?: Record<string, unknown>
  repairServices?: Array<Record<string, unknown>>
  sources?: Array<Record<string, unknown>>
}

export type ValidatedActorSubmission = {
  actorData: {
    name: string
    slug: string
    category: ActorCategory
    description: string
    longDescription: string
    address: string
    postalCode: string | null
    country: string
    county: string
    countySlug: string
    municipality: string
    municipalitySlug: string
    city: string
    area: string | null
    lat: number
    lng: number
    phone: string | null
    email: string | null
    website: string | null
    instagram: string | null
    openingHours: string[]
    openingHoursOsm: string | null
    tags: string[]
    benefits: string[]
    howToUse: string[]
    image: string | null
    nationwide: boolean
  }
  repairServices: Array<{
    problemType: ProblemType
    itemTypes: ItemType[]
    priceMin: number
    priceMax: number
    etaDays: number | null
  }>
  sources: Array<{
    type: SourceType
    title: string
    url: string
    capturedAt: Date | null
    note: string | null
  }>
}

const ensureString = (value: unknown) => (typeof value === "string" ? value.trim() : "")

const ensureStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value.map((entry) => String(entry).trim()).filter(Boolean)
}

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseDate = (value: unknown) => {
  if (typeof value !== "string" || !value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const toBoolean = (value: unknown) => {
  if (typeof value === "boolean") return value
  if (typeof value === "string") return value === "true"
  return false
}

export const validateActorSubmission = (payload: SubmissionPayload) => {
  if (!payload.actor || typeof payload.actor !== "object") {
    return { ok: false as const, error: "Aktor-data mangler." }
  }

  const actor = payload.actor
  const name = ensureString(actor.name)
  const slug = ensureString(actor.slug)
  const category = ensureString(actor.category) as ActorCategory
  const description = ensureString(actor.description)
  const longDescription = ensureString(actor.longDescription)
  const address = ensureString(actor.address)
  const county = ensureString(actor.county)
  const municipality = ensureString(actor.municipality)
  const city = ensureString(actor.city) || municipality
  const openingHours = ensureStringArray(actor.openingHours)
  const tags = ensureStringArray(actor.tags)
  const benefits = ensureStringArray(actor.benefits)
  const howToUse = ensureStringArray(actor.howToUse)
  const lat = toNumber(actor.lat)
  const lng = toNumber(actor.lng)
  const nationwide = toBoolean(actor.nationwide)

  if (!name || !slug || !description || !longDescription || !address || !category) {
    return { ok: false as const, error: "Obligatoriske felt for aktoren mangler." }
  }

  if (!county || !municipality || !city) {
    return { ok: false as const, error: "Velg fylke, kommune og by/sted." }
  }

  const countySlug = getCountyByName(county)?.slug ?? ""
  if (!countySlug || !getMunicipalityByName(municipality, countySlug)) {
    return { ok: false as const, error: "Kommune ma tilhore valgt fylke." }
  }

  if (!openingHours.length || !tags.length || !benefits.length || !howToUse.length) {
    return { ok: false as const, error: "Lister for aktoren kan ikke vare tomme." }
  }

  if (lat === null || lng === null) {
    return { ok: false as const, error: "Ugyldige koordinater." }
  }

  const repairServicesInput = Array.isArray(payload.repairServices) ? payload.repairServices : []
  const repairServices = repairServicesInput
    .filter((service) => Object.values(service).some((value) => value !== null && value !== ""))
    .map((service, index) => {
      const problemType = ensureString(service.problemType) as ProblemType
      const itemTypes = ensureStringArray(service.itemTypes) as ItemType[]
      const priceMin = toNumber(service.priceMin)
      const priceMax = toNumber(service.priceMax)

      if (!problemType) {
        throw new Error(`Tjeneste #${index + 1} mangler problemtype.`)
      }
      if (!itemTypes.length) {
        throw new Error(`Tjeneste #${index + 1} ma ha minst en varetype.`)
      }
      if (priceMin === null || priceMax === null) {
        throw new Error(`Tjeneste #${index + 1} ma ha prisomrade.`)
      }
      if (priceMin > priceMax) {
        throw new Error(`Tjeneste #${index + 1} har ugyldig prisomrade.`)
      }

      return {
        problemType,
        itemTypes,
        priceMin,
        priceMax,
        etaDays: toNumber(service.etaDays),
      }
    })

  if (!supportsRepairServices(category) && repairServices.length > 0) {
    return { ok: false as const, error: "Denne kategorien kan ikke ha reparasjonstjenester." }
  }

  if (supportsRepairServices(category) && repairServices.length === 0) {
    return { ok: false as const, error: "Legg til minst en reparasjonstjeneste." }
  }

  const sourcesInput = Array.isArray(payload.sources) ? payload.sources : []
  if (!sourcesInput.length) {
    return { ok: false as const, error: "Legg til minst en kilde." }
  }

  const sources = sourcesInput.map((source, index) => {
    const type = ensureString(source.type) as SourceType
    const title = ensureString(source.title)
    const url = ensureString(source.url)

    if (!type) {
      throw new Error(`Kilde #${index + 1} mangler type.`)
    }
    if (!title) {
      throw new Error(`Kilde #${index + 1} mangler tittel.`)
    }
    if (!url) {
      throw new Error(`Kilde #${index + 1} mangler URL.`)
    }

    return {
      type,
      title,
      url,
      capturedAt: parseDate(source.capturedAt),
      note: ensureString(source.note) || null,
    }
  })

  const geo = normalizeActorGeo({
    address,
    postalCode: ensureString(actor.postalCode) || null,
    county,
    municipality,
    city,
    area: ensureString(actor.area) || null,
  })

  return {
    ok: true as const,
    value: {
      actorData: {
        name,
        slug,
        category,
        description,
        longDescription,
        address,
        postalCode: geo.postalCode,
        country: geo.country,
        county: geo.county,
        countySlug: geo.countySlug,
        municipality: geo.municipality,
        municipalitySlug: geo.municipalitySlug,
        city: geo.city,
        area: geo.area,
        lat,
        lng,
        phone: ensureString(actor.phone) || null,
        email: ensureString(actor.email) || null,
        website: ensureString(actor.website) || null,
        instagram: ensureString(actor.instagram) || null,
        openingHours,
        openingHoursOsm: ensureString(actor.openingHoursOsm) || null,
        tags,
        benefits,
        howToUse,
        image: ensureString(actor.image) || null,
        nationwide,
      },
      repairServices,
      sources,
    } satisfies ValidatedActorSubmission,
  }
}
