"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { decideCopy, pageCopy } from "@/content/no"
import { evaluateDecision, type DecisionInput, type ItemType, type ProblemType, type Priority } from "@/lib/decision-engine"
import { actors } from "@/lib/data"
import { formatTime, getOpeningStatus } from "@/lib/opening-hours"
import { recordAction, recordDecision } from "@/lib/profile-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowRight, ArrowLeft, Sparkles, MapPin, Phone, Globe, Crosshair } from "lucide-react"
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

type MatchReason = "open_now" | "closed_now" | "closest"

const matchReasonLabels: Record<MatchReason, string> = {
  open_now: decideCopy.matching.openNowLabel,
  closed_now: decideCopy.matching.closedNowLabel,
  closest: decideCopy.matching.closestLabel,
}

export function DecisionWizard() {
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
    if (step === 2) return budget > 0 && timeDays >= 0
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
    let baseList = actors
    if (decision.recommendation === "repair") {
      baseList = actors.filter((actor) => actor.category === "reparasjon")
    } else if (decision.recommendation === "buy_used") {
      baseList = actors.filter((actor) => actor.category === "brukt")
    } else if (decision.recommendation === "donate") {
      const ombrukActors = actors.filter((actor) => actor.tags.includes("ombruk"))
      baseList = ombrukActors.length ? ombrukActors : actors.filter((actor) => actor.category === "brukt")
    } else {
      baseList = actors.filter((actor) => actor.category === "gjenvinning")
    }

    const scored = baseList.map((actor) => {
      const distanceKm = userLocation ? getDistanceKm(userLocation, [actor.lat, actor.lng]) : null
      const openStatus = getOpeningStatus(actor.openingHoursOsm)
      let score = 0
      if (openStatus.state === "open") score += 3
      if (openStatus.state === "closed") score -= 1
      if (distanceKm !== null) score += Math.max(0, 10 - distanceKm) / 10
      return { actor, distanceKm, openStatus, score }
    })

    const sorted = scored.sort((a, b) => b.score - a.score)
    return sorted.map((entry, index) => {
      const reasons: MatchReason[] = []
      if (entry.openStatus.state === "open") reasons.push("open_now")
      if (entry.openStatus.state === "closed") reasons.push("closed_now")
      if (entry.distanceKm !== null && index === 0) reasons.push("closest")
      return { ...entry, reasons }
    })
  }, [decision, userLocation])

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
            )}

            {step === 3 && (
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
                    <p className="text-2xl font-bold text-primary">~{recommendation.timeDays} dager</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-sm text-muted-foreground">{decideCopy.impactLabel}</p>
                    <p className="text-2xl font-bold text-primary">{recommendation.impactScore}</p>
                  </div>
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
              {decision?.options.slice(0, 3).map((option) => (
                <div key={option.type} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{decideCopy.optionCopy[option.type].title}</h4>
                    <Badge variant={option.type === recommendation?.type ? "default" : "secondary"}>
                      {option.type === recommendation?.type
                        ? decideCopy.comparisonBadges.best
                        : decideCopy.comparisonBadges.alt}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{decideCopy.optionCopy[option.type].description}</p>
                  <div className="text-sm text-muted-foreground">
                    {decideCopy.savingsLabel}: {option.savingsMin}-{option.savingsMax} kr
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {decideCopy.timeResultLabel}: ~{option.timeDays} dager
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {decideCopy.impactLabel}: {option.impactScore}
                  </div>
                </div>
              ))}
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

              {matchedActors.map(({ actor, distanceKm, reasons, openStatus }) => {
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

                return (
                  <div key={actor.id} className="flex flex-col gap-3 rounded-lg border p-4">
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-semibold">{actor.name}</h4>
                        <p className="text-sm text-muted-foreground">{actor.address}</p>
                        {distanceLabel && <p className="text-xs text-muted-foreground mt-1">{distanceLabel}</p>}
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
