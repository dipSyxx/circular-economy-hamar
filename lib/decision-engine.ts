export type ItemType = "phone" | "laptop" | "clothing" | "other"
export type ProblemType = "screen" | "battery" | "slow" | "no_power" | "water" | "zipper" | "seam" | "other"
export type Priority = "save_money" | "save_time" | "save_impact"
export type Recommendation = "repair" | "buy_used" | "donate" | "recycle"
export type ReasonKey = "budget_ok" | "fast_enough" | "high_impact" | "high_risk" | "best_overall"

export interface DecisionInput {
  itemType: ItemType
  problemType: ProblemType
  budgetNok: number
  timeDays: number
  priority?: Priority
}

export interface DecisionOption {
  type: Recommendation
  costMin: number
  costMax: number
  timeDays: number
  savingsMin: number
  savingsMax: number
  impactScore: number
  feasible: boolean
  reasons: ReasonKey[]
  utility: number
}

export interface DecisionOutput {
  recommendation: Recommendation
  explainability: ReasonKey[]
  options: DecisionOption[]
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

const impactUnits: Record<ItemType, number> = {
  phone: 0.7,
  laptop: 1,
  clothing: 0.3,
  other: 0.5,
}

const optionMeta: Record<Recommendation, { impactMultiplier: number }> = {
  repair: { impactMultiplier: 0.9 },
  buy_used: { impactMultiplier: 0.7 },
  donate: { impactMultiplier: 0.6 },
  recycle: { impactMultiplier: 0.3 },
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
    case "save_money":
    default:
      return { money: 0.45, impact: 0.35, time: 0.2 }
  }
}

export function evaluateDecision(input: DecisionInput): DecisionOutput {
  const itemData = decisionData[input.itemType] ?? decisionData.other
  const data = itemData?.[input.problemType] ?? itemData?.other ?? decisionData.other.other

  if (!data) {
    return {
      recommendation: "buy_used",
      explainability: ["best_overall"],
      options: [],
    }
  }

  const newPrice = data.newPrice
  const baseImpact = impactUnits[input.itemType]
  const riskPenalty = data.risk * 15

  const options: DecisionOption[] = [
    {
      type: "repair",
      costMin: data.repairCostMin,
      costMax: data.repairCostMax,
      timeDays: data.repairDays,
      savingsMin: newPrice - data.repairCostMax,
      savingsMax: newPrice - data.repairCostMin,
      impactScore: clamp(baseImpact * optionMeta.repair.impactMultiplier * 100 - riskPenalty, 10, 95),
      feasible: input.budgetNok >= data.repairCostMax && input.timeDays >= data.repairDays,
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
      impactScore: clamp(baseImpact * optionMeta.buy_used.impactMultiplier * 100, 10, 90),
      feasible: input.budgetNok >= data.usedPriceMax && input.timeDays >= 1,
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
      impactScore: clamp(baseImpact * optionMeta.donate.impactMultiplier * 100, 10, 80),
      feasible: input.timeDays >= 1,
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
      impactScore: clamp(baseImpact * optionMeta.recycle.impactMultiplier * 100, 5, 60),
      feasible: input.timeDays >= 1,
      reasons: [],
      utility: 0,
    },
  ]

  const maxTime = Math.max(...options.map((opt) => opt.timeDays)) || 1
  const weights = getWeights(input.priority)

  options.forEach((option) => {
    const costMedian = (option.costMin + option.costMax) / 2
    const moneyScore = clamp((newPrice - costMedian) / newPrice, 0, 1)
    const impactScore = option.impactScore / 100
    const timeScore = clamp(1 - option.timeDays / maxTime, 0, 1)
    const feasibilityPenalty = option.feasible ? 0 : 0.2

    option.utility = clamp(
      weights.money * moneyScore + weights.impact * impactScore + weights.time * timeScore - feasibilityPenalty,
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
  })

  const sorted = [...options].sort((a, b) => b.utility - a.utility)
  const recommendation = sorted[0]

  return {
    recommendation: recommendation.type,
    explainability: recommendation.reasons.length ? recommendation.reasons : ["best_overall"],
    options: sorted,
  }
}
