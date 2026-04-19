# Repair Service Fra Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `price_max` nullable across the repair-service system so blank `price_max` is stored as `null` and rendered as `fra <price_min> kr`.

**Architecture:** Change the repair-service contract at the data boundary first, then update parsers and validators, then centralize display formatting and budget semantics, and finally convert Agder regression data to the new representation. Keep the CSV shape stable and rely on `null` as the only marker for `fra` pricing.

**Tech Stack:** Next.js, TypeScript, Prisma, Postgres SQL migrations, Vitest

---

### Task 1: Establish Failing Contract Tests For Nullable `priceMax`

**Files:**
- Modify: `tests/imports/agder-repair-services.test.ts`
- Create: `tests/lib/repair-price-format.test.ts`
- Modify: `tests/imports/county-import-normalizer.test.ts`
- Modify: `tests` files covering parser behavior if existing local style supports them

- [ ] **Step 1: Write the failing Agder regression expectation**

```ts
const expectedRows = [
  ["phonefix-arendal-arendal", "screen", "phone", "1299", ""],
  ["sykkelsport-as-arendal", "chain", "bicycle", "399", "499"],
]

expect(row?.price_min).toBe(priceMin)
expect(row?.price_max ?? "").toBe(priceMax)
```

- [ ] **Step 2: Write the failing formatter test**

```ts
import { describe, expect, it } from "vitest"
import { formatRepairServicePriceLabel } from "@/lib/repair-price-format"

describe("formatRepairServicePriceLabel", () => {
  it("formats explicit ranges", () => {
    expect(formatRepairServicePriceLabel({ priceMin: 900, priceMax: 1800 })).toBe("900-1800 kr")
  })

  it("formats missing max price as fra", () => {
    expect(formatRepairServicePriceLabel({ priceMin: 1299, priceMax: null })).toBe("fra 1299 kr")
  })
})
```

- [ ] **Step 3: Add import-side failing coverage for blank `price_max`**

```ts
expect(parsedRepairRow.priceMax).toBeNull()
expect(validationErrors).not.toContain("price_min og price_max er pakrevd.")
```

- [ ] **Step 4: Run focused tests to verify failure**

Run:

```bash
cmd /c pnpm test tests/imports/agder-repair-services.test.ts
cmd /c pnpm test tests/lib/repair-price-format.test.ts
```

Expected:

- Agder regression fails because `PhoneFix` still uses `1299,1299`
- formatter test fails because helper does not exist yet

- [ ] **Step 5: Commit**

```bash
git add tests/imports/agder-repair-services.test.ts tests/lib/repair-price-format.test.ts
git commit -m "test: cover fra repair pricing contract"
```

### Task 2: Make Schema And Core Types Nullable

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260419_actor_repair_price_max_nullable.sql`
- Modify: `lib/data.ts`
- Modify: `lib/actor-write.ts`
- Modify: `lib/category-repair-scope.ts`
- Modify: `lib/public-data.ts`
- Modify: `app/api/admin/_resource.ts`

- [ ] **Step 1: Write a failing type-level usage in implementation-adjacent tests**

```ts
const service = { priceMin: 1299, priceMax: null }
expect(service.priceMax).toBeNull()
```

- [ ] **Step 2: Update Prisma model and SQL migration**

```prisma
model ActorRepairService {
  id          String      @id @default(cuid())
  actorId     String      @map("actor_id")
  problemType ProblemType @map("problem_type")
  itemTypes   ItemType[]  @map("item_types")
  priceMin    Int         @map("price_min")
  priceMax    Int?        @map("price_max")
  etaDays     Int?        @map("eta_days")
}
```

```sql
ALTER TABLE public.actor_repair_services
  ALTER COLUMN price_max DROP NOT NULL;
```

- [ ] **Step 3: Update shared TS contracts**

```ts
export interface RepairService {
  problemType: ProblemType
  itemTypes?: ItemType[]
  priceMin: number
  priceMax: number | null
  etaDays?: number
}
```

- [ ] **Step 4: Run focused tests and type-aware suite**

Run:

```bash
cmd /c pnpm test tests/lib/repair-price-format.test.ts
```

Expected:

- still red on parser and formatter behavior until later tasks
- no schema/type syntax regressions in edited files

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260419_actor_repair_price_max_nullable.sql lib/data.ts lib/actor-write.ts lib/category-repair-scope.ts lib/public-data.ts app/api/admin/_resource.ts
git commit -m "feat: allow nullable repair price max"
```

### Task 3: Update Parsing, Validation, And Persistence

**Files:**
- Modify: `lib/admin/imports.ts`
- Modify: `lib/actor-submissions.ts`
- Modify: `lib/admin/actor-create-staging.ts`
- Modify: `lib/bootstrap-actors.ts`
- Modify: `lib/import-templates.ts`
- Modify: `components/actor-submission-form.tsx`
- Modify: `components/admin/actor-dialog.tsx`

- [ ] **Step 1: Write failing parser validations for blank max price**

```ts
expect(parseAdminActorNestedRelations("reparasjon", [{
  problemType: "screen",
  itemTypes: ["phone"],
  priceMin: "1299",
  priceMax: "",
  etaDays: "",
}], [])).toEqual({
  repairServices: [{
    problemType: "screen",
    itemTypes: ["phone"],
    priceMin: 1299,
    priceMax: null,
    etaDays: null,
  }],
  sources: [],
})
```

- [ ] **Step 2: Change validator rules to require only `priceMin`**

```ts
if (priceMin === null) {
  throw new Error(`Tjeneste #${index + 1} ma ha fra-pris.`)
}
if (priceMax !== null && priceMin > priceMax) {
  throw new Error(`Tjeneste #${index + 1} har ugyldig prisomrade.`)
}
```

- [ ] **Step 3: Normalize blank max price to `null` in imports and persistence**

```ts
const priceMax = parseNumber(pickRowValue(row, "price_max"))

if (priceMin === null) validationErrors.push("price_min er pakrevd.")
if (priceMax !== null && priceMax < priceMin) {
  validationErrors.push("price_max ma vare tom eller >= price_min.")
}
```

```ts
priceMax: normalized.priceMax === null || normalized.priceMax === undefined ? null : Number(normalized.priceMax),
```

- [ ] **Step 4: Update forms to allow optional max price**

```tsx
<Label className="text-xs">Fra-pris (kr) *</Label>
<Label className="text-xs">Makspris (kr, valgfri)</Label>
```

```ts
if (!service.priceMin.trim()) {
  errors.push(`Tjeneste #${index + 1}: fra-pris ma fylles ut.`)
}
```

- [ ] **Step 5: Run focused tests to verify green**

Run:

```bash
cmd /c pnpm test tests/imports/agder-repair-services.test.ts
cmd /c pnpm test tests/imports/county-import-normalizer.test.ts
```

Expected:

- parser/import tests pass for blank `price_max`

- [ ] **Step 6: Commit**

```bash
git add lib/admin/imports.ts lib/actor-submissions.ts lib/admin/actor-create-staging.ts lib/bootstrap-actors.ts lib/import-templates.ts components/actor-submission-form.tsx components/admin/actor-dialog.tsx
git commit -m "feat: accept fra pricing in repair validators"
```

### Task 4: Centralize Display Formatting And Budget Semantics

**Files:**
- Create: `lib/repair-price-format.ts`
- Modify: `components/decision-match-panel.tsx`
- Modify: `components/admin/actor-dialog.tsx`
- Modify: `components/admin/pending-actors.tsx`
- Modify: `components/my-actors-panel.tsx`
- Modify: `lib/decision-matching.ts`

- [ ] **Step 1: Write the failing budget behavior test**

```ts
expect(isRepairServiceGuaranteedWithinBudget({ priceMin: 900, priceMax: 1800 }, 1800)).toBe(true)
expect(isRepairServiceGuaranteedWithinBudget({ priceMin: 1299, priceMax: null }, 1800)).toBe(false)
expect(isRepairServiceStartingPriceWithinBudget({ priceMin: 1299, priceMax: null }, 1800)).toBe(true)
```

- [ ] **Step 2: Implement shared formatting helpers**

```ts
export function formatRepairServicePriceLabel(service: { priceMin: number; priceMax: number | null }) {
  return service.priceMax === null ? `fra ${service.priceMin} kr` : `${service.priceMin}-${service.priceMax} kr`
}

export function isRepairServiceGuaranteedWithinBudget(
  service: { priceMin: number; priceMax: number | null },
  budget: number,
) {
  return service.priceMax !== null && service.priceMax <= budget
}
```

- [ ] **Step 3: Replace inline range rendering with helper calls**

```tsx
const priceLabel = serviceMatch ? formatRepairServicePriceLabel(serviceMatch) : null
```

- [ ] **Step 4: Update matching logic to stop overclaiming budget fit**

```ts
if (candidate.serviceMatch && isRepairServiceGuaranteedWithinBudget(candidate.serviceMatch, input.budgetNok)) {
  why.push("Estimert reparasjon passer innenfor budsjettet ditt.")
}
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
cmd /c pnpm test tests/lib/repair-price-format.test.ts
```

Expected:

- formatter and budget semantics tests pass

- [ ] **Step 6: Commit**

```bash
git add lib/repair-price-format.ts components/decision-match-panel.tsx components/admin/actor-dialog.tsx components/admin/pending-actors.tsx components/my-actors-panel.tsx lib/decision-matching.ts tests/lib/repair-price-format.test.ts
git commit -m "feat: render and score fra repair prices correctly"
```

### Task 5: Convert Agder Regression Data And Verify End-To-End

**Files:**
- Modify: `data/imports/counties/agder/actor_repair_services.csv`
- Modify: `data/imports/counties/agder/actor_sources.csv`
- Modify: `tests/imports/agder-repair-services.test.ts`
- Modify: `data/imports/counties/README.md`

- [ ] **Step 1: Write the failing Agder CSV expectation for blank max**

```ts
["phonefix-arendal-arendal", "screen", "phone", "1299", ""]
```

- [ ] **Step 2: Update Agder row to true `fra` encoding**

```csv
phonefix-arendal-arendal,screen,phone,1299,,
```

- [ ] **Step 3: Document optional `price_max` in county import docs**

```md
- `price_min` is required for repair services.
- `price_max` may be blank when the source only provides a starting price (`fra`).
```

- [ ] **Step 4: Run targeted and full verification**

Run:

```bash
cmd /c pnpm test tests/imports/agder-repair-services.test.ts
cmd /c pnpm test
```

Expected:

- Agder regression passes
- full suite passes with 0 failures

- [ ] **Step 5: Commit**

```bash
git add data/imports/counties/agder/actor_repair_services.csv data/imports/counties/agder/actor_sources.csv data/imports/counties/README.md tests/imports/agder-repair-services.test.ts
git commit -m "data: encode agder fra repair pricing"
```

### Task 6: Final Verification And Handoff

**Files:**
- Review only: all modified files from Tasks 1-5

- [ ] **Step 1: Run final verification commands fresh**

Run:

```bash
cmd /c pnpm test
```

Expected:

- all Vitest suites pass

- [ ] **Step 2: Review spec coverage against implemented diff**

Checklist:

```md
- nullable schema and migration added
- validators accept blank max price
- UI renders `fra` labels
- matching distinguishes guaranteed fit vs start price
- Agder regression uses blank `price_max`
```

- [ ] **Step 3: Summarize any residual limitations**

```md
- import preview may still depend on existing `server-only` constraints unrelated to this pricing change
- existing explicit ranges remain unchanged
```

- [ ] **Step 4: Commit final integration if needed**

```bash
git add prisma components lib tests data
git commit -m "feat: support fra pricing for repair services"
```
