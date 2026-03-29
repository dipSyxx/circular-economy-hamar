import "server-only"

import { ActorCorrectionStatus, type VerificationStatus } from "@prisma/client"
import { buildActorCorrectionPatch, buildCorrectionDiff, type ActorCorrectionPayload } from "@/lib/actor-corrections"
import { prepareActorPersistData } from "@/lib/actor-write"
import { prisma } from "@/lib/prisma"
import { canonicalizeSourceUrl } from "@/lib/source-quality"
import { refreshAutomationStateForActors } from "@/lib/admin/automation"

type ReviewCorrectionInput = {
  status: "accepted" | "rejected"
  reviewNote?: string | null
  reviewedById?: string | null
}

const serializeSuggestion = (suggestion: {
  id: string
  actorId: string
  submittedById: string
  payload: unknown
  note: string
  sourceUrl: string | null
  status: ActorCorrectionStatus
  reviewNote: string | null
  reviewedById: string | null
  reviewedAt: Date | null
  createdAt: Date
  updatedAt: Date
  actor?: {
    id: string
    name: string
    slug: string
    description: string
    longDescription: string
    address: string
    postalCode: string | null
    county: string | null
    municipality: string | null
    city: string | null
    area: string | null
    lat: number
    lng: number
    phone: string | null
    email: string | null
    website: string | null
    instagram: string | null
    openingHoursOsm: string | null
    nationwide: boolean
    verificationStatus: VerificationStatus
    verifiedAt: Date | null
  } | null
  submittedBy?: {
    id: string
    name: string | null
    email: string | null
  } | null
  reviewedBy?: {
    id: string
    name: string | null
    email: string | null
  } | null
}) => {
  const payload = (suggestion.payload as ActorCorrectionPayload | null) ?? {}

  return {
    id: suggestion.id,
    actorId: suggestion.actorId,
    submittedById: suggestion.submittedById,
    payload,
    note: suggestion.note,
    sourceUrl: suggestion.sourceUrl,
    status: suggestion.status,
    reviewNote: suggestion.reviewNote,
    reviewedById: suggestion.reviewedById,
    reviewedAt: suggestion.reviewedAt?.toISOString() ?? null,
    createdAt: suggestion.createdAt.toISOString(),
    updatedAt: suggestion.updatedAt.toISOString(),
    actor: suggestion.actor
      ? {
          ...suggestion.actor,
          county: suggestion.actor.county ?? "",
          municipality: suggestion.actor.municipality ?? "",
          city: suggestion.actor.city ?? "",
          verifiedAt: suggestion.actor.verifiedAt?.toISOString() ?? null,
        }
      : null,
    submittedBy: suggestion.submittedBy ?? null,
    reviewedBy: suggestion.reviewedBy ?? null,
    diff: suggestion.actor ? buildCorrectionDiff(suggestion.actor, payload) : [],
  }
}

export const listActorCorrectionSuggestions = async (status?: "pending" | "accepted" | "rejected") => {
  const suggestions = await prisma.actorCorrectionSuggestion.findMany({
    where: status ? { status } : undefined,
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          longDescription: true,
          address: true,
          postalCode: true,
          county: true,
          municipality: true,
          city: true,
          area: true,
          lat: true,
          lng: true,
          phone: true,
          email: true,
          website: true,
          instagram: true,
          openingHoursOsm: true,
          nationwide: true,
          verificationStatus: true,
          verifiedAt: true,
        },
      },
      submittedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  })

  return suggestions.map(serializeSuggestion)
}

export const getActorCorrectionSuggestion = async (id: string) => {
  const suggestion = await prisma.actorCorrectionSuggestion.findUnique({
    where: { id },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          longDescription: true,
          address: true,
          postalCode: true,
          county: true,
          municipality: true,
          city: true,
          area: true,
          lat: true,
          lng: true,
          phone: true,
          email: true,
          website: true,
          instagram: true,
          openingHoursOsm: true,
          nationwide: true,
          verificationStatus: true,
          verifiedAt: true,
        },
      },
      submittedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  return suggestion ? serializeSuggestion(suggestion) : null
}

export const reviewActorCorrectionSuggestion = async (id: string, input: ReviewCorrectionInput) => {
  const existing = await prisma.actorCorrectionSuggestion.findUnique({
    where: { id },
    include: {
      actor: true,
    },
  })

  if (!existing) {
    throw new Error("Forslaget ble ikke funnet.")
  }

  if (existing.status !== ActorCorrectionStatus.pending) {
    throw new Error("Forslaget er allerede behandlet.")
  }

  const reviewedAt = new Date()

  await prisma.$transaction(async (tx) => {
    if (input.status === "accepted") {
      const patch = buildActorCorrectionPatch(existing.actor, (existing.payload as ActorCorrectionPayload | null) ?? {})
      const prepared =
        patch.address !== undefined ||
        patch.postalCode !== undefined ||
        patch.county !== undefined ||
        patch.municipality !== undefined ||
        patch.city !== undefined ||
        patch.area !== undefined
          ? await prepareActorPersistData(
              tx,
              {
                name: String(patch.name ?? existing.actor.name),
                slug: existing.actor.slug,
                category: existing.actor.category,
                description: String(patch.description ?? existing.actor.description),
                longDescription: String(patch.longDescription ?? existing.actor.longDescription),
                address: String(patch.address ?? existing.actor.address),
                postalCode: (patch.postalCode as string | null) ?? existing.actor.postalCode,
                county: (patch.county as string | null) ?? existing.actor.county,
                countySlug: existing.actor.countySlug,
                municipality: (patch.municipality as string | null) ?? existing.actor.municipality,
                municipalitySlug: existing.actor.municipalitySlug,
                city: (patch.city as string | null) ?? existing.actor.city,
                area: (patch.area as string | null) ?? existing.actor.area,
                lat: typeof patch.lat === "number" ? patch.lat : existing.actor.lat,
                lng: typeof patch.lng === "number" ? patch.lng : existing.actor.lng,
                phone: (patch.phone as string | null) ?? existing.actor.phone,
                email: (patch.email as string | null) ?? existing.actor.email,
                website: (patch.website as string | null) ?? existing.actor.website,
                instagram: (patch.instagram as string | null) ?? existing.actor.instagram,
                openingHours: existing.actor.openingHours,
                openingHoursOsm:
                  (patch.openingHoursOsm as string | null) ?? existing.actor.openingHoursOsm,
                tags: existing.actor.tags,
                benefits: existing.actor.benefits,
                howToUse: existing.actor.howToUse,
                image: existing.actor.image,
                nationwide:
                  typeof patch.nationwide === "boolean" ? patch.nationwide : existing.actor.nationwide,
              },
            )
          : null
      await tx.actor.update({
        where: { id: existing.actorId },
        data: {
          ...patch,
          ...(prepared?.actorData ?? {}),
          verificationStatus: "editorial_verified",
          verifiedAt: reviewedAt,
          reviewedById: input.reviewedById ?? null,
          reviewedAt,
        },
      })

      if (existing.sourceUrl) {
        const correctionCanonicalUrl = canonicalizeSourceUrl(existing.sourceUrl).canonicalUrl
        const actorSources = await tx.actorSource.findMany({
          where: {
            actorId: existing.actorId,
          },
          select: { id: true, url: true },
        })
        const existingSource = actorSources.find(
          (source) => canonicalizeSourceUrl(source.url).canonicalUrl === correctionCanonicalUrl,
        )

        if (!existingSource) {
          await tx.actorSource.create({
            data: {
              actorId: existing.actorId,
              type: "website",
              title: "Korreksjonskilde",
              url: existing.sourceUrl,
              note: existing.note,
              capturedAt: reviewedAt,
            },
          })
        }
      }
    }

    await tx.actorCorrectionSuggestion.update({
      where: { id: existing.id },
      data: {
        status: input.status,
        reviewNote: input.reviewNote ?? null,
        reviewedById: input.reviewedById ?? null,
        reviewedAt,
      },
    })
  })

  const updated = await getActorCorrectionSuggestion(id)
  if (!updated) {
    throw new Error("Kunne ikke lese oppdatert forslag.")
  }

  await refreshAutomationStateForActors([existing.actorId], [existing.actor.countySlug ?? ""])

  return updated
}
