import type { Actor, RepairService } from "@/lib/data"
import type { DecisionInput, DecisionOutput } from "@/lib/decision-engine"
import type { OpeningState } from "@/lib/opening-hours"

export const TRANSPORT_MODES = ["driving", "cycling", "walking"] as const

export type TransportMode = (typeof TRANSPORT_MODES)[number]
export type TravelEstimateSource = "mapbox" | "approximate" | "none"
export type CoverageReason =
  | "base_location"
  | "service_area_municipality"
  | "service_area_county"
  | "nationwide_fallback"
export type DecisionMatchFallbackReason = "travel_limit_exceeded"

export interface DecisionGeoContext {
  countySlug?: string | null
  municipalitySlug?: string | null
  userLat?: number | null
  userLng?: number | null
  transportMode?: TransportMode | null
  maxTravelMinutes?: number | null
}

export interface DecisionMatchedActorOpenStatus {
  state: OpeningState
  nextChange?: string
}

export interface DecisionMatchedActor {
  actor: Actor
  travelMinutes: number | null
  distanceKm: number | null
  travelEstimateSource: TravelEstimateSource
  coverageReason: CoverageReason
  whyThisActor: string[]
  serviceMatch: RepairService | null
  openStatus: DecisionMatchedActorOpenStatus
  score: number
}

export interface DecisionMatchRequest extends DecisionInput, DecisionGeoContext {}

export interface DecisionMatchResponse {
  decision: DecisionOutput
  matchedActors: DecisionMatchedActor[]
  fallbackReason?: DecisionMatchFallbackReason
}
