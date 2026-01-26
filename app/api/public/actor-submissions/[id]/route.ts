import { NextResponse } from "next/server"
import { ActorCategory, ItemType, ProblemType, SourceType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"
import { safeDeleteBlob } from "@/lib/blob"

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

type SubmissionPayload = {
  actor?: Record<string, unknown>
  repairServices?: Array<Record<string, unknown>>
  sources?: Array<Record<string, unknown>>
}

type ValidationResult =
  | {
      ok: false
      error: string
    }
  | {
      ok: true
      actorData: Record<string, unknown>
      name: string
      slug: string
      description: string
      longDescription: string
      address: string
      categoryValue: string
      openingHours: string[]
      tags: string[]
      benefits: string[]
      howToUse: string[]
      lat: number
      lng: number
      repairServices: Array<Record<string, unknown>>
      sources: Array<Record<string, unknown>>
    }

const validatePayload = (payload: SubmissionPayload): ValidationResult => {
  if (!payload.actor || typeof payload.actor !== "object") {
    return { ok: false, error: "Aktørdata mangler." }
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
    return { ok: false, error: "Obligatoriske felt for aktør mangler." }
  }
  if (!openingHours.length || !tags.length || !benefits.length || !howToUse.length) {
    return { ok: false, error: "Lister for aktør kan ikke være tomme." }
  }
  if (lat === null || lng === null) {
    return { ok: false, error: "Ugyldige koordinater." }
  }

  const repairServices = Array.isArray(payload.repairServices) ? payload.repairServices : []
  const sources = Array.isArray(payload.sources) ? payload.sources : []
  if (!repairServices.length) return { ok: false, error: "Legg til minst én reparasjonstjeneste." }
  if (!sources.length) return { ok: false, error: "Legg til minst én kilde." }

  for (const [index, service] of repairServices.entries()) {
    if (!isNonEmptyString(service.problemType)) {
      return { ok: false, error: `Reparasjon #${index + 1} mangler problemtype.` }
    }
    const itemTypes = ensureStringArray(service.itemTypes)
    if (!itemTypes.length) {
      return { ok: false, error: `Reparasjon #${index + 1} må ha minst én varetype.` }
    }
    const priceMin = toNumber(service.priceMin)
    const priceMax = toNumber(service.priceMax)
    if (priceMin === null || priceMax === null) {
      return { ok: false, error: `Reparasjon #${index + 1} må ha prisområde.` }
    }
    if (priceMin > priceMax) {
      return { ok: false, error: `Reparasjon #${index + 1} har ugyldig prisområde.` }
    }
  }

  for (const [index, source] of sources.entries()) {
    if (!isNonEmptyString(source.type)) {
      return { ok: false, error: `Kilde #${index + 1} mangler type.` }
    }
    if (!isNonEmptyString(source.title)) {
      return { ok: false, error: `Kilde #${index + 1} mangler tittel.` }
    }
    if (!isNonEmptyString(source.url)) {
      return { ok: false, error: `Kilde #${index + 1} mangler URL.` }
    }
  }

  return {
    ok: true,
    actorData,
    name,
    slug,
    description,
    longDescription,
    address,
    categoryValue,
    openingHours,
    tags,
    benefits,
    howToUse,
    lat,
    lng,
    repairServices,
    sources,
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const { id } = await Promise.resolve(params)
  const existing = await prisma.actor.findUnique({ where: { id } })
  if (!existing) return jsonError("Aktør ikke funnet.", 404)
  if (existing.createdById !== user.id) return jsonError("Forbidden", 403)

  const payload = (await request.json()) as SubmissionPayload
  const validated = validatePayload(payload)
  if (!validated.ok) {
    return jsonError(validated.error, 400)
  }

  const {
    actorData,
    name,
    slug,
    description,
    longDescription,
    address,
    categoryValue,
    openingHours,
    tags,
    benefits,
    howToUse,
    lat,
    lng,
    repairServices,
    sources,
  } = validated

  const slugOwner = await prisma.actor.findFirst({
    where: { slug, NOT: { id } },
    select: { id: true },
  })
  if (slugOwner) return jsonError("Denne sluggen er allerede i bruk.", 409)

  try {
    const updatedActor = await prisma.$transaction(async (tx) => {
      const actor = await tx.actor.update({
        where: { id },
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
          reviewNote: null,
          reviewedById: null,
          reviewedAt: null,
        },
      })

      await tx.actorRepairService.deleteMany({ where: { actorId: actor.id } })
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

      await tx.actorSource.deleteMany({ where: { actorId: actor.id } })
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

    return NextResponse.json({ actor: updatedActor })
  } catch (err) {
    if (err instanceof Error && err.message.includes("Unique constraint failed")) {
      return jsonError("Denne sluggen er allerede i bruk.", 409)
    }
    return jsonError("Kunne ikke oppdatere aktør.", 500)
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const { id } = await Promise.resolve(params)
  const existing = await prisma.actor.findUnique({ where: { id } })
  if (!existing) return jsonError("Aktør ikke funnet.", 404)
  if (existing.createdById !== user.id) return jsonError("Forbidden", 403)

  await prisma.actor.delete({ where: { id } })
  await safeDeleteBlob(existing.image)
  return NextResponse.json({ ok: true })
}
