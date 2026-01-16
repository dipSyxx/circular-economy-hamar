export type ItemType = "phone" | "laptop" | "clothing" | "other"
export type ProblemType = "screen" | "battery" | "slow" | "no_power" | "water" | "zipper" | "seam" | "other"
export type Priority = "save_money" | "save_time" | "save_impact" | "balanced"
export type Recommendation = "repair" | "buy_used" | "donate" | "recycle"
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
}

type DecisionData = Record<ItemType, Partial<Record<ProblemType, DecisionDataEntry>>>
type Co2Range = { min: number; max: number }

const embodiedCo2eKg: Record<ItemType, Co2Range> = {
  phone: { min: 48, max: 60 },
  laptop: { min: 250, max: 350 },
  clothing: { min: 2, max: 33 },
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

const policyBias: Record<Recommendation, number> = {
  repair: 0.06,
  buy_used: 0.03,
  donate: 0.02,
  recycle: -0.04,
}

const decisionData: DecisionData = {
  phone: {
    screen: { repairCostMin: 800, repairCostMax: 2000, repairDays: 1, usedPriceMin: 2000, usedPriceMax: 5000, newPrice: 8000, risk: 0.1 },
    battery: { repairCostMin: 500, repairCostMax: 1000, repairDays: 1, usedPriceMin: 2000, usedPriceMax: 5000, newPrice: 8000, risk: 0.1 },
    slow: { repairCostMin: 300, repairCostMax: 800, repairDays: 1, usedPriceMin: 2000, usedPriceMax: 5000, newPrice: 8000, risk: 0.05 },
    no_power: { repairCostMin: 1000, repairCostMax: 2500, repairDays: 3, usedPriceMin: 2000, usedPriceMax: 5000, newPrice: 8000, risk: 0.25 },
    water: { repairCostMin: 1500, repairCostMax: 3500, repairDays: 4, usedPriceMin: 2000, usedPriceMax: 5000, newPrice: 8000, risk: 0.35 },
    other: { repairCostMin: 600, repairCostMax: 1500, repairDays: 2, usedPriceMin: 1800, usedPriceMax: 4000, newPrice: 7000, risk: 0.2 },
  },
  laptop: {
    screen: { repairCostMin: 1500, repairCostMax: 4000, repairDays: 3, usedPriceMin: 3000, usedPriceMax: 8000, newPrice: 12000, risk: 0.15 },
    battery: { repairCostMin: 800, repairCostMax: 2000, repairDays: 2, usedPriceMin: 3000, usedPriceMax: 8000, newPrice: 12000, risk: 0.1 },
    slow: { repairCostMin: 500, repairCostMax: 1500, repairDays: 2, usedPriceMin: 3000, usedPriceMax: 8000, newPrice: 12000, risk: 0.1 },
    no_power: { repairCostMin: 2000, repairCostMax: 5000, repairDays: 4, usedPriceMin: 3000, usedPriceMax: 8000, newPrice: 12000, risk: 0.3 },
    water: { repairCostMin: 2500, repairCostMax: 6000, repairDays: 5, usedPriceMin: 3000, usedPriceMax: 8000, newPrice: 12000, risk: 0.4 },
    other: { repairCostMin: 1200, repairCostMax: 3000, repairDays: 3, usedPriceMin: 3000, usedPriceMax: 8000, newPrice: 12000, risk: 0.2 },
  },
  clothing: {
    zipper: { repairCostMin: 100, repairCostMax: 300, repairDays: 3, usedPriceMin: 100, usedPriceMax: 500, newPrice: 800, risk: 0.05 },
    seam: { repairCostMin: 50, repairCostMax: 200, repairDays: 2, usedPriceMin: 100, usedPriceMax: 500, newPrice: 800, risk: 0.05 },
    other: { repairCostMin: 150, repairCostMax: 400, repairDays: 3, usedPriceMin: 150, usedPriceMax: 600, newPrice: 900, risk: 0.1 },
  },
  other: {
    other: { repairCostMin: 500, repairCostMax: 1500, repairDays: 3, usedPriceMin: 1500, usedPriceMax: 4000, newPrice: 7000, risk: 0.2 },
  },
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

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

export function evaluateDecision(input: DecisionInput): DecisionOutput {
  const itemData = decisionData[input.itemType] ?? decisionData.other
  const data = itemData?.[input.problemType] ?? itemData?.other ?? decisionData.other.other

  if (!data) {
    const budgetTooLow = input.budgetNok < 1
    const timeTooShort = input.timeDays < 1
    return {
      recommendation: "buy_used",
      explainability: ["best_overall"],
      options: [],
      status: "not_fully_feasible",
      recommendedFeasible: false,
      bestFeasibleOption: null,
      confidence: "low",
      planB: {
        key: "buy_used",
        budgetTooLow,
        timeTooShort,
        deltaBudgetNok: 0,
        deltaTimeDays: 0,
      },
    }
  }

  const newPrice = data.newPrice
  const baseCo2e = embodiedCo2eKg[input.itemType] ?? embodiedCo2eKg.other
  const riskPenalty = data.risk * 15
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

  options.forEach((option) => {
    const co2eRange = getCo2eSavedRange(input.itemType, option.type, baseCo2e)
    option.co2eSavedMin = Math.round(co2eRange.min)
    option.co2eSavedMax = Math.round(co2eRange.max)

    const co2eMedian = (option.co2eSavedMin + option.co2eSavedMax) / 2
    option.impactScore = clamp((co2eMedian / baseCo2e.max) * 100, 5, 95)
    if (option.type === "repair") {
      option.impactScore = clamp(option.impactScore - riskPenalty, 5, 95)
    }

    if (option.type === "repair") {
      option.expectedCostMin = Math.round(option.costMin / repairSuccessProb)
      option.expectedCostMax = Math.round(option.costMax / repairSuccessProb)
      option.expectedTimeDays = option.timeDays / repairSuccessProb
    } else {
      option.expectedCostMin = option.costMin
      option.expectedCostMax = option.costMax
      option.expectedTimeDays = option.timeDays
    }

    const feasibilityCostMax = option.type === "repair" ? option.expectedCostMax : option.costMax
    const feasibilityTimeDays = option.type === "repair" ? option.expectedTimeDays : option.timeDays
    const feasibility = getFeasibilityStatus(feasibilityCostMax, feasibilityTimeDays, input)
    option.feasibilityStatus = feasibility.status
    option.deltaBudgetNok = feasibility.deltaBudgetNok
    option.deltaTimeDays = feasibility.deltaTimeDays
    option.feasible = feasibility.status === "ok"
  })

  const maxTime = Math.max(...options.map((opt) => opt.expectedTimeDays)) || 1
  const weights = getWeights(input.priority)

  const repairOption = options.find((option) => option.type === "repair")
  const usedOption = options.find((option) => option.type === "buy_used")
  let switchingPenalty = 0
  if (repairOption && usedOption) {
    const repairMedian = (repairOption.expectedCostMin + repairOption.expectedCostMax) / 2
    const usedMedian = (usedOption.expectedCostMin + usedOption.expectedCostMax) / 2
    if (repairMedian <= usedMedian * 1.1) {
      switchingPenalty = 0.05
    }
  }

  options.forEach((option) => {
    const costMedian = (option.expectedCostMin + option.expectedCostMax) / 2
    const moneyScore = clamp((newPrice - costMedian) / newPrice, 0, 1)
    const impactScore = option.impactScore / 100
    const timeScore = clamp(1 - option.expectedTimeDays / maxTime, 0, 1)
    const feasibilityPenalty =
      option.feasibilityStatus === "ok" ? 0 : option.feasibilityStatus === "both_short" ? 0.35 : 0.2
    const penalty = option.type === "buy_used" ? switchingPenalty : 0

    option.utility = clamp(
      weights.money * moneyScore +
        weights.impact * impactScore +
        weights.time * timeScore -
        feasibilityPenalty -
        penalty +
        policyBias[option.type],
      0,
      1,
    )

    if (option.costMax <= input.budgetNok) {
      option.reasons.push("budget_ok")
    }
    if (option.timeDays <= input.timeDays) {
      option.reasons.push("fast_enough")
    }
    if (option.impactScore >= 70) {
      option.reasons.push("high_impact")
    }
    if (data.risk >= 0.3 && option.type === "repair") {
      option.reasons.push("high_risk")
    }
    if (
      option.type === "repair" &&
      (input.itemType === "phone" || input.itemType === "laptop" || (input.modelRepairabilityScore ?? 0) >= 7)
    ) {
      option.reasons.push("policy_right_to_repair")
    }
  })

  const sorted = [...options].sort((a, b) => b.utility - a.utility)
  const recommendation = sorted[0]
  const status: DecisionStatus = options.some((option) => option.feasible) ? "feasible" : "not_fully_feasible"
  const recommendedFeasible = recommendation.feasible
  const bestFeasible = sorted.find((option) => option.feasible) ?? null

  let confidenceScore = itemData?.[input.problemType] ? 0.75 : itemData?.other ? 0.6 : 0.5
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
  if (sorted.length >= 2) {
    const gap = sorted[0].utility - sorted[1].utility
    if (gap > 0.15) confidenceScore += 0.1
    if (gap < 0.05) confidenceScore -= 0.1
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
    options: sorted,
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
