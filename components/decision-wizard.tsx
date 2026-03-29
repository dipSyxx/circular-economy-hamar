"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { decideCopy, pageCopy } from "@/content/no"
import {
  evaluateDecisionBase,
  type DecisionInput,
  type ItemType,
  type Priority,
  type ProblemType,
} from "@/lib/decision-system"
import type { Actor, Co2eSource, Co2eSourceItem } from "@/lib/data"
import type {
  DecisionMatchFallbackReason,
  DecisionMatchResponse,
  DecisionMatchedActor,
  TransportMode,
} from "@/lib/decision-match-types"
import { recordDecision } from "@/lib/profile-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ArrowRight, ArrowLeft, Sparkles, ExternalLink } from "lucide-react"
import { DecisionMatchPanel } from "@/components/decision-match-panel"
import Link from "next/link"

const formatScore = (value: number) => (Number.isFinite(value) ? value.toFixed(1) : "-")

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
  const [countySlug, setCountySlug] = useState("")
  const [municipalitySlug, setMunicipalitySlug] = useState("")
  const [transportMode, setTransportMode] = useState<TransportMode>("driving")
  const [maxTravelMinutes, setMaxTravelMinutes] = useState("45")
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [matchedActors, setMatchedActors] = useState<DecisionMatchedActor[]>([])
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [fallbackReason, setFallbackReason] = useState<DecisionMatchFallbackReason | undefined>(undefined)
  const lastRecordedRef = useRef<string | null>(null)

  const canContinue = useMemo(() => {
    if (step === 0) return !!itemType
    if (step === 1) return !!problemType
    if (step === 2) return budget >= 0 && timeDays >= 0
    return true
  }, [step, itemType, problemType, budget, timeDays])

  const decisionInput = useMemo<DecisionInput | null>(() => {
    if (!itemType || !problemType) return null
    return {
      itemType,
      problemType,
      budgetNok: budget,
      timeDays,
      priority,
    }
  }, [budget, itemType, priority, problemType, timeDays])

  const decision = useMemo(() => {
    if (!decisionInput) return null
    return evaluateDecisionBase(decisionInput)
  }, [decisionInput])

  const recommendation = decision?.options[0]

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
    if (!showResult || !decision || !decisionInput) return
    const recommendationOption = decision.options[0]
    if (!recommendationOption) return
    const key = [
      decisionInput.itemType,
      decisionInput.problemType,
      decisionInput.budgetNok,
      decisionInput.timeDays,
      decisionInput.priority ?? "none",
      decision.recommendation,
      decision.status,
      decision.confidence,
    ].join(":")
    if (lastRecordedRef.current === key) return

    recordDecision(decisionInput, decision)
    lastRecordedRef.current = key
  }, [decision, decisionInput, showResult])

  useEffect(() => {
    if (!showResult || !decisionInput) {
      setMatchedActors([])
      setMatchLoading(false)
      setMatchError(null)
      setFallbackReason(undefined)
      return
    }

    const controller = new AbortController()
    const parsedMaxTravelMinutes = Number(maxTravelMinutes)
    const payload = {
      ...decisionInput,
      countySlug: countySlug || undefined,
      municipalitySlug: municipalitySlug || undefined,
      userLat: userLocation?.[0],
      userLng: userLocation?.[1],
      transportMode,
      maxTravelMinutes:
        maxTravelMinutes.trim() && Number.isFinite(parsedMaxTravelMinutes) && parsedMaxTravelMinutes > 0
          ? Math.round(parsedMaxTravelMinutes)
          : undefined,
    }

    const run = async () => {
      setMatchLoading(true)
      setMatchError(null)

      try {
        const response = await fetch("/api/public/decision-matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        })
        const result = (await response.json().catch(() => null)) as
          | (DecisionMatchResponse & { error?: string })
          | null

        if (!response.ok || !result) {
          throw new Error(result?.error || decideCopy.matching.liveMatchErrorLabel)
        }

        setMatchedActors(result.matchedActors)
        setFallbackReason(result.fallbackReason)
      } catch (error) {
        if (controller.signal.aborted) return
        setMatchedActors([])
        setFallbackReason(undefined)
        setMatchError(error instanceof Error ? error.message : decideCopy.matching.liveMatchErrorLabel)
      } finally {
        if (!controller.signal.aborted) {
          setMatchLoading(false)
        }
      }
    }

    void run()
    return () => controller.abort()
  }, [
    countySlug,
    decisionInput,
    maxTravelMinutes,
    municipalitySlug,
    showResult,
    transportMode,
    userLocation,
  ])

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
    setCountySlug("")
    setMunicipalitySlug("")
    setTransportMode("driving")
    setMaxTravelMinutes("45")
    setUserLocation(null)
    setLocationError(null)
    setMatchedActors([])
    setMatchLoading(false)
    setMatchError(null)
    setFallbackReason(undefined)
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

          <DecisionMatchPanel
            actors={actors}
            matchedActors={matchedActors}
            budget={budget}
            daysLabel={decideCopy.daysLabel}
            decisionRecommendation={decision?.recommendation}
            countySlug={countySlug}
            onCountyChange={setCountySlug}
            municipalitySlug={municipalitySlug}
            onMunicipalityChange={setMunicipalitySlug}
            transportMode={transportMode}
            onTransportModeChange={setTransportMode}
            maxTravelMinutes={maxTravelMinutes}
            onMaxTravelMinutesChange={setMaxTravelMinutes}
            onUseLocation={requestLocation}
            locationError={locationError}
            matchError={matchError}
            matchLoading={matchLoading}
            fallbackReason={fallbackReason}
          />

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
