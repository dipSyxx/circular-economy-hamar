"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DecisionMatchPanel } from "@/components/decision-match-panel"
import { DecisionOverview } from "@/components/decision-overview"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { decideCopy, pageCopy } from "@/content/no"
import type { Actor, Co2eSource, Co2eSourceItem } from "@/lib/data"
import type {
  DecisionMatchFallbackReason,
  DecisionMatchResponse,
  DecisionMatchedActor,
  TransportMode,
} from "@/lib/decision-match-types"
import {
  evaluateDecisionBase,
  type DecisionInput,
  type ItemType,
  type Priority,
  type ProblemType,
} from "@/lib/decision-system"
import { recordDecision } from "@/lib/profile-store"

interface DecisionWizardProps {
  actors: Actor[]
  co2eSources: Co2eSource[]
  co2eSourceItems: Co2eSourceItem[]
  showIntro?: boolean
}

export function DecisionWizard({
  actors,
  co2eSources,
  co2eSourceItems,
  showIntro = true,
}: DecisionWizardProps) {
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

  const co2eLinks = useMemo(() => {
    if (!itemType) return co2eSources

    const sourceById = new Map(co2eSources.map((source) => [source.id, source]))
    const selectedSources = co2eSourceItems
      .filter((item) => item.itemType === itemType)
      .map((item) => sourceById.get(item.sourceId))
      .filter((source): source is Co2eSource => Boolean(source))

    return selectedSources.length ? selectedSources : co2eSources
  }, [co2eSourceItems, co2eSources, itemType])

  useEffect(() => {
    if (!showResult || !decision || !decisionInput) return

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
    <div className="mx-auto max-w-4xl">
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
            {showIntro ? (
              <>
                <CardTitle className="mt-4 flex items-center gap-2 text-2xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {pageCopy.decide.title}
                </CardTitle>
                <CardDescription>{pageCopy.decide.description}</CardDescription>
              </>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 0 ? (
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
            ) : null}

            {step === 1 && itemType ? (
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
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <h3 className="font-semibold">{decideCopy.constraintsTitle}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="budget">
                      {decideCopy.budgetLabel}
                    </label>
                    <Input
                      id="budget"
                      type="number"
                      min={0}
                      value={budget}
                      onChange={(event) => setBudget(Number(event.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="time">
                      {decideCopy.timeLabel}
                    </label>
                    <Input
                      id="time"
                      type="number"
                      min={0}
                      value={timeDays}
                      onChange={(event) => setTimeDays(Number(event.target.value))}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <h3 className="font-semibold">{decideCopy.priorityTitle}</h3>
                <RadioGroup
                  value={priority ?? ""}
                  onValueChange={(value) => setPriority(value as Priority)}
                  className="grid gap-3"
                >
                  {decideCopy.priorityOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 rounded-lg border p-3">
                      <RadioGroupItem value={option.value} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            ) : null}

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
          {decision ? (
            <DecisionOverview budget={budget} co2eLinks={co2eLinks} decision={decision} timeDays={timeDays} />
          ) : null}

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
