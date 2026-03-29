"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { Crosshair, Globe, MapPin, Phone } from "lucide-react"
import { decideCopy } from "@/content/no"
import type { Actor } from "@/lib/data"
import type {
  CoverageReason,
  DecisionMatchFallbackReason,
  DecisionMatchedActor,
  TransportMode,
} from "@/lib/decision-match-types"
import { TRANSPORT_MODES } from "@/lib/decision-match-types"
import { getAvailableCountyOptions, getAvailableMunicipalityOptions } from "@/lib/actor-scope"
import { formatTime } from "@/lib/opening-hours"
import { recordAction } from "@/lib/profile-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ALL_COUNTIES = "__all_counties__"
const ALL_MUNICIPALITIES = "__all_municipalities__"

const buildDirectionsLink = (address: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`

const getCoverageReasonLabel = (reason: CoverageReason) => decideCopy.matching.coverageReasonLabels[reason]

const getFallbackReasonLabel = (reason?: DecisionMatchFallbackReason) => {
  if (reason === "travel_limit_exceeded") return decideCopy.matching.fallbackTravelLimitLabel
  return null
}

const getTravelSummary = (matchedActor: DecisionMatchedActor) => {
  if (matchedActor.travelMinutes === null && matchedActor.distanceKm === null) return null

  const parts: string[] = []
  if (matchedActor.travelMinutes !== null) parts.push(`~${matchedActor.travelMinutes} min`)
  if (matchedActor.distanceKm !== null) {
    parts.push(`${matchedActor.distanceKm.toFixed(1)} ${decideCopy.matching.distanceUnit}`)
  }
  return parts.join(" · ")
}

const getOpeningStatusLabel = (matchedActor: DecisionMatchedActor) => {
  if (matchedActor.openStatus.state === "open" && matchedActor.openStatus.nextChange) {
    return `${decideCopy.matching.closesAtLabel} ${formatTime(new Date(matchedActor.openStatus.nextChange))}`
  }
  if (matchedActor.openStatus.state === "closed" && matchedActor.openStatus.nextChange) {
    return `${decideCopy.matching.opensAtLabel} ${formatTime(new Date(matchedActor.openStatus.nextChange))}`
  }
  return decideCopy.matching.hoursFallbackLabel
}

const getOpenBadgeLabel = (matchedActor: DecisionMatchedActor) => {
  if (matchedActor.openStatus.state === "open") return decideCopy.matching.openNowLabel
  if (matchedActor.openStatus.state === "closed") return decideCopy.matching.closedNowLabel
  return null
}

type DecisionMatchPanelProps = {
  actors: Actor[]
  matchedActors: DecisionMatchedActor[]
  budget: number
  daysLabel: string
  decisionRecommendation?: "repair" | "buy_used" | "donate" | "recycle"
  countySlug: string
  onCountyChange: (value: string) => void
  municipalitySlug: string
  onMunicipalityChange: (value: string) => void
  transportMode: TransportMode
  onTransportModeChange: (value: TransportMode) => void
  maxTravelMinutes: string
  onMaxTravelMinutesChange: (value: string) => void
  onUseLocation: () => void
  locationError?: string | null
  matchError?: string | null
  matchLoading: boolean
  fallbackReason?: DecisionMatchFallbackReason
}

export function DecisionMatchPanel({
  actors,
  matchedActors,
  budget,
  daysLabel,
  decisionRecommendation,
  countySlug,
  onCountyChange,
  municipalitySlug,
  onMunicipalityChange,
  transportMode,
  onTransportModeChange,
  maxTravelMinutes,
  onMaxTravelMinutesChange,
  onUseLocation,
  locationError,
  matchError,
  matchLoading,
  fallbackReason,
}: DecisionMatchPanelProps) {
  const countyOptions = useMemo(() => getAvailableCountyOptions(actors), [actors])
  const safeCountySlug = useMemo(() => {
    if (!countySlug) return ""
    return countyOptions.some((option) => option.slug === countySlug) ? countySlug : ""
  }, [countyOptions, countySlug])

  const municipalityOptions = useMemo(
    () => (safeCountySlug ? getAvailableMunicipalityOptions(actors, safeCountySlug) : []),
    [actors, safeCountySlug],
  )

  const safeMunicipalitySlug = useMemo(() => {
    if (!safeCountySlug || !municipalitySlug) return ""
    return municipalityOptions.some((option) => option.slug === municipalitySlug) ? municipalitySlug : ""
  }, [municipalityOptions, municipalitySlug, safeCountySlug])

  useEffect(() => {
    if (safeCountySlug !== countySlug) onCountyChange(safeCountySlug)
  }, [countySlug, onCountyChange, safeCountySlug])

  useEffect(() => {
    if (!safeCountySlug && municipalitySlug) {
      onMunicipalityChange("")
      return
    }
    if (safeMunicipalitySlug !== municipalitySlug) {
      onMunicipalityChange(safeMunicipalitySlug)
    }
  }, [municipalitySlug, onMunicipalityChange, safeCountySlug, safeMunicipalitySlug])

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{decideCopy.matchedActorsTitle}</CardTitle>
          <Button size="sm" variant="outline" onClick={onUseLocation} className="gap-2">
            <Crosshair className="h-4 w-4" />
            {decideCopy.matching.useLocationLabel}
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{decideCopy.matching.countyLabel}</label>
            <Select
              value={safeCountySlug || ALL_COUNTIES}
              onValueChange={(value) => {
                onCountyChange(value === ALL_COUNTIES ? "" : value)
                onMunicipalityChange("")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={decideCopy.matching.countyPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_COUNTIES}>{decideCopy.matching.countyPlaceholder}</SelectItem>
                {countyOptions.map((option) => (
                  <SelectItem key={option.slug} value={option.slug}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{decideCopy.matching.municipalityLabel}</label>
            <Select
              value={safeMunicipalitySlug || ALL_MUNICIPALITIES}
              onValueChange={(value) => onMunicipalityChange(value === ALL_MUNICIPALITIES ? "" : value)}
              disabled={!safeCountySlug || municipalityOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={decideCopy.matching.municipalityPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MUNICIPALITIES}>
                  {decideCopy.matching.municipalityPlaceholder}
                </SelectItem>
                {municipalityOptions.map((option) => (
                  <SelectItem key={option.slug} value={option.slug}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{decideCopy.matching.transportModeLabel}</label>
            <Select value={transportMode} onValueChange={(value) => onTransportModeChange(value as TransportMode)}>
              <SelectTrigger>
                <SelectValue placeholder={decideCopy.matching.transportModePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {TRANSPORT_MODES.map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {decideCopy.matching.transportModeLabels[mode]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="max-travel-minutes">
              {decideCopy.matching.maxTravelMinutesLabel}
            </label>
            <Input
              id="max-travel-minutes"
              type="number"
              min={1}
              inputMode="numeric"
              value={maxTravelMinutes}
              onChange={(event) => onMaxTravelMinutesChange(event.target.value)}
            />
          </div>
        </div>
        {locationError && <CardDescription className="text-destructive">{locationError}</CardDescription>}
        {fallbackReason && <CardDescription className="text-amber-700">{getFallbackReasonLabel(fallbackReason)}</CardDescription>}
        {matchError && <CardDescription className="text-destructive">{matchError}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {matchLoading ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            {decideCopy.matching.liveMatchLoadingLabel}
          </div>
        ) : null}

        {!matchLoading && matchedActors.length === 0 && !matchError && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {decideCopy.noActorsLabel}
            <Link href="/kart" className="text-primary hover:underline">
              {decideCopy.actions.map}
            </Link>
          </div>
        )}

        {!matchLoading &&
          matchedActors.map((matchedActor) => {
            const { actor, serviceMatch } = matchedActor
            const primaryAction =
              decisionRecommendation === "repair" && actor.phone
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
            const openBadgeLabel = getOpenBadgeLabel(matchedActor)
            const travelSummary = getTravelSummary(matchedActor)
            const priceLabel = serviceMatch
              ? `${decideCopy.matching.priceRangeLabel}: ${serviceMatch.priceMin}-${serviceMatch.priceMax} kr`
              : null
            const etaLabel = serviceMatch?.etaDays
              ? `${decideCopy.matching.etaLabel}: ~${serviceMatch.etaDays} ${daysLabel}`
              : null

            return (
              <div key={actor.id} className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold">{actor.name}</h4>
                        <p className="text-sm text-muted-foreground">{actor.address}</p>
                      </div>
                      <Badge variant="outline">{getCoverageReasonLabel(matchedActor.coverageReason)}</Badge>
                    </div>
                    {travelSummary && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {travelSummary}
                        {matchedActor.travelEstimateSource === "approximate"
                          ? ` · ${decideCopy.matching.travelApproximateLabel}`
                          : ""}
                      </p>
                    )}
                    {priceLabel && <p className="mt-1 text-xs text-muted-foreground">{priceLabel}</p>}
                    {etaLabel && <p className="mt-1 text-xs text-muted-foreground">{etaLabel}</p>}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {openBadgeLabel && <Badge variant="secondary">{openBadgeLabel}</Badge>}
                    {serviceMatch && <Badge variant="secondary">{decideCopy.matching.serviceMatchLabel}</Badge>}
                    {serviceMatch && budget >= serviceMatch.priceMax && (
                      <Badge variant="secondary">{decideCopy.matching.budgetFitLabel}</Badge>
                    )}
                    {actor.isTrusted && <Badge variant="secondary">Verifisert</Badge>}
                  </div>

                  <p className="text-xs text-muted-foreground">{getOpeningStatusLabel(matchedActor)}</p>

                  {matchedActor.whyThisActor.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground">{decideCopy.matching.whyThisActorTitle}</p>
                      <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                        {matchedActor.whyThisActor.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="default">
                    <a
                      href={primaryAction.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => recordAction(primaryAction.actionType, { actorId: actor.id })}
                    >
                      <primaryAction.icon className="mr-2 h-4 w-4" />
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
                        <secondaryAction.icon className="mr-2 h-4 w-4" />
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
  )
}
