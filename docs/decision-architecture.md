# Decision architecture

The decision system is intentionally split into two stages.

## Stage 1: base recommendation

`evaluateDecisionBase(input)` from `lib/decision-system.ts` wraps the pure model in
`lib/decision-engine.ts`.

This stage:

- has no network dependency
- has no geography dependency
- decides between `repair`, `buy_used`, `donate`, and `recycle`
- returns the canonical recommendation math used across the product

## Stage 2: geo-aware fulfillment

`matchDecisionActorsForContext(input, decision, actors, geoContext)` and
`evaluateDecisionForContext(input, actors, geoContext)` from `lib/decision-system.ts`
wrap the live matching layer in `lib/decision-matching.ts`.

This stage:

- scopes candidates by county and municipality
- applies service-area and nationwide fallback rules
- calculates travel data
- explains why a local actor matches the recommendation

## Why the split is kept

The base recommendation should stay deterministic and fast even when geo data,
travel providers, or live actor availability are missing.

The geo layer can evolve independently without changing the recommendation model.
That keeps persistence stable while still allowing better local fulfillment.
