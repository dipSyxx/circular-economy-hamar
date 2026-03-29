import type { Actor } from "@prisma/client"
import { normalizeActorGeo } from "@/lib/geo"

export const correctionEditableFields = [
  "name",
  "description",
  "longDescription",
  "address",
  "postalCode",
  "county",
  "municipality",
  "city",
  "area",
  "lat",
  "lng",
  "phone",
  "email",
  "website",
  "instagram",
  "openingHoursOsm",
  "nationwide",
] as const

export type CorrectionEditableField = (typeof correctionEditableFields)[number]
export type ActorCorrectionPayload = Partial<Record<CorrectionEditableField, string | number | boolean | null>>

const parseNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const sanitizeActorCorrectionPayload = (payload: Record<string, unknown>) => {
  return correctionEditableFields.reduce<ActorCorrectionPayload>((acc, field) => {
    const value = payload[field]

    if (field === "nationwide") {
      if (typeof value === "boolean") {
        acc[field] = value
      }
      return acc
    }

    if (field === "lat" || field === "lng") {
      const parsed = parseNumber(value)
      if (parsed !== null) {
        acc[field] = parsed
      }
      return acc
    }

    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed) {
        acc[field] = trimmed
      }
    }

    return acc
  }, {})
}

export const hasCorrectionPayloadValues = (payload: ActorCorrectionPayload) => {
  return correctionEditableFields.some((field) => payload[field] !== undefined)
}

export const buildActorCorrectionPatch = (actor: Actor, payload: ActorCorrectionPayload) => {
  const patch: Record<string, unknown> = {}

  for (const field of correctionEditableFields) {
    if (payload[field] !== undefined) {
      patch[field] = payload[field]
    }
  }

  const geoTouched = ["address", "postalCode", "county", "municipality", "city", "area"].some(
    (field) => patch[field] !== undefined,
  )

  if (geoTouched) {
    const geo = normalizeActorGeo({
      address: typeof patch.address === "string" ? patch.address : actor.address,
      postalCode: typeof patch.postalCode === "string" ? patch.postalCode : actor.postalCode,
      county: typeof patch.county === "string" ? patch.county : actor.county,
      municipality: typeof patch.municipality === "string" ? patch.municipality : actor.municipality,
      city: typeof patch.city === "string" ? patch.city : actor.city,
      area: typeof patch.area === "string" ? patch.area : actor.area,
    })

    patch.postalCode = geo.postalCode
    patch.country = geo.country
    patch.county = geo.county
    patch.countySlug = geo.countySlug
    patch.municipality = geo.municipality
    patch.municipalitySlug = geo.municipalitySlug
    patch.city = geo.city
    patch.area = geo.area
  }

  return patch
}

export const buildCorrectionDiff = (actor: Partial<Record<CorrectionEditableField, unknown>>, payload: ActorCorrectionPayload) => {
  return correctionEditableFields.flatMap((field) => {
    if (payload[field] === undefined) return []
    return [
      {
        field,
        currentValue: actor[field],
        proposedValue: payload[field],
      },
    ]
  })
}

