import "server-only"

import type { Actor, ActorCategory, RepairService } from "@/lib/data"
import {
  evaluateDecision,
  type DecisionInput,
  type DecisionOutput,
  type ItemType,
  type ProblemType,
  type Recommendation,
} from "@/lib/decision-engine"
import type {
  CoverageReason,
  DecisionGeoContext,
  DecisionMatchFallbackReason,
  DecisionMatchedActor,
  TransportMode,
} from "@/lib/decision-match-types"
import { formatCategoryLabel, formatItemTypeLabel, formatProblemTypeLabel } from "@/lib/enum-labels"
import { getCountyBySlug, getMunicipalityBySlug } from "@/lib/geo"
import { getActorGeographyMatchPriority } from "@/lib/actor-scope"
import { getOpeningStatus } from "@/lib/opening-hours"
import { estimateActorTravel } from "@/lib/travel-estimates"

const MAX_MATCHED_ACTORS = 6

const repairCategories = new Set<ActorCategory>([
  "reparasjon",
  "reparasjon_sko_klar",
  "mobelreparasjon",
  "sykkelverksted",
  "ombruksverksted",
])
const buyUsedCategories = new Set<ActorCategory>(["brukt", "utleie"])
const donateCategories = new Set<ActorCategory>(["mottak_ombruk", "ombruksverksted", "brukt"])
const recycleCategories = new Set<ActorCategory>(["gjenvinning"])

const donateTagHints = ["ombruk", "gjenbruk", "donasjon", "doner", "innlevering", "brukt", "second hand", "secondhand"]
const buyUsedTagHints = ["ombruk", "gjenbruk", "brukt", "second hand", "secondhand", "utleie", "utlan"]
const recycleTagHints = ["gjenvinning", "e-avfall", "avfall", "resirk", "sortering"]

const categoryWeightsByRecommendation: Record<Recommendation, Record<ActorCategory, number>> = {
  repair: {
    reparasjon: 1.6,
    reparasjon_sko_klar: 1.4,
    mobelreparasjon: 1.2,
    sykkelverksted: 1.2,
    ombruksverksted: 1.0,
    brukt: 0,
    gjenvinning: 0,
    utleie: 0,
    mottak_ombruk: 0,
    baerekraftig_mat: 0,
  },
  buy_used: {
    brukt: 1.4,
    utleie: 0.8,
    ombruksverksted: 0.5,
    reparasjon: 0,
    gjenvinning: 0,
    reparasjon_sko_klar: 0,
    mottak_ombruk: 0,
    mobelreparasjon: 0,
    sykkelverksted: 0,
    baerekraftig_mat: 0,
  },
  donate: {
    mottak_ombruk: 1.8,
    ombruksverksted: 1.2,
    brukt: 0.6,
    reparasjon: 0,
    gjenvinning: 0,
    utleie: 0,
    reparasjon_sko_klar: 0,
    mobelreparasjon: 0,
    sykkelverksted: 0,
    baerekraftig_mat: 0,
  },
  recycle: {
    gjenvinning: 1.8,
    brukt: 0,
    reparasjon: 0,
    utleie: 0,
    reparasjon_sko_klar: 0,
    mottak_ombruk: 0,
    mobelreparasjon: 0,
    sykkelverksted: 0,
    ombruksverksted: 0,
    baerekraftig_mat: 0,
  },
}

type CandidateActor = {
  actor: Actor
  geoPriority: number
  coverageReason: CoverageReason
  serviceMatch: RepairService | null
  serviceMatchQuality: number
  recommendationFit: number
}

const normalizeText = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

const hasTagMatch = (tags: string[], hints: string[]) => {
  if (!tags.length) return false
  const normalizedTags = tags.map((tag) => normalizeText(tag.trim())).filter(Boolean)
  return normalizedTags.some((tag) => hints.some((hint) => tag.includes(hint)))
}

const getDistanceScore = (distanceKm: number | null) => {
  if (distanceKm === null) return 0
  const normalized = distanceKm / 8
  return 1 / (1 + normalized)
}

const getTravelScore = (travelMinutes: number | null) => {
  if (travelMinutes === null) return 0
  const normalized = travelMinutes / 25
  return 1 / (1 + normalized)
}

const getServiceMatchQuality = (
  service: RepairService,
  problemType: ProblemType,
  itemType: ItemType,
  caseKey?: DecisionInput["caseKey"],
) => {
  const items = service.itemTypes ?? []
  const itemQuality = !items.length ? 0.7 : items.includes(itemType) ? 1 : 0.3

  if (caseKey === "screen_protector") {
    if (service.problemType !== "screen") return 0
    return itemQuality * 0.35
  }

  if (service.problemType !== problemType) return 0
  return itemQuality
}

const serializeDate = (value?: Date) => value?.toISOString()

const getCoverageReason = (
  actor: Actor,
  countySlug?: string | null,
  municipalitySlug?: string | null,
): CoverageReason | null => {
  if (countySlug && municipalitySlug) {
    if (actor.countySlug === countySlug && actor.municipalitySlug === municipalitySlug) {
      return "base_location"
    }
    if (actor.serviceAreaMunicipalitySlugs?.includes(municipalitySlug)) {
      return "service_area_municipality"
    }
    if (actor.serviceAreaCountySlugs?.includes(countySlug)) {
      return "service_area_county"
    }
    if (actor.nationwide) return "nationwide_fallback"
    return null
  }

  if (countySlug) {
    if (actor.countySlug === countySlug) {
      return "base_location"
    }
    if (
      actor.serviceAreaMunicipalitySlugs?.some(
        (actorMunicipalitySlug) => getMunicipalityBySlug(actorMunicipalitySlug)?.countySlug === countySlug,
      )
    ) {
      return "service_area_municipality"
    }
    if (actor.serviceAreaCountySlugs?.includes(countySlug)) {
      return "service_area_county"
    }
    if (actor.nationwide) return "nationwide_fallback"
    return null
  }

  if (actor.municipalitySlug || actor.countySlug) return "base_location"
  if ((actor.serviceAreaMunicipalitySlugs?.length ?? 0) > 0) return "service_area_municipality"
  if ((actor.serviceAreaCountySlugs?.length ?? 0) > 0) return "service_area_county"
  return "nationwide_fallback"
}

const resolveGeoContext = (context: DecisionGeoContext) => {
  const countySlug = context.countySlug ? getCountyBySlug(context.countySlug)?.slug ?? null : null
  const municipalitySlug =
    countySlug && context.municipalitySlug
      ? getMunicipalityBySlug(context.municipalitySlug, countySlug)?.slug ?? null
      : null

  return {
    countySlug,
    municipalitySlug,
    transportMode: (context.transportMode ?? "driving") as TransportMode,
    maxTravelMinutes:
      typeof context.maxTravelMinutes === "number" && Number.isFinite(context.maxTravelMinutes)
        ? Math.max(1, Math.round(context.maxTravelMinutes))
        : null,
    origin:
      typeof context.userLat === "number" &&
      typeof context.userLng === "number" &&
      Number.isFinite(context.userLat) &&
      Number.isFinite(context.userLng)
        ? { lat: context.userLat, lng: context.userLng }
        : null,
  }
}

const getScopedActors = (actors: Actor[], countySlug?: string | null, municipalitySlug?: string | null) => {
  if (!countySlug) return actors
  return actors.filter((actor) => getActorGeographyMatchPriority(actor, countySlug, municipalitySlug) !== null)
}

const getRecommendationCandidates = (
  input: DecisionInput,
  decision: DecisionOutput,
  actors: Actor[],
  countySlug?: string | null,
  municipalitySlug?: string | null,
) => {
  const scopedActors = getScopedActors(actors, countySlug, municipalitySlug)

  let baseCandidates: CandidateActor[] = []

  if (decision.recommendation === "repair") {
    const shouldExposeServiceMatch = input.caseKey !== "screen_protector"
    baseCandidates = scopedActors
      .filter((actor) => repairCategories.has(actor.category))
      .map((actor) => {
        let bestServiceMatch: RepairService | null = null
        let bestServiceQuality = 0
        for (const service of actor.repairServices ?? []) {
          const quality = getServiceMatchQuality(service, input.problemType, input.itemType, input.caseKey)
          if (quality > bestServiceQuality) {
            bestServiceQuality = quality
            bestServiceMatch = service
          }
        }
        const geoPriority = getActorGeographyMatchPriority(actor, countySlug, municipalitySlug) ?? 0
        const coverageReason = getCoverageReason(actor, countySlug, municipalitySlug) ?? "base_location"
        return {
          actor,
          geoPriority,
          coverageReason,
          serviceMatch: shouldExposeServiceMatch ? bestServiceMatch : null,
          serviceMatchQuality: bestServiceQuality,
          recommendationFit: categoryWeightsByRecommendation.repair[actor.category] ?? 0,
        }
      })

    if (baseCandidates.some((candidate) => candidate.serviceMatchQuality > 0)) {
      return baseCandidates.filter((candidate) => candidate.serviceMatchQuality > 0)
    }

    return baseCandidates
  }

  const categorySet =
    decision.recommendation === "buy_used"
      ? buyUsedCategories
      : decision.recommendation === "donate"
        ? donateCategories
        : recycleCategories
  const tagHints =
    decision.recommendation === "buy_used"
      ? buyUsedTagHints
      : decision.recommendation === "donate"
        ? donateTagHints
        : recycleTagHints

  return scopedActors
    .filter((actor) => categorySet.has(actor.category) || hasTagMatch(actor.tags, tagHints))
    .map((actor) => {
      const geoPriority = getActorGeographyMatchPriority(actor, countySlug, municipalitySlug) ?? 0
      const coverageReason = getCoverageReason(actor, countySlug, municipalitySlug) ?? "base_location"
      const tagBonus = hasTagMatch(actor.tags, tagHints) ? 0.6 : 0
      const categoryBonus = categoryWeightsByRecommendation[decision.recommendation][actor.category] ?? 0
      return {
        actor,
        geoPriority,
        coverageReason,
        serviceMatch: null,
        serviceMatchQuality: 0,
        recommendationFit: categoryBonus + tagBonus,
      }
    })
}

const buildCoverageReason = (candidate: CandidateActor) => {
  if (candidate.coverageReason === "base_location") {
    return candidate.actor.municipality ?? candidate.actor.county ?? candidate.actor.address
  }
  if (candidate.coverageReason === "service_area_municipality") {
    return candidate.actor.municipality ?? candidate.actor.county ?? "kommunen din"
  }
  if (candidate.coverageReason === "service_area_county") {
    return candidate.actor.county ?? "fylket ditt"
  }
  return "hele Norge"
}

const getWhyThisActor = (
  candidate: CandidateActor,
  recommendation: Recommendation,
  input: DecisionInput,
  travelMinutes: number | null,
  distanceKm: number | null,
  travelEstimateSource: "mapbox" | "approximate" | "none",
  openState: "open" | "closed" | "unknown",
) => {
  const why: string[] = []

  switch (candidate.coverageReason) {
    case "base_location":
      why.push(`Lokal aktør i ${buildCoverageReason(candidate)}.`)
      break
    case "service_area_municipality":
      why.push(`Dekker kommunen din via serviceområde.`)
      break
    case "service_area_county":
      why.push(`Dekker fylket ditt via serviceområde.`)
      break
    case "nationwide_fallback":
      why.push(`Tilbyr landsdekkende hjelp når lokale treff er få.`)
      break
  }

  if (recommendation === "repair" && candidate.serviceMatch) {
    const itemLabel = formatItemTypeLabel(input.itemType).toLowerCase()
    const problemLabel = formatProblemTypeLabel(input.problemType).toLowerCase()
    why.push(`Kan hjelpe med ${problemLabel} på ${itemLabel}.`)
    if (candidate.serviceMatch.priceMax <= input.budgetNok) {
      why.push(`Estimert reparasjon passer innenfor budsjettet ditt.`)
    }
  }

  if (recommendation === "repair" && input.caseKey === "screen_protector" && candidate.serviceMatchQuality > 0) {
    why.push("Kan sannsynligvis hjelpe med ny skjermbeskytter eller sjekk av om underliggende skjerm er skadet.")
  }

  if (recommendation !== "repair") {
    why.push(`Kategori passer anbefalingen: ${formatCategoryLabel(candidate.actor.category).toLowerCase()}.`)
  }

  if (openState === "open") {
    why.push("Ser ut til å være åpen nå.")
  }

  if (travelMinutes !== null) {
    const prefix = travelEstimateSource === "approximate" ? "Omtrent" : "Ca."
    why.push(`${prefix} ${travelMinutes} min reisetid.`)
  } else if (distanceKm !== null) {
    why.push(`Omtrent ${distanceKm.toFixed(1)} km unna.`)
  }

  if (candidate.actor.isTrusted) {
    why.push("Har verifisert informasjon.")
  }

  return why.slice(0, 4)
}

const getCandidateScore = (
  candidate: CandidateActor,
  recommendation: Recommendation,
  openState: "open" | "closed" | "unknown",
  travelMinutes: number | null,
  distanceKm: number | null,
) => {
  const geoScore = candidate.geoPriority === 0 ? 300 : candidate.geoPriority === 1 ? 200 : 100
  let score = geoScore

  if (openState === "open") score += 20
  if (openState === "closed") score -= 8

  score += candidate.recommendationFit * 12

  if (recommendation === "repair") {
    score += candidate.serviceMatchQuality * 40
  }

  if (travelMinutes !== null) {
    score += getTravelScore(travelMinutes) * 18
  }

  if (distanceKm !== null) {
    score += getDistanceScore(distanceKm) * 12
  }

  if (candidate.actor.isTrusted) {
    score += 6
  }

  if (candidate.actor.freshnessStatus === "fresh") {
    score += 4
  }

  return Math.round(score * 100) / 100
}

const materializeMatches = async (
  candidates: CandidateActor[],
  input: DecisionInput,
  decision: DecisionOutput,
  geoContext: ReturnType<typeof resolveGeoContext>,
) => {
  const travelEstimates = await estimateActorTravel(
    candidates.map((candidate) => candidate.actor),
    geoContext.origin,
    geoContext.transportMode,
  )

  const materialized = candidates.map((candidate) => {
    const travelEstimate = travelEstimates.get(candidate.actor.id)
    const openStatus = getOpeningStatus(candidate.actor.openingHoursOsm ?? undefined)
    const travelMinutes = travelEstimate?.travelMinutes ?? null
    const distanceKm = travelEstimate?.distanceKm ?? null
    const travelEstimateSource = travelEstimate?.source ?? "none"
    const score = getCandidateScore(
      candidate,
      decision.recommendation,
      openStatus.state,
      travelMinutes,
      distanceKm,
    )

    return {
      actor: candidate.actor,
      travelMinutes,
      distanceKm,
      travelEstimateSource,
      coverageReason: candidate.coverageReason,
      whyThisActor: getWhyThisActor(
        candidate,
        decision.recommendation,
        input,
        travelMinutes,
        distanceKm,
        travelEstimateSource,
        openStatus.state,
      ),
      serviceMatch: candidate.serviceMatch,
      openStatus: {
        state: openStatus.state,
        nextChange: serializeDate(openStatus.nextChange),
      },
      score,
      geoPriority: candidate.geoPriority,
    }
  })

  materialized.sort((left, right) => {
    if (left.geoPriority !== right.geoPriority) return left.geoPriority - right.geoPriority
    if (left.score !== right.score) return right.score - left.score
    return left.actor.name.localeCompare(right.actor.name, "no", { sensitivity: "base", numeric: true })
  })

  return materialized
}

export const matchDecisionActors = async (
  input: DecisionInput,
  decision: DecisionOutput,
  actors: Actor[],
  context: DecisionGeoContext,
): Promise<{
  matchedActors: DecisionMatchedActor[]
  fallbackReason?: DecisionMatchFallbackReason
}> => {
  const geoContext = resolveGeoContext(context)
  const candidates = getRecommendationCandidates(
    input,
    decision,
    actors,
    geoContext.countySlug,
    geoContext.municipalitySlug,
  )

  if (candidates.length === 0) {
    return { matchedActors: [] }
  }

  const materialized = await materializeMatches(candidates, input, decision, geoContext)
  const withTravelData = materialized.filter((candidate) => candidate.travelMinutes !== null)

  let fallbackReason: DecisionMatchFallbackReason | undefined
  let filtered = materialized

  if (geoContext.maxTravelMinutes && withTravelData.length > 0) {
    const withinLimit = materialized.filter(
      (candidate) =>
        candidate.travelMinutes === null || candidate.travelMinutes <= geoContext.maxTravelMinutes!,
    )
    if (withinLimit.length > 0) {
      filtered = withinLimit
    } else {
      fallbackReason = "travel_limit_exceeded"
    }
  }

  return {
    matchedActors: filtered
      .slice(0, MAX_MATCHED_ACTORS)
      .map(({ geoPriority: _geoPriority, ...candidate }) => candidate),
    fallbackReason,
  }
}

export const evaluateDecisionMatches = async (input: DecisionInput, actors: Actor[], context: DecisionGeoContext) => {
  const decision = evaluateDecision(input)
  const result = await matchDecisionActors(input, decision, actors, context)
  return {
    decision,
    ...result,
  }
}
