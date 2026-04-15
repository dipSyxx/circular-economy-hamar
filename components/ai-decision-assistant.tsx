"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, Crosshair, Leaf, LoaderCircle, MapPin, RefreshCcw, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DecisionMatchPanel } from "@/components/decision-match-panel"
import { DecisionOverview } from "@/components/decision-overview"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { getDecisionAssistantDefaults } from "@/lib/ai/decision-assistant-defaults"
import { decideCopy } from "@/content/no"
import type { AIDecisionResponse } from "@/lib/ai/decision-assistant-types"
import type { Actor, Co2eSource, Co2eSourceItem } from "@/lib/data"
import type { Priority } from "@/lib/decision-system"
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
  geoPromptOpen: boolean
  onGeoPromptComplete: () => void
}

const priorityLabels = Object.fromEntries(
  decideCopy.priorityOptions.map((option) => [option.value, option.label]),
) as Record<string, string>
const AI_PRIORITY_NONE = "__none__"

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
  geoPromptOpen,
  onGeoPromptComplete,
}: AIDecisionAssistantProps) {
  const reduceMotion = useReducedMotion()
  const { budgetNok: defaultBudgetNok, timeDays: defaultTimeDays } = getDecisionAssistantDefaults()
  const [message, setMessage] = useState("")
  const [budgetNok, setBudgetNok] = useState(() => String(defaultBudgetNok))
  const [timeDays, setTimeDays] = useState(() => String(defaultTimeDays))
  const [priority, setPriority] = useState<Priority | undefined>(undefined)
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

  const parsedBudgetNok = Number(budgetNok)
  const parsedTimeDays = Number(timeDays)
  const isBudgetValid = budgetNok.trim().length > 0 && Number.isFinite(parsedBudgetNok) && parsedBudgetNok >= 0
  const isTimeValid = timeDays.trim().length > 0 && Number.isFinite(parsedTimeDays) && parsedTimeDays >= 0

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
    setLocationError(null)

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
    if (!trimmedMessage || !isBudgetValid || !isTimeValid) return

    setLoading(true)
    setError(null)

    try {
      const payload = {
        message: trimmedMessage,
        budgetNok: Math.round(parsedBudgetNok),
        timeDays: Math.round(parsedTimeDays),
        priority,
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
    setBudgetNok(String(defaultBudgetNok))
    setTimeDays(String(defaultTimeDays))
    setPriority(undefined)
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

  const fadeUp = (delay = 0) => ({
    initial: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion
      ? { duration: 0 }
      : { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay },
  })

  const floatPrimary = reduceMotion ? { x: 0, y: 0 } : { x: [0, 10, 0], y: [0, -12, 0] }
  const floatAccent = reduceMotion ? { x: 0, y: 0 } : { x: [0, -14, 0], y: [0, 16, 0] }

  const heroHighlights = [
    { icon: Sparkles, label: decideCopy.ai.adviceTitle },
    { icon: Leaf, label: decideCopy.ai.interpretationTitle },
    { icon: MapPin, label: decideCopy.matchedActorsTitle },
  ]
  const selectedPriorityValue = priority ?? AI_PRIORITY_NONE

  const handleGeoPromptRequestLocation = () => {
    requestLocation()
    onGeoPromptComplete()
  }

  const handleGeoPromptContinue = () => {
    onGeoPromptComplete()
  }

  return (
    <>
      <Dialog open={geoPromptOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-md rounded-[1.75rem] border-border/70 p-0"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="overflow-hidden rounded-[1.75rem] bg-[linear-gradient(160deg,rgba(228,247,235,0.96),rgba(255,247,214,0.94))] dark:bg-[linear-gradient(160deg,rgba(16,48,36,0.96),rgba(78,62,18,0.84))]">
            <div className="space-y-5 p-6 sm:p-7">
              <div className="flex size-12 items-center justify-center rounded-full bg-white/70 text-primary shadow-sm dark:bg-white/10 dark:text-white">
                <MapPin className="h-5 w-5" />
              </div>

              <DialogHeader className="space-y-2 text-left">
                <DialogTitle>{decideCopy.ai.geoPromptTitle}</DialogTitle>
                <DialogDescription className="text-sm leading-6 text-foreground/75 dark:text-white/70">
                  {decideCopy.ai.geoPromptDescription}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex-col gap-3 sm:flex-col sm:justify-stretch">
                <Button onClick={handleGeoPromptRequestLocation} className="w-full rounded-full">
                  <Crosshair className="h-4 w-4" />
                  {decideCopy.ai.geoPromptConfirmLabel}
                </Button>
                <Button variant="outline" onClick={handleGeoPromptContinue} className="w-full rounded-full">
                  {decideCopy.ai.geoPromptSkipLabel}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(228,247,235,0.96)_38%,rgba(255,247,214,0.94)_100%)] shadow-[0_28px_80px_-48px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(10,18,14,0.96),rgba(16,48,36,0.94)_42%,rgba(78,62,18,0.84)_100%)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-30 dark:opacity-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.8),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.18),transparent_34%),radial-gradient(circle_at_70%_85%,rgba(250,204,21,0.18),transparent_28%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.22),transparent_34%),radial-gradient(circle_at_70%_85%,rgba(250,204,21,0.18),transparent_28%)]" />
            <motion.div
              className="absolute -left-16 top-12 h-44 w-44 rounded-full bg-primary/18 blur-3xl dark:bg-primary/25"
              animate={floatPrimary}
              transition={reduceMotion ? { duration: 0 } : { duration: 16, ease: "easeInOut", repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-16 right-0 h-56 w-56 rounded-full bg-accent/18 blur-3xl dark:bg-accent/20"
              animate={floatAccent}
              transition={
                reduceMotion ? { duration: 0 } : { duration: 18, ease: "easeInOut", repeat: Infinity, delay: 2 }
              }
            />
          </div>

          <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:p-10">
            <motion.div className="space-y-8" {...fadeUp(0)}>
            <div className="space-y-5">
              <Badge
                variant="outline"
                className="rounded-full border-white/60 bg-white/70 px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-foreground/80 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-white/10 dark:text-white/80"
              >
                {decideCopy.ai.modeBadge}
              </Badge>

              <div className="space-y-4">
                <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.9rem] lg:leading-[1.05] dark:text-white">
                  {decideCopy.ai.title}
                </h2>
                <p className="max-w-xl text-base leading-7 text-foreground/75 sm:text-lg dark:text-white/70">
                  {decideCopy.ai.description}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {heroHighlights.map((highlight, index) => {
                const Icon = highlight.icon

                return (
                  <motion.div
                    key={highlight.label}
                    className="rounded-[1.3rem] border border-white/55 bg-white/62 p-4 shadow-[0_22px_40px_-34px_rgba(15,23,42,0.35)] backdrop-blur-md dark:border-white/12 dark:bg-white/8"
                    {...fadeUp(0.08 + index * 0.06)}
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-foreground/6 text-primary dark:bg-white/10 dark:text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-foreground dark:text-white">{highlight.label}</p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          <motion.div className="relative" {...fadeUp(0.12)}>
            <div className="absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.18),transparent_60%)] blur-2xl dark:bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.16),transparent_60%)]" />
            <div className="relative rounded-[1.65rem] border border-white/65 bg-background/75 p-5 shadow-[0_26px_60px_-42px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/12 dark:bg-background/70 sm:p-6">
              <div className="space-y-3">
                <label htmlFor="ai-decision-message" className="text-sm font-medium text-foreground/80 dark:text-white/80">
                  {decideCopy.ai.inputLabel}
                </label>
                <Textarea
                  id="ai-decision-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={decideCopy.ai.placeholder}
                  className="min-h-40 rounded-[1.35rem] border-white/60 bg-white/70 px-4 py-3 text-base leading-7 shadow-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/90 focus-visible:border-primary/40 focus-visible:ring-primary/15 dark:border-white/12 dark:bg-background/75 dark:text-white dark:placeholder:text-white/45"
                />
              </div>

              <div className="mt-5 space-y-4 rounded-[1.35rem] border border-white/55 bg-white/55 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/6">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground dark:text-white">{decideCopy.ai.constraintsTitle}</p>
                  <p className="text-sm text-muted-foreground dark:text-white/65">{decideCopy.ai.constraintsDescription}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="ai-budget" className="text-sm font-medium text-foreground/80 dark:text-white/80">
                      {decideCopy.budgetLabel}
                    </label>
                    <Input
                      id="ai-budget"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={budgetNok}
                      onChange={(event) => setBudgetNok(event.target.value)}
                      className="border-white/60 bg-white/70 dark:border-white/12 dark:bg-background/70"
                    />
                    {!isBudgetValid ? (
                      <p className="text-xs text-destructive">{decideCopy.ai.invalidBudgetLabel}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="ai-time-days" className="text-sm font-medium text-foreground/80 dark:text-white/80">
                      {decideCopy.timeLabel}
                    </label>
                    <Input
                      id="ai-time-days"
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={timeDays}
                      onChange={(event) => setTimeDays(event.target.value)}
                      className="border-white/60 bg-white/70 dark:border-white/12 dark:bg-background/70"
                    />
                    {!isTimeValid ? (
                      <p className="text-xs text-destructive">{decideCopy.ai.invalidTimeLabel}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground/80 dark:text-white/80">{decideCopy.priorityTitle}</p>
                  <RadioGroup
                    value={selectedPriorityValue}
                    onValueChange={(value) => setPriority(value === AI_PRIORITY_NONE ? undefined : (value as Priority))}
                    className="grid gap-2"
                  >
                    <label className="flex items-center gap-3 rounded-xl border border-white/55 bg-white/72 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/6">
                      <RadioGroupItem value={AI_PRIORITY_NONE} />
                      <span className="font-medium">{decideCopy.ai.priorityUnsetLabel}</span>
                    </label>
                    {decideCopy.priorityOptions.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 rounded-xl border border-white/55 bg-white/72 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/6"
                      >
                        <RadioGroupItem value={option.value} />
                        <span className="font-medium">{option.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="rounded-[1.1rem] border border-dashed border-border/70 bg-background/55 p-4 dark:bg-background/35">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground dark:text-white">{decideCopy.matching.useLocationLabel}</p>
                      <p className="text-sm text-muted-foreground dark:text-white/65">
                        {userLocation ? decideCopy.ai.locationReadyLabel : decideCopy.ai.locationHint}
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={requestLocation} className="rounded-full">
                      <Crosshair className="h-4 w-4" />
                      {decideCopy.matching.useLocationLabel}
                    </Button>
                  </div>

                  {locationError ? <p className="mt-3 text-sm text-destructive">{locationError}</p> : null}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {decideCopy.ai.examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="rounded-full border border-white/60 bg-white/70 px-3.5 py-2 text-xs font-medium text-foreground/80 transition-[transform,background-color,border-color,color,box-shadow] hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:text-foreground hover:shadow-sm dark:border-white/12 dark:bg-white/6 dark:text-white/80 dark:hover:bg-white/10"
                    onClick={() => setMessage(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>

              {error ? (
                <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={submit}
                  disabled={loading || message.trim().length < 3 || !isBudgetValid || !isTimeValid}
                  className="h-11 rounded-full bg-foreground px-5 text-background shadow-[0_16px_35px_-20px_rgba(15,23,42,0.7)] hover:bg-foreground/90 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
                >
                  {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {loading ? decideCopy.ai.loadingLabel : decideCopy.ai.submitLabel}
                </Button>

                {result ? (
                  <Button
                    variant="outline"
                    onClick={reset}
                    className="h-11 rounded-full border-white/65 bg-white/60 px-5 hover:bg-white dark:border-white/12 dark:bg-white/6 dark:hover:bg-white/10"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    {decideCopy.ai.resetLabel}
                  </Button>
                ) : null}
              </div>
            </div>
            </motion.div>
          </div>
        </div>

      {result ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <motion.section
              className="rounded-[1.75rem] border border-border/60 bg-card/85 p-6 shadow-[0_20px_60px_-44px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:p-7"
              {...fadeUp(0.02)}
            >
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {decideCopy.ai.adviceTitle}
              </Badge>
              <p className="mt-4 text-sm leading-7 text-foreground/80 dark:text-white/75">{result.advice}</p>

              {result.warnings?.length ? (
                <div className="mt-6 space-y-3 rounded-[1.35rem] border border-amber-300/50 bg-amber-50/70 p-4 dark:border-amber-400/20 dark:bg-amber-500/10">
                  <p className="text-sm font-semibold text-foreground dark:text-white">{decideCopy.ai.warningTitle}</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground dark:text-white/70">
                    {result.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </motion.section>

            <motion.section
              className="rounded-[1.75rem] border border-border/60 bg-background/75 p-6 shadow-[0_20px_60px_-44px_rgba(15,23,42,0.2)] backdrop-blur-sm sm:p-7"
              {...fadeUp(0.08)}
            >
              <Badge
                variant="outline"
                className="rounded-full border-primary/15 bg-primary/8 px-3 py-1 text-primary dark:border-primary/25 dark:bg-primary/10 dark:text-primary-foreground"
              >
                {decideCopy.ai.interpretationTitle}
              </Badge>
              <p className="mt-4 text-sm leading-6 text-muted-foreground dark:text-white/65">
                {decideCopy.ai.interpretationDescription}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {interpretationBadges.map((value) => (
                  <Badge
                    key={value}
                    variant="outline"
                    className="rounded-full border-border/70 bg-background/85 px-3 py-1.5 dark:bg-white/5"
                  >
                    {value}
                  </Badge>
                ))}
              </div>

              {result.assumptions.length ? (
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-semibold text-foreground dark:text-white">{decideCopy.ai.assumptionsTitle}</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground dark:text-white/70">
                    {result.assumptions.map((assumption) => (
                      <li key={assumption}>{assumption}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </motion.section>
          </div>

          <motion.div {...fadeUp(0.12)}>
            <DecisionOverview
              budget={result.extractedInput.budgetNok}
              co2eLinks={co2eLinks}
              decision={result.decision}
              timeDays={result.extractedInput.timeDays}
            />
          </motion.div>

          <motion.div {...fadeUp(0.16)}>
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
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-border/60 bg-muted/35 px-5 py-4"
            {...fadeUp(0.2)}
          >
            <p className="text-sm text-muted-foreground">{decideCopy.ai.adviceDescription}</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={reset} className="rounded-full">
                {decideCopy.ai.resetLabel}
              </Button>
              <Button asChild className="rounded-full px-5">
                <Link href="/kart">
                  {decideCopy.actions.map}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
      </div>
    </>
  )
}
