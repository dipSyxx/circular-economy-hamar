"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { decideCopy, pageCopy } from "@/content/no"
import {
  evaluateDecision,
  type DecisionInput,
  type ItemType,
  type ProblemType,
  type Priority,
  type Recommendation,
} from "@/lib/decision-engine"
import type { Actor, Co2eSource, Co2eSourceItem } from "@/lib/data"
import { formatTime, getOpeningStatus } from "@/lib/opening-hours"
import { recordAction, recordDecision } from "@/lib/profile-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowRight, ArrowLeft, Sparkles, MapPin, Phone, Globe, Crosshair, ExternalLink } from "lucide-react"
import Link from "next/link"

const buildDirectionsLink = (address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`

const getDistanceKm = (from: [number, number], to: [number, number]) => {
  const [lat1, lon1] = from
  const [lat2, lon2] = to
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return 6371 * c
}

type MatchReason = "open_now" | "closed_now" | "closest" | "service_match" | "budget_fit"

const matchReasonLabels: Record<MatchReason, string> = {
  open_now: decideCopy.matching.openNowLabel,
  closed_now: decideCopy.matching.closedNowLabel,
  closest: decideCopy.matching.closestLabel,
  service_match: decideCopy.matching.serviceMatchLabel,
  budget_fit: decideCopy.matching.budgetFitLabel,
}

const formatScore = (value: number) => (Number.isFinite(value) ? value.toFixed(1) : "-")

const donateTagHints = ["ombruk", "gjenbruk", "donasjon", "doner", "innlevering", "brukt", "second hand", "secondhand"]
const buyUsedTagHints = ["ombruk", "gjenbruk", "brukt", "second hand", "secondhand"]
const recycleTagHints = ["gjenvinning", "e-avfall", "avfall", "resirk", "sortering"]

const repairCategories = new Set(["reparasjon", "reparasjon_sko_klar", "mobelreparasjon", "sykkelverksted", "ombruksverksted"])
const buyUsedCategories = new Set(["brukt", "utleie"])
const donateCategories = new Set(["mottak_ombruk", "ombruksverksted", "brukt"])
const recycleCategories = new Set(["gjenvinning"])

const categoryWeightsByRecommendation: Record<Recommendation, Record<string, number>> = {
  repair: {
    reparasjon: 1.6,
    reparasjon_sko_klar: 1.4,
    mobelreparasjon: 1.2,
    sykkelverksted: 1.2,
    ombruksverksted: 1.0,
  },
  buy_used: {
    brukt: 1.4,
    utleie: 0.8,
    ombruksverksted: 0.5,
  },
  donate: {
    mottak_ombruk: 1.8,
    ombruksverksted: 1.2,
    brukt: 0.6,
  },
  recycle: {
    gjenvinning: 1.8,
  },
}

const hasTagMatch = (tags: string[], hints: string[]) => {
  if (!tags.length) return false
  const normalized = tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)
  return normalized.some((tag) => hints.some((hint) => tag.includes(hint)))
}

const getDistanceScore = (distanceKm: number | null) => {
  if (distanceKm === null) return 0
  const normalized = distanceKm / 5
  return 1 / (1 + normalized)
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const getRangeOverlapScore = (minA: number, maxA: number, minB: number, maxB: number) => {
  const overlap = Math.max(0, Math.min(maxA, maxB) - Math.max(minA, minB))
  const span = Math.max(maxA, maxB) - Math.min(minA, minB)
  if (span <= 0) return 0
  return overlap / span
}

const getPriceAlignmentScore = (
  priceMin: number,
  priceMax: number,
  targetMin: number,
  targetMax: number,
) => {
  const overlap = getRangeOverlapScore(priceMin, priceMax, targetMin, targetMax)
  const median = (priceMin + priceMax) / 2
  const targetMedian = (targetMin + targetMax) / 2
  const tolerance = Math.max(300, targetMedian * 0.6)
  const medianScore = clamp(1 - Math.abs(median - targetMedian) / tolerance, 0, 1)
  return overlap * 0.6 + medianScore * 0.4
}

const getTimeAlignmentScore = (etaDays: number | null | undefined, targetDays: number | null | undefined) => {
  if (!etaDays || !targetDays) return 0
  const tolerance = Math.max(1, targetDays)
  return clamp(1 - Math.abs(etaDays - targetDays) / tolerance, 0, 1)
}

const getServiceMatchQuality = (
  service: { problemType: ProblemType; itemTypes?: ItemType[] | null },
  problemType: ProblemType,
  itemType: ItemType | null,
) => {
  if (service.problemType !== problemType) return 0
  const items = service.itemTypes ?? []
  if (!items.length) return 0.7
  if (!itemType) return 0.6
  return items.includes(itemType) ? 1 : 0.3
}

const getBudgetFitScore = (priceMin: number, priceMax: number, budget: number) => {
  if (budget >= priceMax) return 1
  if (budget >= priceMin) return 0.4
  return -0.8
}

const getEtaFitScore = (etaDays: number | null | undefined, timeDays: number) => {
  if (!etaDays) return 0
  if (timeDays >= etaDays) return 0.6
  if (timeDays >= etaDays / 2) return -0.2
  return -0.6
}

type ScoreWeights = {
  open: number
  closed: number
  distance: number
  serviceMatch: number
  timeFit: number
  budgetFit: number
  budgetShort: number
  tagBoost: number
  categoryBoost: number
}

const getScoreWeights = (recommendation: Recommendation): ScoreWeights => {
  const base: ScoreWeights = {
    open: 0,
    closed: 0,
    distance: 0,
    serviceMatch: 0,
    timeFit: 0,
    budgetFit: 0,
    budgetShort: 0,
    tagBoost: 0,
    categoryBoost: 0,
  }

  switch (recommendation) {
    case "repair":
      return {
        ...base,
        open: 2.2,
        closed: -1,
        distance: 1.6,
        serviceMatch: 3.6,
        timeFit: 0.9,
        budgetFit: 1.2,
        budgetShort: -1,
      }
    case "buy_used":
      return {
        ...base,
        open: 1.6,
        closed: -0.7,
        distance: 1.5,
        tagBoost: 1.0,
        categoryBoost: 1.0,
      }
    case "donate":
      return {
        ...base,
        open: 1.5,
        closed: -0.7,
        distance: 1.4,
        tagBoost: 1.2,
        categoryBoost: 1.2,
      }
    case "recycle":
      return {
        ...base,
        open: 1.3,
        closed: -0.7,
        distance: 1.7,
        tagBoost: 1.1,
        categoryBoost: 1.4,
      }
  }
}

const adjustWeightsForPriority = (weights: ScoreWeights, priority?: Priority) => {
  if (!priority) return weights
  switch (priority) {
    case "save_time":
      return {
        ...weights,
        distance: weights.distance * 1.3,
        timeFit: weights.timeFit * 1.5,
      }
    case "save_money":
      return {
        ...weights,
        budgetFit: weights.budgetFit * 1.5,
        budgetShort: weights.budgetShort * 1.2,
      }
    case "save_impact":
      return {
        ...weights,
        open: weights.open * 0.9,
        distance: weights.distance * 0.9,
      }
    case "balanced":
    default:
      return weights
  }
}

interface DecisionWizardProps {
  actors: Actor[]
  co2eSources: Co2eSource[]
  co2eSourceItems: Co2eSourceItem[]
}

export function DecisionWizard({ actors, co2eSources, co2eSourceItems }: DecisionWizardProps) {
  const [step, setStep] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [itemType, setItemType] = useState<ItemType | null>(null)
  const [problemType, setProblemType] = useState<ProblemType | null>(null)
  const [budget, setBudget] = useState(1500)
  const [timeDays, setTimeDays] = useState(3)
  const [priority, setPriority] = useState<Priority | undefined>(undefined)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const lastRecordedRef = useRef<string | null>(null)

  const canContinue = useMemo(() => {
    if (step === 0) return !!itemType
    if (step === 1) return !!problemType
    if (step === 2) return budget >= 0 && timeDays >= 0
    return true
  }, [step, itemType, problemType, budget, timeDays])

  const decision = useMemo(() => {
    if (!itemType || !problemType) return null
    const input: DecisionInput = {
      itemType,
      problemType,
      budgetNok: budget,
      timeDays,
      priority,
    }
    return evaluateDecision(input)
  }, [itemType, problemType, budget, timeDays, priority])

  const recommendation = decision?.options[0]

  const matchedActors = useMemo(() => {
    if (!decision) return []
    const recommendationOption =
      decision.options.find((option) => option.type === decision.recommendation) ?? decision.options[0]
    let baseList = actors
    if (decision.recommendation === "repair") {
      baseList = actors.filter((actor) => repairCategories.has(actor.category))
    } else if (decision.recommendation === "buy_used") {
      baseList = actors.filter(
        (actor) => buyUsedCategories.has(actor.category) || hasTagMatch(actor.tags, buyUsedTagHints),
      )
    } else if (decision.recommendation === "donate") {
      baseList = actors.filter(
        (actor) => donateCategories.has(actor.category) || hasTagMatch(actor.tags, donateTagHints),
      )
    } else {
      baseList = actors.filter(
        (actor) => recycleCategories.has(actor.category) || hasTagMatch(actor.tags, recycleTagHints),
      )
    }

    const scored = baseList.map((actor) => {
      const hasCoords = !(actor.lat === 0 && actor.lng === 0)
      const distanceKm = userLocation && hasCoords ? getDistanceKm(userLocation, [actor.lat, actor.lng]) : null
      const openStatus = getOpeningStatus(actor.openingHoursOsm ?? undefined)
      const weights = adjustWeightsForPriority(getScoreWeights(decision.recommendation), priority)
      const distanceScore = getDistanceScore(distanceKm)
      const donateTagMatch = hasTagMatch(actor.tags, donateTagHints)
      const buyUsedTagMatch = hasTagMatch(actor.tags, buyUsedTagHints)
      const recycleTagMatch = hasTagMatch(actor.tags, recycleTagHints)
      const categoryWeight = categoryWeightsByRecommendation[decision.recommendation][actor.category] ?? 0
      let serviceMatch: NonNullable<Actor["repairServices"]>[number] | null = null
      let serviceMatchQuality = 0
      if (decision.recommendation === "repair" && problemType) {
        for (const service of actor.repairServices ?? []) {
          const quality = getServiceMatchQuality(service, problemType, itemType)
          if (quality > serviceMatchQuality) {
            serviceMatchQuality = quality
            serviceMatch = service
          }
        }
      }
      let score = 0
      if (openStatus.state === "open") score += weights.open
      if (openStatus.state === "closed") score += weights.closed
      if (distanceKm !== null) score += distanceScore * weights.distance
      if (distanceKm === null) score -= 0.2

      if (decision.recommendation === "repair") {
        if (serviceMatchQuality > 0) {
          score += weights.serviceMatch * serviceMatchQuality
        } else {
          score -= weights.serviceMatch * 0.6
        }
        if (serviceMatch) {
          score += getEtaFitScore(serviceMatch.etaDays, timeDays) * weights.timeFit
          score += getBudgetFitScore(serviceMatch.priceMin, serviceMatch.priceMax, budget) * weights.budgetFit
          if (recommendationOption && recommendationOption.type === "repair") {
            const priceAlignment = getPriceAlignmentScore(
              serviceMatch.priceMin,
              serviceMatch.priceMax,
              recommendationOption.expectedCostMin,
              recommendationOption.expectedCostMax,
            )
            const timeAlignment = getTimeAlignmentScore(serviceMatch.etaDays, recommendationOption.expectedTimeDays)
            score += priceAlignment * 1.4
            score += timeAlignment * 0.8
          }
        }
      }

      if (decision.recommendation === "buy_used") {
        if (buyUsedTagMatch) score += weights.tagBoost
        if (categoryWeight > 0) score += categoryWeight * weights.categoryBoost
        if (!buyUsedTagMatch && categoryWeight === 0) score -= 0.4
      }

      if (decision.recommendation === "donate") {
        if (donateTagMatch) score += weights.tagBoost
        if (categoryWeight > 0) score += categoryWeight * weights.categoryBoost
        if (!donateTagMatch && categoryWeight === 0) score -= 0.4
      }

      if (decision.recommendation === "recycle") {
        if (recycleTagMatch) score += weights.tagBoost
        if (categoryWeight > 0) score += categoryWeight * weights.categoryBoost
        if (!recycleTagMatch && categoryWeight === 0) score -= 0.4
      }

      return { actor, distanceKm, openStatus, serviceMatch, score }
    })

    let closestActorId: string | null = null
    let closestDistance = Number.POSITIVE_INFINITY
    for (const entry of scored) {
      if (entry.distanceKm !== null && entry.distanceKm < closestDistance) {
        closestDistance = entry.distanceKm
        closestActorId = entry.actor.id
      }
    }

    const sorted = scored.sort((a, b) => b.score - a.score)
    return sorted.map((entry) => {
      const reasons: MatchReason[] = []
      if (entry.openStatus.state === "open") reasons.push("open_now")
      if (entry.openStatus.state === "closed") reasons.push("closed_now")
      if (entry.distanceKm !== null && entry.actor.id === closestActorId) reasons.push("closest")
      if (entry.serviceMatch) reasons.push("service_match")
      if (entry.serviceMatch && budget >= entry.serviceMatch.priceMax) reasons.push("budget_fit")
      return { ...entry, reasons }
    })
  }, [actors, decision, userLocation, budget, problemType, itemType, timeDays])

  const getWhyNotReasons = (option: NonNullable<typeof decision>["options"][number]) => {
    if (!recommendation || option.type === recommendation.type) return []
    const reasons: string[] = []
    if (option.expectedCostMax > budget) reasons.push(decideCopy.whyNotReasons.overBudget)
    if (option.expectedTimeDays > timeDays) reasons.push(decideCopy.whyNotReasons.tooSlow)
    if (option.impactScore < recommendation.impactScore) reasons.push(decideCopy.whyNotReasons.lowerImpact)
    if (option.savingsMax < recommendation.savingsMax) reasons.push(decideCopy.whyNotReasons.lowerSavings)
    if (option.expectedCostMin > recommendation.expectedCostMin) reasons.push(decideCopy.whyNotReasons.moreExpensive)
    return reasons.slice(0, 2)
  }

  const getFeasibilityDelta = (option: NonNullable<typeof decision>["options"][number]) => {
    if (option.feasibilityStatus === "ok") return null
    const parts: string[] = []
    if (option.deltaBudgetNok > 0) {
      parts.push(`${decideCopy.feasibilityDeltaBudgetLabel} +${option.deltaBudgetNok} NOK`)
    }
    if (option.deltaTimeDays > 0) {
      parts.push(`${decideCopy.feasibilityDeltaTimeLabel} +${option.deltaTimeDays} ${decideCopy.daysLabel}`)
    }
    return parts.length ? parts.join(" · ") : null
  }

  const sourcesByItem = useMemo(() => {
    const sourcesMap = new Map<ItemType, Co2eSource[]>()
    const sourceById = new Map(co2eSources.map((source) => [source.id, source]))

    for (const item of co2eSourceItems) {
      const source = sourceById.get(item.sourceId)
      if (!source) continue
      const bucket = sourcesMap.get(item.itemType)
      if (bucket) {
        bucket.push(source)
      } else {
        sourcesMap.set(item.itemType, [source])
      }
    }

    return sourcesMap
  }, [co2eSources, co2eSourceItems])

  const co2eLinks = useMemo(() => {
    if (!itemType) return co2eSources
    const selected = sourcesByItem.get(itemType) ?? []
    return selected.length ? selected : co2eSources
  }, [itemType, co2eSources, sourcesByItem])

  useEffect(() => {
    if (!showResult || !decision || !itemType || !problemType) return
    const recommendationOption = decision.options[0]
    if (!recommendationOption) return
    const key = `${itemType}-${problemType}-${budget}-${timeDays}-${priority ?? "none"}-${decision.recommendation}`
    if (lastRecordedRef.current === key) return

    recordDecision(
      {
        itemType,
        problemType,
        budgetNok: budget,
        timeDays,
        priority,
      },
      decision.recommendation,
      recommendationOption.impactScore,
      [recommendationOption.savingsMin, recommendationOption.savingsMax],
    )
    lastRecordedRef.current = key
  }, [showResult, decision, itemType, problemType, budget, timeDays, priority])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(decideCopy.matching.locationUnavailable)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude])
        setLocationError(null)
      },
      () => {
        setLocationError(decideCopy.matching.locationError)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const nextStep = () => {
    if (step < decideCopy.steps.length - 1) {
      setStep(step + 1)
    } else {
      setShowResult(true)
    }
  }

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const reset = () => {
    setStep(0)
    setShowResult(false)
    setItemType(null)
    setProblemType(null)
    setBudget(1500)
    setTimeDays(3)
    setPriority(undefined)
    setUserLocation(null)
    setLocationError(null)
    lastRecordedRef.current = null
  }

  return (
    <div className="max-w-4xl mx-auto">
      {!showResult ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                {decideCopy.stepLabel} {step + 1} / {decideCopy.steps.length}
              </Badge>
              <span className="text-sm text-muted-foreground">{decideCopy.steps[step]}</span>
            </div>
            <Progress value={((step + 1) / decideCopy.steps.length) * 100} className="mt-4" />
            <CardTitle className="text-2xl mt-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {pageCopy.decide.title}
            </CardTitle>
            <CardDescription>{pageCopy.decide.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">{decideCopy.itemTitle}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {decideCopy.itemOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={itemType === option.value ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => {
                        setItemType(option.value as ItemType)
                        setProblemType(null)
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && itemType && (
              <div className="space-y-4">
                <h3 className="font-semibold">{decideCopy.problemTitle}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {decideCopy.problemOptions[itemType].map((option) => (
                    <Button
                      key={option.value}
                      variant={problemType === option.value ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setProblemType(option.value as ProblemType)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold">{decideCopy.constraintsTitle}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="budget">
                      {decideCopy.budgetLabel}
                    </label>
                    <Input id="budget" type="number" min={0} value={budget} onChange={(event) => setBudget(Number(event.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="time">
                      {decideCopy.timeLabel}
                    </label>
                    <Input id="time" type="number" min={0} value={timeDays} onChange={(event) => setTimeDays(Number(event.target.value))} />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold">{decideCopy.priorityTitle}</h3>
                <RadioGroup value={priority ?? ""} onValueChange={(value) => setPriority(value as Priority)} className="grid gap-3">
                  {decideCopy.priorityOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 rounded-lg border p-3">
                      <RadioGroupItem value={option.value} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={prevStep} disabled={step === 0} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {decideCopy.backLabel}
              </Button>
              <Button onClick={nextStep} disabled={!canContinue} className="gap-2">
                {step === decideCopy.steps.length - 1 ? decideCopy.finishLabel : decideCopy.nextLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border-2 border-primary">
            <CardHeader>
              <Badge variant="secondary">{decideCopy.resultTitle}</Badge>
              <CardTitle className="text-3xl">
                {recommendation ? decideCopy.optionCopy[recommendation.type].title : "-"}
              </CardTitle>
              <CardDescription>
                {recommendation ? decideCopy.optionCopy[recommendation.type].description : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {decision && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    {decideCopy.confidenceLabel}: {decideCopy.confidenceLevels[decision.confidence]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={decision.status === "not_fully_feasible" ? "border-destructive text-destructive" : ""}
                  >
                    {decision.status === "feasible"
                      ? decideCopy.feasibilityLabels.feasible
                      : decideCopy.feasibilityLabels.not_fully_feasible}
                  </Badge>
                </div>
              )}

              {decision && !decision.recommendedFeasible && decision.bestFeasibleOption && recommendation && (
                <div className="rounded-lg border border-amber-300/60 bg-amber-50/60 p-4 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{decideCopy.recommendedNotFeasibleLabel}</p>
                  {getFeasibilityDelta(recommendation) && (
                    <p className="mt-1">
                      {decideCopy.recommendationDeltaLabel} {getFeasibilityDelta(recommendation)}
                    </p>
                  )}
                  <p className="mt-2">
                    {decideCopy.bestFeasibleLabel}: {decideCopy.optionCopy[decision.bestFeasibleOption].title}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold mb-2">{decideCopy.explainabilityTitle}</p>
                <div className="flex flex-wrap gap-2">
                  {decision?.explainability.map((reason) => (
                    <Badge key={reason} variant="secondary">
                      {decideCopy.reasonLabels[reason]}
                    </Badge>
                  ))}
                </div>
              </div>

              {recommendation && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-sm text-muted-foreground">{decideCopy.savingsLabel}</p>
                    <p className="text-2xl font-bold text-primary">
                      {recommendation.savingsMin}-{recommendation.savingsMax} kr
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-sm text-muted-foreground">{decideCopy.timeResultLabel}</p>
                    <p className="text-2xl font-bold text-primary">~{recommendation.timeDays} {decideCopy.daysLabel}</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-sm text-muted-foreground">{decideCopy.impactLabel}</p>
                    <p className="text-2xl font-bold text-primary">{formatScore(recommendation.impactScore)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {decideCopy.co2eLabel}: ~{recommendation.co2eSavedMin}-{recommendation.co2eSavedMax} kg
                    </p>
                    {co2eLinks.length > 0 && (
                      <div className="mt-2">
                        <Accordion type="single" collapsible>
                          <AccordionItem value="co2e-sources" className="border-none">
                            <AccordionTrigger className="py-2 text-xs font-semibold">
                              {decideCopy.co2eSourcesLabel}
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-0">
                              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                                {co2eLinks.map((source) => (
                                  <a
                                    key={source.id}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                  >
                                    {source.title}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {decision?.status === "not_fully_feasible" && decision.planB && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
                  <p className="text-sm font-semibold">{decideCopy.planB.title}</p>
                  <p className="text-sm text-muted-foreground">{decideCopy.planB.description}</p>
                  {(decision.planB.budgetTooLow || decision.planB.timeTooShort) && (
                    <p className="text-xs text-muted-foreground">
                      {decision.planB.deltaBudgetNok > 0
                        ? `${decideCopy.feasibilityDeltaBudgetLabel} +${decision.planB.deltaBudgetNok} NOK. `
                        : ""}
                      {decision.planB.deltaTimeDays > 0
                        ? `${decideCopy.feasibilityDeltaTimeLabel} +${decision.planB.deltaTimeDays} ${decideCopy.daysLabel}.`
                        : ""}
                    </p>
                  )}
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {decideCopy.planB.steps[decision.planB.key].map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{decideCopy.comparisonTitle}</CardTitle>
              <CardDescription>{decideCopy.alternativesTitle}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {decision?.options.slice(0, 3).map((option) => {
                const whyNot = getWhyNotReasons(option)
                const feasibilityDelta = getFeasibilityDelta(option)
                return (
                  <div key={option.type} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{decideCopy.optionCopy[option.type].title}</h4>
                      <Badge variant={option.type === recommendation?.type ? "default" : "secondary"}>
                        {option.type === recommendation?.type ? decideCopy.comparisonBadges.best : decideCopy.comparisonBadges.alt}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{decideCopy.optionCopy[option.type].description}</p>
                    <div className="text-sm text-muted-foreground">
                      {decideCopy.savingsLabel}: {option.savingsMin}-{option.savingsMax} kr
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {decideCopy.timeResultLabel}: ~{option.timeDays} {decideCopy.daysLabel}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {decideCopy.impactLabel}: {formatScore(option.impactScore)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {decideCopy.co2eLabel}: ~{option.co2eSavedMin}-{option.co2eSavedMax} kg
                    </div>
                    {feasibilityDelta && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold">{decideCopy.feasibilityDeltaLabel}</span> {feasibilityDelta}
                      </div>
                    )}
                    {whyNot.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-semibold">{decideCopy.whyNotTitle}</span> {whyNot.join(" · ")}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>{decideCopy.matchedActorsTitle}</CardTitle>
                <Button size="sm" variant="outline" onClick={requestLocation} className="gap-2">
                  <Crosshair className="h-4 w-4" />
                  {decideCopy.matching.useLocationLabel}
                </Button>
              </div>
              {locationError && <CardDescription className="text-destructive">{locationError}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              {matchedActors.length === 0 && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  {decideCopy.noActorsLabel}
                  <Link href="/kart" className="text-primary hover:underline">
                    {decideCopy.actions.map}
                  </Link>
                </div>
              )}

              {matchedActors.map(({ actor, distanceKm, reasons, openStatus, serviceMatch }) => {
                const primaryAction =
                  decision?.recommendation === "repair" && actor.phone
                    ? { label: decideCopy.actions.call, href: `tel:${actor.phone}`, icon: Phone, actionType: "go_call" as const }
                    : {
                        label: decideCopy.actions.directions,
                        href: buildDirectionsLink(actor.address),
                        icon: MapPin,
                        actionType: "go_directions" as const,
                      }

                const secondaryAction = actor.website
                  ? { label: decideCopy.actions.website, href: actor.website, icon: Globe, actionType: "go_website" as const }
                  : null

                const distanceLabel =
                  distanceKm !== null ? `${distanceKm.toFixed(1)} ${decideCopy.matching.distanceUnit}` : null
                const nextChangeLabel =
                  actor.openingHoursOsm && actor.openingHoursOsm.length > 0
                    ? openStatus.nextChange
                      ? `${openStatus.state === "open" ? decideCopy.matching.closesAtLabel : decideCopy.matching.opensAtLabel} ${formatTime(openStatus.nextChange)}`
                      : decideCopy.matching.hoursFallbackLabel
                    : decideCopy.matching.hoursFallbackLabel
                const priceLabel = serviceMatch
                  ? `${decideCopy.matching.priceRangeLabel}: ${serviceMatch.priceMin}-${serviceMatch.priceMax} kr`
                  : null
                const etaLabel =
                  serviceMatch?.etaDays ? `${decideCopy.matching.etaLabel}: ~${serviceMatch.etaDays} ${decideCopy.daysLabel}` : null

                return (
                  <div key={actor.id} className="flex flex-col gap-3 rounded-lg border p-4">
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-semibold">{actor.name}</h4>
                        <p className="text-sm text-muted-foreground">{actor.address}</p>
                        {distanceLabel && <p className="text-xs text-muted-foreground mt-1">{distanceLabel}</p>}
                        {priceLabel && <p className="text-xs text-muted-foreground mt-1">{priceLabel}</p>}
                        {etaLabel && <p className="text-xs text-muted-foreground mt-1">{etaLabel}</p>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {reasons.map((reason) => (
                          <Badge key={reason} variant="secondary">
                            {matchReasonLabels[reason]}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{nextChangeLabel}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="default">
                        <a
                          href={primaryAction.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => recordAction(primaryAction.actionType, { actorId: actor.id })}
                        >
                          <primaryAction.icon className="h-4 w-4 mr-2" />
                          {primaryAction.label}
                        </a>
                      </Button>
                      {secondaryAction && (
                        <Button asChild variant="outline">
                          <a
                            href={secondaryAction.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => recordAction(secondaryAction.actionType, { actorId: actor.id })}
                          >
                            <secondaryAction.icon className="h-4 w-4 mr-2" />
                            {secondaryAction.label}
                          </a>
                        </Button>
                      )}
                      <Button asChild variant="ghost">
                        <Link href={`/aktorer/${actor.slug}`} onClick={() => recordAction("open_actor", { actorId: actor.id })}>
                          {decideCopy.goLabel}
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={reset}>
              {decideCopy.restartLabel}
            </Button>
            <Button asChild>
              <Link href="/kart">{decideCopy.actions.map}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
