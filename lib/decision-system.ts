import {
  evaluateDecision,
  type ConfidenceLevel,
  type DecisionInput,
  type DecisionOption,
  type DecisionOutput,
  type DecisionStatus,
  type FeasibilityStatus,
  type ItemType,
  type PlanB,
  type Priority,
  type ProblemType,
  type Recommendation,
  type ReasonKey,
} from "@/lib/decision-engine"
import {
  TRANSPORT_MODES,
  type CoverageReason,
  type DecisionGeoContext,
  type DecisionMatchFallbackReason,
  type DecisionMatchRequest,
  type DecisionMatchResponse,
  type DecisionMatchedActor,
  type DecisionMatchedActorOpenStatus,
  type TransportMode,
  type TravelEstimateSource,
} from "@/lib/decision-match-types"

/**
 * Official decision-system contract.
 *
 * Stage 1: evaluateDecisionBase(input)
 *   Pure, synchronous recommendation math with no geo or network dependency.
 *
 * Stage 2 lives in lib/decision-system-server.ts
 *   Server-only geo-aware actor matching and travel estimation layered on top
 *   of the base decision result.
 *
 * This keeps the recommendation model deterministic while making the split
 * between product recommendation and local actor fulfillment explicit.
 */
export const DECISION_SYSTEM_VERSION = "decision-system-v1"

export type {
  ConfidenceLevel,
  CoverageReason,
  DecisionGeoContext,
  DecisionInput,
  DecisionMatchFallbackReason,
  DecisionMatchRequest,
  DecisionMatchResponse,
  DecisionMatchedActor,
  DecisionMatchedActorOpenStatus,
  DecisionOption,
  DecisionOutput,
  DecisionStatus,
  FeasibilityStatus,
  ItemType,
  PlanB,
  Priority,
  ProblemType,
  Recommendation,
  ReasonKey,
  TransportMode,
  TravelEstimateSource,
}

export { TRANSPORT_MODES }

export const evaluateDecisionBase = (input: DecisionInput) => evaluateDecision(input)

export const getRecommendedDecisionOption = (decision: DecisionOutput) =>
  decision.options.find((option) => option.type === decision.recommendation) ?? null

export const deriveDecisionOutcomeMetrics = (decision: DecisionOutput) => {
  const recommendedOption = getRecommendedDecisionOption(decision)

  return {
    recommendedOption,
    impactScore: recommendedOption?.impactScore ?? 0,
    savingsMin: recommendedOption?.savingsMin ?? 0,
    savingsMax: recommendedOption?.savingsMax ?? 0,
    co2eSavedMin: recommendedOption?.co2eSavedMin,
    co2eSavedMax: recommendedOption?.co2eSavedMax,
  }
}
