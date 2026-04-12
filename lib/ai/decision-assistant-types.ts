import type { DecisionInput, DecisionOutput } from "@/lib/decision-system"
import type {
  DecisionGeoContext,
  DecisionMatchFallbackReason,
  DecisionMatchedActor,
} from "@/lib/decision-match-types"

export interface AIDecisionRequest extends DecisionGeoContext {
  message: string
}

export interface AIDecisionResponse {
  advice: string
  assumptions: string[]
  extractedInput: DecisionInput
  decision: DecisionOutput
  matchedActors: DecisionMatchedActor[]
  fallbackReason?: DecisionMatchFallbackReason
  warnings?: string[]
}
