import { NextResponse } from "next/server"
import { ActorCategory, ItemType, ProblemType, SourceType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

const parseDate = (value: unknown) => {
  if (typeof value !== "string" || !value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
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

const isNonEmptyString = (value: unknown) => typeof value === "string" && value.trim().length > 0

const actorFields = [
  "name",
  "slug",
  "category",
  "description",
  "longDescription",
  "address",
  "lat",
  "lng",
  "phone",
  "email",
  "website",
  "instagram",
  "openingHours",
  "openingHoursOsm",
  "tags",
  "benefits",
  "howToUse",
  "image",
]

export async function POST(request: Request) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const payload = (await request.json()) as {
    actor?: Record<string, unknown>
    repairServices?: Array<Record<string, unknown>>
    sources?: Array<Record<string, unknown>>
  }

  if (!payload.actor || typeof payload.actor !== "object") {
    return jsonError("Aktørdata mangler.", 400)
  }

  const actorData: Record<string, unknown> = {}
  for (const field of actorFields) {
    actorData[field] = payload.actor[field]
  }

  const name = ensureString(actorData.name)
  const slug = ensureString(actorData.slug)
  const description = ensureString(actorData.description)
  const longDescription = ensureString(actorData.longDescription)
  const address = ensureString(actorData.address)
  const categoryValue = ensureString(actorData.category)
  const openingHours = ensureStringArray(actorData.openingHours)
  const tags = ensureStringArray(actorData.tags)
  const benefits = ensureStringArray(actorData.benefits)
  const howToUse = ensureStringArray(actorData.howToUse)
  const lat = toNumber(actorData.lat)
  const lng = toNumber(actorData.lng)

  if (!name || !slug || !description || !longDescription || !address || !categoryValue) {
    return jsonError("Obligatoriske felt for aktør mangler.", 400)
  }
  if (!openingHours.length || !tags.length || !benefits.length || !howToUse.length) {
    return jsonError("Lister for aktør kan ikke være tomme.", 400)
  }
  if (lat === null || lng === null) {
    return jsonError("Ugyldige koordinater.", 400)
  }

  const existing = await prisma.actor.findUnique({ where: { slug } })
  if (existing) return jsonError("Denne sluggen er allerede i bruk.", 409)

  const repairServices = Array.isArray(payload.repairServices) ? payload.repairServices : []
  const sources = Array.isArray(payload.sources) ? payload.sources : []
  if (!repairServices.length) return jsonError("Legg til minst én reparasjonstjeneste.", 400)
  if (!sources.length) return jsonError("Legg til minst én kilde.", 400)

  for (const [index, service] of repairServices.entries()) {
    if (!isNonEmptyString(service.problemType)) {
      return jsonError(`Reparasjon #${index + 1} mangler problemtype.`, 400)
    }
    const itemTypes = ensureStringArray(service.itemTypes)
    if (!itemTypes.length) {
      return jsonError(`Reparasjon #${index + 1} må ha minst én varetype.`, 400)
    }
    const priceMin = toNumber(service.priceMin)
    const priceMax = toNumber(service.priceMax)
    if (priceMin === null || priceMax === null) {
      return jsonError(`Reparasjon #${index + 1} må ha prisområde.`, 400)
    }
    if (priceMin > priceMax) {
      return jsonError(`Reparasjon #${index + 1} har ugyldig prisområde.`, 400)
    }
  }

  for (const [index, source] of sources.entries()) {
    if (!isNonEmptyString(source.type)) {
      return jsonError(`Kilde #${index + 1} mangler type.`, 400)
    }
    if (!isNonEmptyString(source.title)) {
      return jsonError(`Kilde #${index + 1} mangler tittel.`, 400)
    }
    if (!isNonEmptyString(source.url)) {
      return jsonError(`Kilde #${index + 1} mangler URL.`, 400)
    }
  }

  try {
    const createdActor = await prisma.$transaction(async (tx) => {
      const actor = await tx.actor.create({
        data: {
          name,
          slug,
          category: categoryValue as ActorCategory,
          description,
          longDescription,
          address,
          lat: lat ?? 0,
          lng: lng ?? 0,
          phone: ensureString(actorData.phone) || null,
          email: ensureString(actorData.email) || null,
          website: ensureString(actorData.website) || null,
          instagram: ensureString(actorData.instagram) || null,
          openingHours,
          openingHoursOsm: ensureString(actorData.openingHoursOsm) || null,
          tags,
          benefits,
          howToUse,
          image: ensureString(actorData.image) || null,
          status: "pending",
          createdById: user.id,
          reviewedById: null,
          reviewedAt: null,
        },
      })

      await tx.actorRepairService.createMany({
        data: repairServices.map((service) => ({
          actorId: actor.id,
          problemType: ensureString(service.problemType) as ProblemType,
          itemTypes: ensureStringArray(service.itemTypes) as ItemType[],
          priceMin: toNumber(service.priceMin) ?? 0,
          priceMax: toNumber(service.priceMax) ?? 0,
          etaDays: toNumber(service.etaDays),
        })),
      })

      await tx.actorSource.createMany({
        data: sources.map((source) => ({
          actorId: actor.id,
          type: ensureString(source.type) as SourceType,
          title: ensureString(source.title),
          url: ensureString(source.url),
          capturedAt: parseDate(source.capturedAt),
          note: ensureString(source.note) || null,
        })),
      })

      return actor
    })

    return NextResponse.json({ actor: createdActor }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint failed")) {
      return jsonError("Denne sluggen er allerede i bruk.", 409)
    }
    return jsonError("Kunne ikke sende inn aktør.", 500)
  }
}
