import type { ItemType, ProblemType } from "@/lib/prisma-enums"

export type { ItemType, ProblemType } from "@/lib/prisma-enums"
export type Priority = "save_money" | "save_time" | "save_impact" | "balanced"
export type Recommendation = "repair" | "buy_used" | "donate" | "recycle"
export type DecisionCaseKey = "screen_protector"
export type ReasonKey =
  | "budget_ok"
  | "fast_enough"
  | "high_impact"
  | "high_risk"
  | "policy_right_to_repair"
  | "best_overall"
export type DecisionStatus = "feasible" | "not_fully_feasible"
export type ConfidenceLevel = "low" | "medium" | "high"
export type FeasibilityStatus = "ok" | "budget_short" | "time_short" | "both_short"

export interface DecisionInput {
  itemType: ItemType
  problemType: ProblemType
  budgetNok: number
  timeDays: number
  priority?: Priority
  caseKey?: DecisionCaseKey
  modelRepairabilityScore?: number
}

export interface DecisionOption {
  type: Recommendation
  costMin: number
  costMax: number
  timeDays: number
  savingsMin: number
  savingsMax: number
  impactScore: number
  co2eSavedMin: number
  co2eSavedMax: number
  feasible: boolean
  feasibilityStatus: FeasibilityStatus
  deltaBudgetNok: number
  deltaTimeDays: number
  successProbability?: number
  expectedCostMin: number
  expectedCostMax: number
  expectedTimeDays: number
  reasons: ReasonKey[]
  utility: number
}

export interface PlanB {
  key: Recommendation
  budgetTooLow: boolean
  timeTooShort: boolean
  deltaBudgetNok: number
  deltaTimeDays: number
}

export interface DecisionOutput {
  recommendation: Recommendation
  explainability: ReasonKey[]
  options: DecisionOption[]
  status: DecisionStatus
  recommendedFeasible: boolean
  bestFeasibleOption: Recommendation | null
  confidence: ConfidenceLevel
  planB: PlanB | null
}

interface DecisionDataEntry {
  repairCostMin: number
  repairCostMax: number
  repairDays: number
  usedPriceMin: number
  usedPriceMax: number
  newPrice: number
  risk: number
  reusePotential?: number
  recyclePotential?: number
}

interface ProblemProfile {
  repairCostMinMultiplier: number
  repairCostMaxMultiplier: number
  repairDaysDelta: number
  riskDelta: number
  donateSuitability: number
  recycleSuitability: number
}

interface CaseBehavior {
  data: Partial<DecisionDataEntry>
  impactMultiplier?: number
  optionSuitability?: Partial<Record<Recommendation, number>>
}

type Co2Range = { min: number; max: number }
type DecisionSpecificity = "case" | "item_problem" | "item_profile"

const MIN_VISIBLE_OPTION_SUITABILITY = 0.08

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const roundPositive = (value: number, min = 0) => Math.max(min, Math.round(value))

const embodiedCo2eKg: Record<ItemType, Co2Range> = {
  phone: { min: 48, max: 60 },
  laptop: { min: 250, max: 350 },
  tablet: { min: 70, max: 120 },
  desktop: { min: 300, max: 600 },
  smartwatch: { min: 15, max: 30 },
  tv: { min: 200, max: 500 },
  monitor: { min: 150, max: 300 },
  printer: { min: 80, max: 200 },
  camera: { min: 50, max: 150 },
  gaming_console: { min: 80, max: 200 },
  audio: { min: 20, max: 80 },
  small_appliance: { min: 30, max: 120 },
  large_appliance: { min: 200, max: 800 },
  bicycle: { min: 80, max: 200 },
  furniture: { min: 40, max: 200 },
  clothing: { min: 2, max: 33 },
  footwear: { min: 5, max: 25 },
  other: { min: 40, max: 120 },
}

const productionShareByItem: Partial<Record<ItemType, number>> = {
  phone: 0.74,
  laptop: 0.8,
}

const refurbPenaltyKg: Partial<Record<ItemType, number>> = {
  laptop: 11.1,
}

const fallbackSavedFractions: Record<Recommendation, Co2Range> = {
  repair: { min: 0.7, max: 0.9 },
  buy_used: { min: 0.5, max: 0.7 },
  donate: { min: 0.4, max: 0.6 },
  recycle: { min: 0.15, max: 0.3 },
}

const getCo2eSavedRange = (itemType: ItemType, optionType: Recommendation, baseRange: Co2Range): Co2Range => {
  const productionShare = productionShareByItem[itemType]
  if (typeof productionShare === "number") {
    const productionMin = baseRange.min * productionShare
    const productionMax = baseRange.max * productionShare
    if (optionType === "repair") {
      return { min: productionMin, max: productionMax }
    }
    if (optionType === "buy_used" || optionType === "donate") {
      const penalty = refurbPenaltyKg[itemType] ?? 0
      return {
        min: Math.max(0, productionMin - penalty),
        max: Math.max(0, productionMax - penalty),
      }
    }
    if (optionType === "recycle") {
      return { min: productionMin * 0.15, max: productionMax * 0.3 }
    }
  }

  const fallback = fallbackSavedFractions[optionType]
  return {
    min: baseRange.min * fallback.min,
    max: baseRange.max * fallback.max,
  }
}

const scaleRange = (range: Co2Range, factor: number): Co2Range => ({
  min: range.min * factor,
  max: range.max * factor,
})

const policyBias: Record<Recommendation, number> = {
  repair: 0.08,
  buy_used: 0.02,
  donate: -0.02,
  recycle: -0.08,
}

const itemProfiles: Record<ItemType, DecisionDataEntry> = {
  phone: { repairCostMin: 500, repairCostMax: 1400, repairDays: 1, usedPriceMin: 2000, usedPriceMax: 5000, newPrice: 8000, risk: 0.12, reusePotential: 0.42, recyclePotential: 0.95 },
  laptop: { repairCostMin: 1000, repairCostMax: 2800, repairDays: 2, usedPriceMin: 3000, usedPriceMax: 8000, newPrice: 12000, risk: 0.15, reusePotential: 0.55, recyclePotential: 0.95 },
  tablet: { repairCostMin: 700, repairCostMax: 1900, repairDays: 2, usedPriceMin: 1500, usedPriceMax: 4500, newPrice: 6500, risk: 0.14, reusePotential: 0.45, recyclePotential: 0.93 },
  desktop: { repairCostMin: 900, repairCostMax: 2200, repairDays: 2, usedPriceMin: 2500, usedPriceMax: 6500, newPrice: 9000, risk: 0.12, reusePotential: 0.6, recyclePotential: 0.95 },
  smartwatch: { repairCostMin: 400, repairCostMax: 1100, repairDays: 2, usedPriceMin: 1000, usedPriceMax: 2500, newPrice: 3500, risk: 0.16, reusePotential: 0.35, recyclePotential: 0.9 },
  tv: { repairCostMin: 1200, repairCostMax: 3200, repairDays: 4, usedPriceMin: 2500, usedPriceMax: 7000, newPrice: 9000, risk: 0.22, reusePotential: 0.5, recyclePotential: 0.85 },
  monitor: { repairCostMin: 600, repairCostMax: 1600, repairDays: 2, usedPriceMin: 1200, usedPriceMax: 3500, newPrice: 5000, risk: 0.12, reusePotential: 0.55, recyclePotential: 0.9 },
  printer: { repairCostMin: 350, repairCostMax: 1000, repairDays: 2, usedPriceMin: 400, usedPriceMax: 1500, newPrice: 2500, risk: 0.18, reusePotential: 0.35, recyclePotential: 0.85 },
  camera: { repairCostMin: 700, repairCostMax: 2000, repairDays: 3, usedPriceMin: 2500, usedPriceMax: 7000, newPrice: 9000, risk: 0.16, reusePotential: 0.6, recyclePotential: 0.85 },
  gaming_console: { repairCostMin: 500, repairCostMax: 1500, repairDays: 2, usedPriceMin: 1800, usedPriceMax: 4500, newPrice: 6500, risk: 0.12, reusePotential: 0.55, recyclePotential: 0.9 },
  audio: { repairCostMin: 250, repairCostMax: 900, repairDays: 2, usedPriceMin: 500, usedPriceMax: 2500, newPrice: 3500, risk: 0.15, reusePotential: 0.45, recyclePotential: 0.82 },
  small_appliance: { repairCostMin: 250, repairCostMax: 900, repairDays: 2, usedPriceMin: 400, usedPriceMax: 1800, newPrice: 2500, risk: 0.18, reusePotential: 0.4, recyclePotential: 0.82 },
  large_appliance: { repairCostMin: 900, repairCostMax: 3000, repairDays: 3, usedPriceMin: 2500, usedPriceMax: 9000, newPrice: 12000, risk: 0.22, reusePotential: 0.5, recyclePotential: 0.9 },
  bicycle: { repairCostMin: 180, repairCostMax: 850, repairDays: 1, usedPriceMin: 1200, usedPriceMax: 5000, newPrice: 7000, risk: 0.08, reusePotential: 0.78, recyclePotential: 0.55 },
  furniture: { repairCostMin: 150, repairCostMax: 700, repairDays: 2, usedPriceMin: 500, usedPriceMax: 3500, newPrice: 5000, risk: 0.08, reusePotential: 0.92, recyclePotential: 0.28 },
  clothing: { repairCostMin: 50, repairCostMax: 220, repairDays: 2, usedPriceMin: 100, usedPriceMax: 700, newPrice: 900, risk: 0.04, reusePotential: 0.88, recyclePotential: 0.18 },
  footwear: { repairCostMin: 90, repairCostMax: 320, repairDays: 2, usedPriceMin: 200, usedPriceMax: 900, newPrice: 1400, risk: 0.08, reusePotential: 0.58, recyclePotential: 0.16 },
  other: { repairCostMin: 400, repairCostMax: 1300, repairDays: 3, usedPriceMin: 1000, usedPriceMax: 3500, newPrice: 5000, risk: 0.2, reusePotential: 0.42, recyclePotential: 0.6 },
}

const problemProfiles: Record<ProblemType, ProblemProfile> = {
  screen: { repairCostMinMultiplier: 1.25, repairCostMaxMultiplier: 1.45, repairDaysDelta: 0, riskDelta: 0.04, donateSuitability: 0.18, recycleSuitability: 0.35 },
  battery: { repairCostMinMultiplier: 0.95, repairCostMaxMultiplier: 1.15, repairDaysDelta: 0, riskDelta: 0.08, donateSuitability: 0.12, recycleSuitability: 0.65 },
  slow: { repairCostMinMultiplier: 0.45, repairCostMaxMultiplier: 0.6, repairDaysDelta: 0, riskDelta: -0.06, donateSuitability: 0.65, recycleSuitability: 0.1 },
  no_power: { repairCostMinMultiplier: 1.2, repairCostMaxMultiplier: 1.45, repairDaysDelta: 1, riskDelta: 0.12, donateSuitability: 0.08, recycleSuitability: 0.85 },
  water: { repairCostMinMultiplier: 1.45, repairCostMaxMultiplier: 1.8, repairDaysDelta: 2, riskDelta: 0.18, donateSuitability: 0.03, recycleSuitability: 0.92 },
  overheating: { repairCostMinMultiplier: 0.85, repairCostMaxMultiplier: 1.05, repairDaysDelta: 0, riskDelta: 0.12, donateSuitability: 0.12, recycleSuitability: 0.75 },
  charging_port: { repairCostMinMultiplier: 0.7, repairCostMaxMultiplier: 0.85, repairDaysDelta: 0, riskDelta: 0.03, donateSuitability: 0.2, recycleSuitability: 0.4 },
  speaker: { repairCostMinMultiplier: 0.65, repairCostMaxMultiplier: 0.8, repairDaysDelta: 0, riskDelta: 0.02, donateSuitability: 0.35, recycleSuitability: 0.32 },
  microphone: { repairCostMinMultiplier: 0.65, repairCostMaxMultiplier: 0.8, repairDaysDelta: 0, riskDelta: 0.02, donateSuitability: 0.3, recycleSuitability: 0.32 },
  camera: { repairCostMinMultiplier: 0.75, repairCostMaxMultiplier: 0.95, repairDaysDelta: 0, riskDelta: 0.03, donateSuitability: 0.3, recycleSuitability: 0.28 },
  keyboard: { repairCostMinMultiplier: 0.75, repairCostMaxMultiplier: 0.95, repairDaysDelta: 0, riskDelta: 0.03, donateSuitability: 0.28, recycleSuitability: 0.25 },
  trackpad: { repairCostMinMultiplier: 0.7, repairCostMaxMultiplier: 0.9, repairDaysDelta: 0, riskDelta: 0.02, donateSuitability: 0.25, recycleSuitability: 0.22 },
  storage: { repairCostMinMultiplier: 0.75, repairCostMaxMultiplier: 0.95, repairDaysDelta: 1, riskDelta: 0.04, donateSuitability: 0.4, recycleSuitability: 0.35 },
  software: { repairCostMinMultiplier: 0.35, repairCostMaxMultiplier: 0.5, repairDaysDelta: 0, riskDelta: -0.08, donateSuitability: 0.75, recycleSuitability: 0.08 },
  connectivity: { repairCostMinMultiplier: 0.5, repairCostMaxMultiplier: 0.7, repairDaysDelta: 0, riskDelta: 0.01, donateSuitability: 0.45, recycleSuitability: 0.18 },
  broken_part: { repairCostMinMultiplier: 0.6, repairCostMaxMultiplier: 0.8, repairDaysDelta: 0, riskDelta: 0.03, donateSuitability: 0.24, recycleSuitability: 0.28 },
  cosmetic: { repairCostMinMultiplier: 0.3, repairCostMaxMultiplier: 0.45, repairDaysDelta: 0, riskDelta: -0.08, donateSuitability: 0.88, recycleSuitability: 0.05 },
  noise: { repairCostMinMultiplier: 0.6, repairCostMaxMultiplier: 0.85, repairDaysDelta: 0, riskDelta: 0.05, donateSuitability: 0.18, recycleSuitability: 0.42 },
  leak: { repairCostMinMultiplier: 0.95, repairCostMaxMultiplier: 1.2, repairDaysDelta: 1, riskDelta: 0.15, donateSuitability: 0.04, recycleSuitability: 0.88 },
  motor: { repairCostMinMultiplier: 1.2, repairCostMaxMultiplier: 1.45, repairDaysDelta: 1, riskDelta: 0.14, donateSuitability: 0.04, recycleSuitability: 0.82 },
  zipper: { repairCostMinMultiplier: 0.5, repairCostMaxMultiplier: 0.7, repairDaysDelta: 0, riskDelta: -0.03, donateSuitability: 0.25, recycleSuitability: 0.08 },
  seam: { repairCostMinMultiplier: 0.35, repairCostMaxMultiplier: 0.55, repairDaysDelta: 0, riskDelta: -0.04, donateSuitability: 0.35, recycleSuitability: 0.06 },
  tear: { repairCostMinMultiplier: 0.4, repairCostMaxMultiplier: 0.6, repairDaysDelta: 0, riskDelta: -0.02, donateSuitability: 0.2, recycleSuitability: 0.08 },
  stain: { repairCostMinMultiplier: 0.25, repairCostMaxMultiplier: 0.4, repairDaysDelta: 0, riskDelta: -0.05, donateSuitability: 0.52, recycleSuitability: 0.08 },
  sole: { repairCostMinMultiplier: 0.55, repairCostMaxMultiplier: 0.8, repairDaysDelta: 0, riskDelta: 0.01, donateSuitability: 0.18, recycleSuitability: 0.08 },
  chain: { repairCostMinMultiplier: 0.35, repairCostMaxMultiplier: 0.55, repairDaysDelta: 0, riskDelta: -0.04, donateSuitability: 0.35, recycleSuitability: 0.06 },
  brake: { repairCostMinMultiplier: 0.5, repairCostMaxMultiplier: 0.75, repairDaysDelta: 0, riskDelta: 0.08, donateSuitability: 0.08, recycleSuitability: 0.08 },
  tire: { repairCostMinMultiplier: 0.3, repairCostMaxMultiplier: 0.5, repairDaysDelta: 0, riskDelta: -0.03, donateSuitability: 0.25, recycleSuitability: 0.12 },
  wheel: { repairCostMinMultiplier: 0.45, repairCostMaxMultiplier: 0.7, repairDaysDelta: 0, riskDelta: 0.02, donateSuitability: 0.2, recycleSuitability: 0.1 },
  other: { repairCostMinMultiplier: 1, repairCostMaxMultiplier: 1, repairDaysDelta: 0, riskDelta: 0, donateSuitability: 0.25, recycleSuitability: 0.3 },
}

const itemProblemOverrides: Partial<Record<ItemType, Partial<Record<ProblemType, Partial<DecisionDataEntry>>>>> = {
  phone: {
    screen: { repairCostMin: 900, repairCostMax: 2500, repairDays: 1, risk: 0.14 },
    battery: { repairCostMin: 600, repairCostMax: 1200, repairDays: 1, risk: 0.18 },
    charging_port: { repairCostMin: 500, repairCostMax: 1200, repairDays: 1, risk: 0.14 },
    software: { repairCostMin: 150, repairCostMax: 500, repairDays: 1, risk: 0.05 },
    water: { repairCostMin: 1600, repairCostMax: 3600, repairDays: 4, risk: 0.4 },
  },
  laptop: {
    screen: { repairCostMin: 1800, repairCostMax: 4500, repairDays: 3, risk: 0.18 },
    battery: { repairCostMin: 900, repairCostMax: 2200, repairDays: 2, risk: 0.16 },
    keyboard: { repairCostMin: 700, repairCostMax: 1800, repairDays: 2, risk: 0.14 },
    trackpad: { repairCostMin: 700, repairCostMax: 1600, repairDays: 2, risk: 0.14 },
    storage: { repairCostMin: 800, repairCostMax: 2200, repairDays: 2, risk: 0.16 },
    software: { repairCostMin: 300, repairCostMax: 900, repairDays: 1, risk: 0.06 },
    water: { repairCostMin: 2600, repairCostMax: 6200, repairDays: 5, risk: 0.45 },
  },
  tablet: {
    screen: { repairCostMin: 900, repairCostMax: 2400, repairDays: 2, risk: 0.17 },
    battery: { repairCostMin: 600, repairCostMax: 1400, repairDays: 2, risk: 0.19 },
  },
  tv: {
    screen: { repairCostMin: 1800, repairCostMax: 5000, repairDays: 5, risk: 0.3 },
  },
  monitor: {
    screen: { repairCostMin: 700, repairCostMax: 2000, repairDays: 2, risk: 0.16 },
  },
  printer: {
    software: { repairCostMin: 150, repairCostMax: 500, repairDays: 1, risk: 0.08 },
    broken_part: { repairCostMin: 250, repairCostMax: 850, repairDays: 2, risk: 0.2 },
  },
  camera: {
    camera: { repairCostMin: 600, repairCostMax: 1800, repairDays: 3, risk: 0.18 },
    screen: { repairCostMin: 500, repairCostMax: 1400, repairDays: 2, risk: 0.15 },
  },
  gaming_console: {
    software: { repairCostMin: 200, repairCostMax: 600, repairDays: 1, risk: 0.07 },
    overheating: { repairCostMin: 350, repairCostMax: 1100, repairDays: 2, risk: 0.22 },
  },
  audio: {
    battery: { repairCostMin: 200, repairCostMax: 700, repairDays: 1, risk: 0.16 },
  },
  small_appliance: {
    overheating: { repairCostMin: 250, repairCostMax: 800, repairDays: 1, risk: 0.22 },
  },
  large_appliance: {
    leak: { repairCostMin: 1500, repairCostMax: 4000, repairDays: 3, risk: 0.32 },
    motor: { repairCostMin: 1800, repairCostMax: 5000, repairDays: 4, risk: 0.35 },
  },
  bicycle: {
    chain: { repairCostMin: 100, repairCostMax: 350, repairDays: 1, risk: 0.05 },
    brake: { repairCostMin: 150, repairCostMax: 450, repairDays: 1, risk: 0.12 },
    tire: { repairCostMin: 120, repairCostMax: 300, repairDays: 1, risk: 0.04 },
    wheel: { repairCostMin: 200, repairCostMax: 600, repairDays: 1, risk: 0.08 },
  },
  furniture: {
    broken_part: { repairCostMin: 100, repairCostMax: 450, repairDays: 2, risk: 0.08, reusePotential: 0.9, recyclePotential: 0.2 },
    cosmetic: { repairCostMin: 50, repairCostMax: 250, repairDays: 1, risk: 0.04, reusePotential: 0.95, recyclePotential: 0.15 },
  },
  clothing: {
    zipper: { repairCostMin: 100, repairCostMax: 300, repairDays: 2, risk: 0.04, reusePotential: 0.88, recyclePotential: 0.12 },
    seam: { repairCostMin: 50, repairCostMax: 200, repairDays: 1, risk: 0.03, reusePotential: 0.9, recyclePotential: 0.1 },
    tear: { repairCostMin: 80, repairCostMax: 250, repairDays: 2, risk: 0.04, reusePotential: 0.7, recyclePotential: 0.12 },
    stain: { repairCostMin: 50, repairCostMax: 180, repairDays: 1, risk: 0.02, reusePotential: 0.65, recyclePotential: 0.12 },
  },
  footwear: {
    sole: { repairCostMin: 120, repairCostMax: 350, repairDays: 2, risk: 0.08, reusePotential: 0.5, recyclePotential: 0.1 },
    seam: { repairCostMin: 100, repairCostMax: 260, repairDays: 1, risk: 0.05, reusePotential: 0.6, recyclePotential: 0.08 },
    tear: { repairCostMin: 100, repairCostMax: 300, repairDays: 2, risk: 0.06, reusePotential: 0.4, recyclePotential: 0.1 },
    stain: { repairCostMin: 40, repairCostMax: 120, repairDays: 1, risk: 0.02, reusePotential: 0.35, recyclePotential: 0.08 },
  },
}

const decisionCaseBehaviors: Record<DecisionCaseKey, CaseBehavior> = {
  screen_protector: {
    data: {
      repairCostMin: 120,
      repairCostMax: 400,
      repairDays: 1,
      usedPriceMin: 250,
      usedPriceMax: 450,
      newPrice: 450,
      risk: 0.02,
      reusePotential: 0.08,
      recyclePotential: 0.18,
    },
    impactMultiplier: 0.08,
    optionSuitability: {
      repair: 1,
      buy_used: 0.04,
      donate: 0.02,
      recycle: 0.06,
    },
  },
}

const rightToRepairItems = new Set<ItemType>([
  "phone",
  "laptop",
  "tablet",
  "desktop",
  "smartwatch",
  "tv",
  "monitor",
  "printer",
  "camera",
  "gaming_console",
  "audio",
  "small_appliance",
  "large_appliance",
])

const mergeDecisionDataEntry = (
  base: DecisionDataEntry,
  overrides?: Partial<DecisionDataEntry>,
): DecisionDataEntry => {
  if (!overrides) return base

  return {
    repairCostMin: overrides.repairCostMin ?? base.repairCostMin,
    repairCostMax: overrides.repairCostMax ?? base.repairCostMax,
    repairDays: overrides.repairDays ?? base.repairDays,
    usedPriceMin: overrides.usedPriceMin ?? base.usedPriceMin,
    usedPriceMax: overrides.usedPriceMax ?? base.usedPriceMax,
    newPrice: overrides.newPrice ?? base.newPrice,
    risk: overrides.risk ?? base.risk,
    reusePotential: overrides.reusePotential ?? base.reusePotential,
    recyclePotential: overrides.recyclePotential ?? base.recyclePotential,
  }
}

const buildDecisionData = (
  input: DecisionInput,
): {
  data: DecisionDataEntry
  problemProfile: ProblemProfile
  caseBehavior?: CaseBehavior
  impactMultiplier: number
  specificity: DecisionSpecificity
} => {
  const itemProfile = itemProfiles[input.itemType] ?? itemProfiles.other
  const problemProfile = problemProfiles[input.problemType] ?? problemProfiles.other

  let data: DecisionDataEntry = {
    repairCostMin: roundPositive(itemProfile.repairCostMin * problemProfile.repairCostMinMultiplier, 50),
    repairCostMax: roundPositive(itemProfile.repairCostMax * problemProfile.repairCostMaxMultiplier, 50),
    repairDays: roundPositive(itemProfile.repairDays + problemProfile.repairDaysDelta, 1),
    usedPriceMin: itemProfile.usedPriceMin,
    usedPriceMax: itemProfile.usedPriceMax,
    newPrice: itemProfile.newPrice,
    risk: clamp(itemProfile.risk + problemProfile.riskDelta, 0.02, 0.75),
    reusePotential: itemProfile.reusePotential ?? itemProfiles.other.reusePotential,
    recyclePotential: itemProfile.recyclePotential ?? itemProfiles.other.recyclePotential,
  }

  let specificity: DecisionSpecificity = "item_profile"
  const itemProblemOverride = itemProblemOverrides[input.itemType]?.[input.problemType]
  data = mergeDecisionDataEntry(data, itemProblemOverride)
  if (itemProblemOverride) {
    specificity = "item_problem"
  }

  const caseBehavior = input.caseKey ? decisionCaseBehaviors[input.caseKey] : undefined
  if (caseBehavior) {
    data = mergeDecisionDataEntry(data, caseBehavior.data)
    specificity = "case"
  }

  data.repairCostMax = Math.max(data.repairCostMax, data.repairCostMin)
  data.usedPriceMax = Math.max(data.usedPriceMax, data.usedPriceMin)
  data.reusePotential = clamp(data.reusePotential ?? itemProfiles.other.reusePotential ?? 0.42, 0.02, 0.98)
  data.recyclePotential = clamp(data.recyclePotential ?? itemProfiles.other.recyclePotential ?? 0.6, 0.02, 0.99)

  return {
    data,
    problemProfile,
    caseBehavior,
    impactMultiplier: clamp(caseBehavior?.impactMultiplier ?? 1, 0.02, 1),
    specificity,
  }
}

const getWeights = (priority?: Priority) => {
  switch (priority) {
    case "save_time":
      return { money: 0.25, impact: 0.25, time: 0.5 }
    case "save_impact":
      return { money: 0.25, impact: 0.5, time: 0.25 }
    case "balanced":
      return { money: 0.34, impact: 0.33, time: 0.33 }
    case "save_money":
    default:
      return { money: 0.45, impact: 0.35, time: 0.2 }
  }
}

const getFeasibilityStatus = (costMax: number, timeDays: number, input: DecisionInput) => {
  const budgetShort = costMax > input.budgetNok
  const timeShort = timeDays > input.timeDays
  let status: FeasibilityStatus = "ok"
  if (budgetShort && timeShort) status = "both_short"
  else if (budgetShort) status = "budget_short"
  else if (timeShort) status = "time_short"

  return {
    status,
    deltaBudgetNok: budgetShort ? Math.ceil(costMax - input.budgetNok) : 0,
    deltaTimeDays: timeShort ? Math.ceil(timeDays - input.timeDays) : 0,
  }
}

const getRepairSuccessProbability = (risk: number, modelRepairabilityScore?: number) => {
  let probability = clamp(0.95 - risk, 0.5, 0.95)
  if (typeof modelRepairabilityScore === "number") {
    const normalized = clamp(modelRepairabilityScore / 10, 0, 1)
    const adjustment = (normalized - 0.5) * 0.2
    probability = clamp(probability + adjustment, 0.4, 0.98)
  }
  return probability
}

const getBuyUsedSuitability = (data: DecisionDataEntry) => {
  const repairMedian = (data.repairCostMin + data.repairCostMax) / 2
  const usedMedian = Math.max(1, (data.usedPriceMin + data.usedPriceMax) / 2)
  const ratio = repairMedian / usedMedian

  if (ratio <= 0.25) return 0.3
  if (ratio <= 0.45) return 0.45
  if (ratio <= 0.7) return 0.6
  if (ratio <= 1) return 0.72
  return 0.82
}

const getOptionSuitability = (
  optionType: Recommendation,
  data: DecisionDataEntry,
  problemProfile: ProblemProfile,
  caseBehavior?: CaseBehavior,
) => {
  const caseOverride = caseBehavior?.optionSuitability?.[optionType]
  if (typeof caseOverride === "number") {
    return clamp(caseOverride, 0.01, 1)
  }

  if (optionType === "repair") {
    return clamp(0.96 - data.risk * 0.55, 0.45, 0.98)
  }

  if (optionType === "buy_used") {
    const riskBoost = data.risk >= 0.3 ? 0.08 : 0
    return clamp(getBuyUsedSuitability(data) + riskBoost, 0.2, 0.9)
  }

  if (optionType === "donate") {
    return clamp((data.reusePotential ?? 0.42) * problemProfile.donateSuitability, 0.02, 0.95)
  }

  return clamp((data.recyclePotential ?? 0.6) * problemProfile.recycleSuitability, 0.02, 0.98)
}

export function evaluateDecision(input: DecisionInput): DecisionOutput {
  const { data, problemProfile, caseBehavior, impactMultiplier, specificity } = buildDecisionData(input)
  const newPrice = data.newPrice
  const baseCo2e = scaleRange(embodiedCo2eKg[input.itemType] ?? embodiedCo2eKg.other, impactMultiplier)
  const riskPenalty = data.risk * 12
  const repairSuccessProb = getRepairSuccessProbability(data.risk, input.modelRepairabilityScore)

  const options: DecisionOption[] = [
    {
      type: "repair",
      costMin: data.repairCostMin,
      costMax: data.repairCostMax,
      timeDays: data.repairDays,
      savingsMin: newPrice - data.repairCostMax,
      savingsMax: newPrice - data.repairCostMin,
      impactScore: 0,
      co2eSavedMin: 0,
      co2eSavedMax: 0,
      feasible: false,
      feasibilityStatus: "ok",
      deltaBudgetNok: 0,
      deltaTimeDays: 0,
      successProbability: repairSuccessProb,
      expectedCostMin: 0,
      expectedCostMax: 0,
      expectedTimeDays: 0,
      reasons: [],
      utility: 0,
    },
    {
      type: "buy_used",
      costMin: data.usedPriceMin,
      costMax: data.usedPriceMax,
      timeDays: 1,
      savingsMin: newPrice - data.usedPriceMax,
      savingsMax: newPrice - data.usedPriceMin,
      impactScore: 0,
      co2eSavedMin: 0,
      co2eSavedMax: 0,
      feasible: false,
      feasibilityStatus: "ok",
      deltaBudgetNok: 0,
      deltaTimeDays: 0,
      expectedCostMin: 0,
      expectedCostMax: 0,
      expectedTimeDays: 0,
      reasons: [],
      utility: 0,
    },
    {
      type: "donate",
      costMin: 0,
      costMax: 0,
      timeDays: 1,
      savingsMin: 0,
      savingsMax: 0,
      impactScore: 0,
      co2eSavedMin: 0,
      co2eSavedMax: 0,
      feasible: false,
      feasibilityStatus: "ok",
      deltaBudgetNok: 0,
      deltaTimeDays: 0,
      expectedCostMin: 0,
      expectedCostMax: 0,
      expectedTimeDays: 0,
      reasons: [],
      utility: 0,
    },
    {
      type: "recycle",
      costMin: 0,
      costMax: 0,
      timeDays: 1,
      savingsMin: 0,
      savingsMax: 0,
      impactScore: 0,
      co2eSavedMin: 0,
      co2eSavedMax: 0,
      feasible: false,
      feasibilityStatus: "ok",
      deltaBudgetNok: 0,
      deltaTimeDays: 0,
      expectedCostMin: 0,
      expectedCostMax: 0,
      expectedTimeDays: 0,
      reasons: [],
      utility: 0,
    },
  ]

  const optionSuitability = new Map<Recommendation, number>()

  options.forEach((option) => {
    const suitability = getOptionSuitability(option.type, data, problemProfile, caseBehavior)
    optionSuitability.set(option.type, suitability)

    let co2eRange = getCo2eSavedRange(input.itemType, option.type, baseCo2e)
    if (option.type === "donate" || option.type === "recycle") {
      co2eRange = scaleRange(co2eRange, suitability)
    } else if (caseBehavior?.optionSuitability?.[option.type] !== undefined) {
      co2eRange = scaleRange(co2eRange, suitability)
    }

    option.co2eSavedMin = roundPositive(co2eRange.min)
    option.co2eSavedMax = roundPositive(co2eRange.max)

    const co2eMedian = (option.co2eSavedMin + option.co2eSavedMax) / 2
    option.impactScore = clamp((co2eMedian / Math.max(baseCo2e.max, 1)) * 100, 0, 95)
    if (option.type === "repair") {
      option.impactScore = clamp(option.impactScore - riskPenalty, 0, 95)
    }

    if (option.type === "repair") {
      const riskOverhead = 1 - repairSuccessProb
      option.expectedCostMin = roundPositive(option.costMin * (1 + riskOverhead * 0.2))
      option.expectedCostMax = roundPositive(option.costMax * (1 + riskOverhead * 0.35))
      option.expectedTimeDays = option.timeDays + riskOverhead * 0.5
    } else {
      option.expectedCostMin = option.costMin
      option.expectedCostMax = option.costMax
      option.expectedTimeDays = option.timeDays
    }

    const feasibilityCostMax = option.type === "repair" ? option.expectedCostMax : option.costMax
    const feasibilityTimeDays = option.timeDays
    const feasibility = getFeasibilityStatus(feasibilityCostMax, feasibilityTimeDays, input)
    option.feasibilityStatus = feasibility.status
    option.deltaBudgetNok = feasibility.deltaBudgetNok
    option.deltaTimeDays = feasibility.deltaTimeDays
    option.feasible = feasibility.status === "ok"
  })

  const maxTime = Math.max(...options.map((option) => option.expectedTimeDays), 1)
  const weights = getWeights(input.priority)
  const repairOption = options.find((option) => option.type === "repair")
  const usedOption = options.find((option) => option.type === "buy_used")
  let switchingPenalty = 0
  let repairPreferenceBonus = 0

  if (repairOption && usedOption) {
    const repairMedian = (repairOption.expectedCostMin + repairOption.expectedCostMax) / 2
    const usedMedian = (usedOption.expectedCostMin + usedOption.expectedCostMax) / 2

    if (repairMedian <= usedMedian * 1.15) {
      switchingPenalty = 0.08
    }

    if (repairMedian <= usedMedian * 0.45 && repairOption.expectedTimeDays <= usedOption.expectedTimeDays + 1) {
      repairPreferenceBonus = 0.06
    }
  }

  options.forEach((option) => {
    const suitability = optionSuitability.get(option.type) ?? 1
    const costMedian = (option.expectedCostMin + option.expectedCostMax) / 2
    const moneyScore = clamp((newPrice - costMedian) / Math.max(newPrice, 1), 0, 1)
    const impactScore = option.impactScore / 100
    const timeScore = clamp(1 - option.expectedTimeDays / maxTime, 0, 1)
    const feasibilityPenalty =
      option.feasibilityStatus === "ok" ? 0 : option.feasibilityStatus === "both_short" ? 0.35 : 0.2
    const typePenalty =
      option.type === "repair"
        ? (1 - suitability) * 0.12
        : option.type === "buy_used"
          ? (1 - suitability) * 0.18
          : (1 - suitability) * 0.45
    const switching = option.type === "buy_used" ? switchingPenalty : 0
    const repairBonus = option.type === "repair" ? repairPreferenceBonus : 0

    option.utility = clamp(
      weights.money * moneyScore +
        weights.impact * impactScore +
        weights.time * timeScore -
        feasibilityPenalty -
        typePenalty -
        switching +
        policyBias[option.type] +
        repairBonus,
      0,
      1,
    )

    if (option.expectedCostMax <= input.budgetNok) {
      option.reasons.push("budget_ok")
    }
    if (option.expectedTimeDays <= input.timeDays) {
      option.reasons.push("fast_enough")
    }
    if (option.impactScore >= 65) {
      option.reasons.push("high_impact")
    }
    if (data.risk >= 0.3 && option.type === "repair") {
      option.reasons.push("high_risk")
    }
    if (
      option.type === "repair" &&
      (rightToRepairItems.has(input.itemType) || (input.modelRepairabilityScore ?? 0) >= 7)
    ) {
      option.reasons.push("policy_right_to_repair")
    }
  })

  const sorted = [...options].sort((a, b) => b.utility - a.utility)
  const finalOptions = sorted.filter(
    (option) => (optionSuitability.get(option.type) ?? 1) >= MIN_VISIBLE_OPTION_SUITABILITY,
  )
  const visibleOptions = finalOptions.length > 0 ? finalOptions : sorted.slice(0, 1)
  const recommendation = visibleOptions[0]
  const status: DecisionStatus = visibleOptions.some((option) => option.feasible) ? "feasible" : "not_fully_feasible"
  const recommendedFeasible = recommendation.feasible
  const bestFeasible = visibleOptions.find((option) => option.feasible) ?? null

  let confidenceScore = specificity === "case" ? 0.84 : specificity === "item_problem" ? 0.75 : 0.64
  if (data.risk >= 0.3) {
    confidenceScore -= 0.1
  }
  if (repairSuccessProb < 0.7) {
    confidenceScore -= 0.05
  }
  if (typeof input.modelRepairabilityScore === "number") {
    if (input.modelRepairabilityScore >= 7) confidenceScore += 0.05
    if (input.modelRepairabilityScore <= 3) confidenceScore -= 0.05
  }
  if (visibleOptions.length >= 2) {
    const gap = visibleOptions[0].utility - visibleOptions[1].utility
    if (gap > 0.15) confidenceScore += 0.08
    if (gap < 0.05) confidenceScore -= 0.08
  }
  if (status === "not_fully_feasible") {
    confidenceScore -= 0.1
  }
  confidenceScore = clamp(confidenceScore, 0, 1)

  const confidence: ConfidenceLevel =
    confidenceScore >= 0.75 ? "high" : confidenceScore >= 0.5 ? "medium" : "low"

  return {
    recommendation: recommendation.type,
    explainability: recommendation.reasons.length ? recommendation.reasons : ["best_overall"],
    options: visibleOptions,
    status,
    recommendedFeasible,
    bestFeasibleOption: bestFeasible ? bestFeasible.type : null,
    confidence,
    planB:
      status === "not_fully_feasible"
        ? {
            key: recommendation.type,
            budgetTooLow: recommendation.deltaBudgetNok > 0,
            timeTooShort: recommendation.deltaTimeDays > 0,
            deltaBudgetNok: recommendation.deltaBudgetNok,
            deltaTimeDays: recommendation.deltaTimeDays,
          }
        : null,
  }
}
