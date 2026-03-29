import "server-only"

import { evaluateDecisionMatches, matchDecisionActors } from "@/lib/decision-matching"
import type { Actor } from "@/lib/data"
import type { DecisionGeoContext, DecisionInput, DecisionOutput } from "@/lib/decision-system"

export const matchDecisionActorsForContext = (
  input: DecisionInput,
  decision: DecisionOutput,
  actors: Actor[],
  geoContext: DecisionGeoContext,
) => matchDecisionActors(input, decision, actors, geoContext)

export const evaluateDecisionForContext = (
  input: DecisionInput,
  actors: Actor[],
  geoContext: DecisionGeoContext,
) => evaluateDecisionMatches(input, actors, geoContext)
