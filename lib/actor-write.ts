import { Prisma, type ActorCategory, type ItemType, type ProblemType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { validateRepairServiceAgainstScope } from "@/lib/category-repair-scope"
import { categoryRules, supportsRepairServices } from "@/lib/categories"
import { type ActorGeoInput } from "@/lib/geo"
import {
  resolveCanonicalActorGeo,
  resolveCountyRecordsBySlugs,
  resolveMunicipalityRecordsBySlugs,
} from "@/lib/geo-taxonomy"

type GeoDbClient = Prisma.TransactionClient | typeof prisma

export type ActorServiceAreaLink = {
  countyId: string | null
  municipalityId: string | null
}

export type ActorRepairServiceInput = {
  problemType: ProblemType
  itemTypes: ItemType[]
  priceMin: number
  priceMax: number
  etaDays?: number | null
}

export type ActorPersistInput = ActorGeoInput & {
  name: string
  slug: string
  category: ActorCategory
  description: string
  longDescription: string
  lat: number
  lng: number
  phone?: string | null
  email?: string | null
  website?: string | null
  instagram?: string | null
  openingHours: string[]
  openingHoursOsm?: string | null
  tags: string[]
  benefits: string[]
  howToUse: string[]
  image?: string | null
  nationwide?: boolean
  serviceAreaCountySlugs?: string[]
  serviceAreaMunicipalitySlugs?: string[]
}

type PrepareActorPersistOptions = {
  createMissingMunicipality?: boolean
}

const uniqueStrings = (values?: Array<string | null | undefined>) =>
  Array.from(new Set((values ?? []).map((value) => value?.trim()).filter(Boolean) as string[]))

const toFiniteNumber = (v: unknown): number => {
  const n = Number(v)
  if (!Number.isFinite(n)) throw new Error("Nedre koordinat er ugyldig.")
  return n
}

const toNullableString = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

const toStringArray = (value?: string[]) => (Array.isArray(value) ? value.filter(Boolean) : [])

export const assertRepairServicesAllowed = (
  category: ActorCategory,
  repairServices: Array<ActorRepairServiceInput> | number,
) => {
  const hasRepairServices = typeof repairServices === "number" ? repairServices > 0 : repairServices.length > 0
  if (!categoryRules[category]) {
    throw new Error("Ugyldig kategori.")
  }
  if (!supportsRepairServices(category) && hasRepairServices) {
    throw new Error("Ikke-reparasjonskategorier kan ikke ha reparasjonstjenester.")
  }
}

export const assertActorCategorySupportsExistingRepairServices = async (
  db: GeoDbClient,
  actorId: string | null | undefined,
  category: ActorCategory,
  incomingRepairServicesCount = 0,
) => {
  if (supportsRepairServices(category)) return

  const existingRepairServiceCount = actorId
    ? await db.actorRepairService.count({
        where: { actorId },
      })
    : 0

  assertRepairServicesAllowed(category, existingRepairServiceCount + incomingRepairServicesCount)
}

export const assertActorCanAcceptRepairServices = async (db: GeoDbClient, actorId: string) => {
  const actor = await db.actor.findUnique({
    where: { id: actorId },
    select: {
      id: true,
      category: true,
    },
  })

  if (!actor) {
    throw new Error("Aktør ble ikke funnet.")
  }

  assertRepairServicesAllowed(actor.category, 1)
  return actor
}

/** Ensures every stored repair service fits the actor category (e.g. after category change). */
export const assertActorRepairServicesMatchCategory = async (
  db: GeoDbClient,
  actorId: string,
  category: ActorCategory,
) => {
  if (!supportsRepairServices(category)) return

  const services = await db.actorRepairService.findMany({
    where: { actorId },
    select: { problemType: true, itemTypes: true },
  })

  for (const service of services) {
    const err = validateRepairServiceAgainstScope(category, service.problemType, service.itemTypes)
    if (err) {
      throw new Error(`${err} Fjern eller oppdater reparasjonstjenestene før du lagrer denne kategorien.`)
    }
  }
}

export const prepareActorPersistData = async (
  db: GeoDbClient,
  input: ActorPersistInput,
  options: PrepareActorPersistOptions = {},
) => {
  const { normalizedGeo, countyRecord, municipalityRecord } = await resolveCanonicalActorGeo(db, input, {
    createMissingMunicipality: options.createMissingMunicipality,
  })

  const serviceAreaCountyRecords = await resolveCountyRecordsBySlugs(
    db,
    uniqueStrings(input.serviceAreaCountySlugs),
  )
  const serviceAreaMunicipalityRecords = await resolveMunicipalityRecordsBySlugs(
    db,
    uniqueStrings(input.serviceAreaMunicipalitySlugs),
    {
      createMissingMunicipality: options.createMissingMunicipality,
    },
  )

  const serviceAreaLinks = [
    ...serviceAreaCountyRecords
      .filter((county) => county.id !== countyRecord.id)
      .map((county) => ({ countyId: county.id, municipalityId: null })),
    ...serviceAreaMunicipalityRecords
      .filter((municipality) => municipality.id !== municipalityRecord.id)
      .map((municipality) => ({ countyId: null, municipalityId: municipality.id })),
  ]

  return {
    actorData: {
      name: input.name.trim(),
      slug: input.slug.trim(),
      category: input.category,
      description: input.description.trim(),
      longDescription: input.longDescription.trim(),
      address: input.address?.trim() ?? "",
      postalCode: normalizedGeo.postalCode,
      country: normalizedGeo.country,
      county: normalizedGeo.county,
      countySlug: normalizedGeo.countySlug,
      municipality: normalizedGeo.municipality,
      municipalitySlug: normalizedGeo.municipalitySlug,
      city: normalizedGeo.city,
      area: normalizedGeo.area,
      lat: toFiniteNumber(input.lat),
      lng: toFiniteNumber(input.lng),
      phone: toNullableString(input.phone),
      email: toNullableString(input.email),
      website: toNullableString(input.website),
      instagram: toNullableString(input.instagram),
      openingHours: toStringArray(input.openingHours),
      openingHoursOsm: toNullableString(input.openingHoursOsm),
      tags: toStringArray(input.tags),
      benefits: toStringArray(input.benefits),
      howToUse: toStringArray(input.howToUse),
      image: toNullableString(input.image),
      nationwide: Boolean(input.nationwide),
      baseCountyId: countyRecord.id,
      baseMunicipalityId: municipalityRecord.id,
    },
    serviceAreaLinks,
    serviceAreaCountySlugs: serviceAreaCountyRecords.map((county) => county.slug),
    serviceAreaMunicipalitySlugs: serviceAreaMunicipalityRecords.map((municipality) => municipality.slug),
  }
}

export const replaceActorServiceAreas = async (
  db: GeoDbClient,
  actorId: string,
  serviceAreaLinks: ActorServiceAreaLink[],
) => {
  await db.actorServiceArea.deleteMany({
    where: { actorId },
  })

  if (!serviceAreaLinks.length) {
    return
  }

  await db.actorServiceArea.createMany({
    data: serviceAreaLinks.map((entry) => ({
      actorId,
      countyId: entry.countyId,
      municipalityId: entry.municipalityId,
    })),
  })
}
