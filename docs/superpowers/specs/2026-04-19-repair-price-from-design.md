# Repair Service `fra` Pricing Design

Date: 2026-04-19
Status: Proposed

## Summary

The system currently requires every repair service to store both `price_min` and `price_max`. That forces "from price" offers such as `fra 1299 kr` to be encoded as `1299-1299`, which is semantically wrong and creates misleading budget-fit signals.

This change makes `price_max` nullable across the system. A repair service with `price_min` set and `price_max = null` means "fra `price_min`". Range pricing remains supported by keeping both values.

## Goals

- Support real-world repair pricing where only a starting price is published.
- Preserve support for explicit price ranges.
- Keep the county import CSV format stable.
- Render pricing honestly in admin and public UI.
- Avoid claiming budget certainty when only a starting price is known.

## Non-Goals

- No new CSV file format.
- No new `pricing_mode` field.
- No changes to unrelated pricing models such as used-product pricing.

## Current Problems

- County imports cannot represent official `fra` pricing without fabricating a max price.
- Validation in imports, admin staging, actor submissions, and admin APIs currently rejects missing `price_max`.
- Public UI always renders repair prices as a range.
- Decision matching treats `price_max` as hard evidence for budget fit, which becomes misleading if we encode `fra` as `min=max`.

## Recommended Approach

Use a single semantic rule everywhere:

- `price_min` is required.
- `price_max` is optional.
- `price_max = null` means "fra `price_min`".
- When `price_max` is present, it must be greater than or equal to `price_min`.

This keeps the model simple, preserves backward compatibility for existing ranged data, and avoids adding a separate pricing mode field.

## Data Model

### Prisma

Update `ActorRepairService.priceMax` from `Int` to `Int?` in `prisma/schema.prisma`.

### Database migration

Add a migration that removes the `NOT NULL` constraint from `public.actor_repair_services.price_max`.

Existing rows do not need data migration. Current range rows remain valid as-is.

### TypeScript contracts

Update all repair-service shapes so `priceMax` is nullable:

- public data types
- admin nested-relation parsing
- actor submission parsing
- actor write inputs
- admin resource payloads

The canonical TypeScript contract becomes:

```ts
type RepairServicePrice = {
  priceMin: number
  priceMax: number | null
}
```

## CSV And Import Contract

The `actor_repair_services.csv` column layout stays unchanged:

```csv
actor_slug,problem_type,item_types,price_min,price_max,eta_days
```

New rule:

- `price_min` must be present and numeric.
- `price_max` may be blank.
- if `price_max` is present, it must be numeric and `>= price_min`.

This preserves compatibility with all existing county workspaces and templates while allowing rows such as:

```csv
phonefix-arendal-arendal,screen,phone,1299,,
```

## Validation Rules

Apply the same validation in all entry points:

- import preview/apply
- admin actor create staging
- public actor submission
- admin repair-service create/update API

Validation contract:

1. `price_min` is required and must be a non-negative integer.
2. `price_max`, when provided, must be a non-negative integer.
3. `price_max`, when provided, must be `>= price_min`.
4. blank `price_max` is valid and stored as `null`.

Suggested error wording:

- `price_min er pakrevd.`
- `price_max ma vare tom eller >= price_min.`

## UI Behavior

### Admin and submission forms

Forms should keep two inputs, but relabel them:

- `Fra-pris (kr) *`
- `Makspris (kr, valgfri)`

This avoids introducing a mode switch while keeping the form fast to use.

### Display formatting

Add a shared price-label formatter for repair services:

- if `priceMax !== null`: render `{priceMin}-{priceMax} kr`
- if `priceMax === null`: render `fra {priceMin} kr`

All repair price rendering should use the same helper in:

- admin actor dialog
- actor submission edit views
- public decision/matching UI
- any other repair service list or badge output

## Matching And Budget Semantics

Budget logic must distinguish between a known max price and a starting price.

Rules:

- if `priceMax !== null` and `priceMax <= budget`, the repair can be marked as safely within budget.
- if `priceMax === null` and `priceMin <= budget`, the UI may indicate that the starting price is within budget, but it must not imply guaranteed total fit.
- if `priceMin > budget`, no budget-positive badge should be shown.

This prevents overclaiming certainty for `fra` prices while still making the data useful.

## API And Persistence

Create/update flows should normalize:

- empty string `priceMax` -> `null`
- blank CSV `price_max` -> `null`

Persistence to Prisma should write `null` directly instead of coercing to `0`.

Any API response types returning repair services should preserve `priceMax: null` rather than synthesizing a value.

## Rollout Plan

1. Make schema and TypeScript contracts nullable.
2. Update validators and parsers.
3. Update admin and public rendering to use shared display formatting.
4. Update decision-matching budget logic.
5. Update CSV templates and import docs.
6. Convert Agder `PhoneFix` test data from `1299,1299` to `1299,`.

## Testing Strategy

Add or update tests for:

- import parsing with blank `price_max`
- import validation rejecting `price_max < price_min`
- admin staging parser accepting blank `priceMax`
- actor submission parser accepting blank `priceMax`
- formatter output for range and `fra`
- decision matching with ranged prices
- decision matching with `fra` prices
- Agder repair-service regression for `PhoneFix`

The key regression is proving that a blank `price_max` is accepted end-to-end and rendered as `fra`.

## Risks

- Missing one display surface may cause `null` to leak into UI output.
- Missing one validator may create inconsistent rules between import/admin/submission paths.
- Budget-fit badges are easy to get subtly wrong if they continue assuming `priceMax` is always present.

## Decision

Adopt nullable `price_max` system-wide and treat `null` as first-class `fra` pricing.
