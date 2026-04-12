"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { LoaderCircle, RefreshCcw, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DecisionMatchPanel } from "@/components/decision-match-panel"
import { DecisionOverview } from "@/components/decision-overview"
import { Textarea } from "@/components/ui/textarea"
import { decideCopy } from "@/content/no"
import type { AIDecisionResponse } from "@/lib/ai/decision-assistant-types"
import type { Actor, Co2eSource, Co2eSourceItem } from "@/lib/data"
import type {
  DecisionMatchFallbackReason,
  DecisionMatchResponse,
  DecisionMatchedActor,
  TransportMode,
} from "@/lib/decision-match-types"
import { formatItemTypeLabel, formatProblemTypeLabel } from "@/lib/enum-labels"
import { recordDecision } from "@/lib/profile-store"

interface AIDecisionAssistantProps {
  actors: Actor[]
  co2eSources: Co2eSource[]
  co2eSourceItems: Co2eSourceItem[]
}

const priorityLabels = Object.fromEntries(
  decideCopy.priorityOptions.map((option) => [option.value, option.label]),
) as Record<string, string>

const buildMatchPayload = ({
  extractedInput,
  countySlug,
  municipalitySlug,
  userLocation,
  transportMode,
  maxTravelMinutes,
}: {
  extractedInput: AIDecisionResponse["extractedInput"]
  countySlug: string
  municipalitySlug: string
  userLocation: [number, number] | null
  transportMode: TransportMode
  maxTravelMinutes: string
}) => {
  const parsedMaxTravelMinutes = Number(maxTravelMinutes)

  return {
    ...extractedInput,
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
}

const getRequestKey = (payload: ReturnType<typeof buildMatchPayload>) => JSON.stringify(payload)

export function AIDecisionAssistant({
  actors,
  co2eSources,
  co2eSourceItems,
}: AIDecisionAssistantProps) {
  const [message, setMessage] = useState("")
  const [result, setResult] = useState<AIDecisionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  const lastMatchKeyRef = useRef<string | null>(null)

  const co2eLinks = useMemo(() => {
    const itemType = result?.extractedInput.itemType
    if (!itemType) return co2eSources

    const sourceById = new Map(co2eSources.map((source) => [source.id, source]))
    const selectedSources = co2eSourceItems
      .filter((item) => item.itemType === itemType)
      .map((item) => sourceById.get(item.sourceId))
      .filter((source): source is Co2eSource => Boolean(source))

    return selectedSources.length ? selectedSources : co2eSources
  }, [co2eSourceItems, co2eSources, result?.extractedInput.itemType])

  const currentMatchPayload = useMemo(() => {
    if (!result) return null

    return buildMatchPayload({
      extractedInput: result.extractedInput,
      countySlug,
      municipalitySlug,
      userLocation,
      transportMode,
      maxTravelMinutes,
    })
  }, [countySlug, maxTravelMinutes, municipalitySlug, result, transportMode, userLocation])

  useEffect(() => {
    if (!result) return

    const key = [
      result.extractedInput.itemType,
      result.extractedInput.problemType,
      result.extractedInput.budgetNok,
      result.extractedInput.timeDays,
      result.extractedInput.priority ?? "none",
      result.decision.recommendation,
      result.decision.status,
      result.decision.confidence,
    ].join(":")

    if (lastRecordedRef.current === key) return

    recordDecision(result.extractedInput, result.decision)
    lastRecordedRef.current = key
  }, [result])

  useEffect(() => {
    if (!result || !currentMatchPayload) {
      setMatchedActors([])
      setMatchLoading(false)
      setMatchError(null)
      setFallbackReason(undefined)
      return
    }

    const requestKey = getRequestKey(currentMatchPayload)
    if (requestKey === lastMatchKeyRef.current) return

    const controller = new AbortController()

    const run = async () => {
      setMatchLoading(true)
      setMatchError(null)

      try {
        const response = await fetch("/api/public/decision-matches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentMatchPayload),
          signal: controller.signal,
        })
        const next = (await response.json().catch(() => null)) as
          | (DecisionMatchResponse & { error?: string })
          | null

        if (!response.ok || !next) {
          throw new Error(next?.error || decideCopy.matching.liveMatchErrorLabel)
        }

        setMatchedActors(next.matchedActors)
        setFallbackReason(next.fallbackReason)
        lastMatchKeyRef.current = requestKey
      } catch (fetchError) {
        if (controller.signal.aborted) return
        setMatchedActors([])
        setFallbackReason(undefined)
        setMatchError(fetchError instanceof Error ? fetchError.message : decideCopy.matching.liveMatchErrorLabel)
      } finally {
        if (!controller.signal.aborted) {
          setMatchLoading(false)
        }
      }
    }

    void run()
    return () => controller.abort()
  }, [currentMatchPayload, result])

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

  const submit = async () => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    setLoading(true)
    setError(null)

    try {
      const payload = {
        message: trimmedMessage,
        countySlug: countySlug || undefined,
        municipalitySlug: municipalitySlug || undefined,
        userLat: userLocation?.[0],
        userLng: userLocation?.[1],
        transportMode,
        maxTravelMinutes: (() => {
          const parsed = Number(maxTravelMinutes)
          return maxTravelMinutes.trim() && Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : undefined
        })(),
      }

      const response = await fetch("/api/public/ai-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const next = (await response.json().catch(() => null)) as (AIDecisionResponse & { error?: string }) | null

      if (!response.ok || !next) {
        throw new Error(next?.error || decideCopy.ai.errorLabel)
      }

      setResult(next)
      setMatchedActors(next.matchedActors)
      setFallbackReason(next.fallbackReason)
      setMatchError(null)
      setMatchLoading(false)
      lastMatchKeyRef.current = getRequestKey(
        buildMatchPayload({
          extractedInput: next.extractedInput,
          countySlug,
          municipalitySlug,
          userLocation,
          transportMode,
          maxTravelMinutes,
        }),
      )
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : decideCopy.ai.errorLabel)
      setResult(null)
      setMatchedActors([])
      setFallbackReason(undefined)
      setMatchError(null)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setMessage("")
    setResult(null)
    setLoading(false)
    setError(null)
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
    lastMatchKeyRef.current = null
  }

  const interpretationBadges = result
    ? [
        formatItemTypeLabel(result.extractedInput.itemType),
        formatProblemTypeLabel(result.extractedInput.problemType),
        `${result.extractedInput.budgetNok} kr`,
        `${result.extractedInput.timeDays} ${decideCopy.daysLabel}`,
        result.extractedInput.priority
          ? priorityLabels[result.extractedInput.priority]
          : decideCopy.ai.balancedFallbackLabel,
      ]
    : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <Badge variant="secondary" className="w-fit">
            {decideCopy.ai.modeBadge}
          </Badge>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="h-5 w-5 text-primary" />
            {decideCopy.ai.title}
          </CardTitle>
          <CardDescription>{decideCopy.ai.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="ai-decision-message" className="text-sm font-medium">
              {decideCopy.ai.inputLabel}
            </label>
            <Textarea
              id="ai-decision-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={decideCopy.ai.placeholder}
              className="min-h-32"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {decideCopy.ai.examples.map((example) => (
              <button
                key={example}
                type="button"
                className="rounded-full border px-3 py-1 transition hover:bg-muted"
                onClick={() => setMessage(example)}
              >
                {example}
              </button>
            ))}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={submit} disabled={loading || message.trim().length < 3} className="gap-2">
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? decideCopy.ai.loadingLabel : decideCopy.ai.submitLabel}
            </Button>
            {result ? (
              <Button variant="outline" onClick={reset} className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                {decideCopy.ai.resetLabel}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {result ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{decideCopy.ai.adviceTitle}</CardTitle>
              <CardDescription>{decideCopy.ai.adviceDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-foreground">{result.advice}</p>

              {result.warnings?.length ? (
                <div className="space-y-2 rounded-lg border border-amber-300/60 bg-amber-50/60 p-4">
                  <p className="text-sm font-semibold text-foreground">{decideCopy.ai.warningTitle}</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{decideCopy.ai.interpretationTitle}</CardTitle>
              <CardDescription>{decideCopy.ai.interpretationDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {interpretationBadges.map((value) => (
                  <Badge key={value} variant="outline">
                    {value}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">{decideCopy.ai.assumptionsTitle}</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {result.assumptions.map((assumption) => (
                    <li key={assumption}>{assumption}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <DecisionOverview
            budget={result.extractedInput.budgetNok}
            co2eLinks={co2eLinks}
            decision={result.decision}
            timeDays={result.extractedInput.timeDays}
          />

          <DecisionMatchPanel
            actors={actors}
            matchedActors={matchedActors}
            budget={result.extractedInput.budgetNok}
            daysLabel={decideCopy.daysLabel}
            decisionRecommendation={result.decision.recommendation}
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
              {decideCopy.ai.resetLabel}
            </Button>
            <Button asChild>
              <Link href="/kart">{decideCopy.actions.map}</Link>
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}
