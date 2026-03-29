import { Prisma, type Actor, type ActorSource } from "@prisma/client"
import { getActorTrustState } from "@/lib/actor-trust"
import type { AdminActorReviewItem } from "@/lib/data"
import { isPilotCounty } from "@/lib/pilot-counties"
import { getActorQualitySummary } from "@/lib/source-quality"

type ReviewActorInput = Pick<
  Actor,
  | "id"
  | "name"
  | "slug"
  | "category"
  | "status"
  | "county"
  | "countySlug"
  | "municipality"
  | "municipalitySlug"
  | "city"
  | "verificationStatus"
  | "verifiedAt"
> & {
  sources: Pick<ActorSource, "type" | "title" | "url" | "capturedAt" | "note">[]
}

export const adminActorReviewSelect = Prisma.validator<Prisma.ActorSelect>()({
  id: true,
  name: true,
  slug: true,
  category: true,
  status: true,
  county: true,
  countySlug: true,
  municipality: true,
  municipalitySlug: true,
  city: true,
  verificationStatus: true,
  verifiedAt: true,
  sources: {
    select: {
      type: true,
      title: true,
      url: true,
      capturedAt: true,
      note: true,
    },
  },
})

export const buildAdminActorReviewItem = (actor: ReviewActorInput): AdminActorReviewItem => {
  const qualitySummary = getActorQualitySummary({
    verificationStatus: actor.verificationStatus,
    verifiedAt: actor.verifiedAt,
    sources: actor.sources,
  })
  const trust = getActorTrustState({
    verificationStatus: actor.verificationStatus,
    verifiedAt: actor.verifiedAt,
    sourceCount: qualitySummary.uniqueSourceCount,
    qualitySummary,
  })

  return {
    id: actor.id,
    name: actor.name,
    slug: actor.slug,
    category: actor.category,
    status: actor.status,
    county: actor.county ?? "",
    countySlug: actor.countySlug ?? "",
    municipality: actor.municipality ?? "",
    municipalitySlug: actor.municipalitySlug ?? "",
    city: actor.city ?? "",
    verificationStatus: actor.verificationStatus,
    verifiedAt: actor.verifiedAt?.toISOString() ?? null,
    freshnessStatus: trust.freshnessStatus,
    isTrusted: trust.isTrusted,
    sourceCount: qualitySummary.uniqueSourceCount,
    dueState: qualitySummary.dueState,
    qualitySummary,
    isPilotCounty: isPilotCounty(actor.countySlug ?? undefined),
  }
}
