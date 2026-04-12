"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { decideCopy } from "@/content/no"
import type { Co2eSource } from "@/lib/data"
import type { DecisionOutput } from "@/lib/decision-system"
import { ExternalLink } from "lucide-react"

const formatScore = (value: number) => (Number.isFinite(value) ? value.toFixed(1) : "-")

const getRecommendedOption = (decision: DecisionOutput) =>
  decision.options.find((option) => option.type === decision.recommendation) ?? decision.options[0] ?? null

const getWhyNotReasons = (
  decision: DecisionOutput,
  budget: number,
  timeDays: number,
  option: DecisionOutput["options"][number],
) => {
  const recommendation = getRecommendedOption(decision)
  if (!recommendation || option.type === recommendation.type) return []

  const reasons: string[] = []
  if (option.expectedCostMax > budget) reasons.push(decideCopy.whyNotReasons.overBudget)
  if (option.expectedTimeDays > timeDays) reasons.push(decideCopy.whyNotReasons.tooSlow)
  if (option.impactScore < recommendation.impactScore) reasons.push(decideCopy.whyNotReasons.lowerImpact)
  if (option.savingsMax < recommendation.savingsMax) reasons.push(decideCopy.whyNotReasons.lowerSavings)
  if (option.expectedCostMin > recommendation.expectedCostMin) reasons.push(decideCopy.whyNotReasons.moreExpensive)

  return reasons.slice(0, 2)
}

const getFeasibilityDelta = (option: DecisionOutput["options"][number]) => {
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

interface DecisionOverviewProps {
  budget: number
  co2eLinks: Co2eSource[]
  decision: DecisionOutput
  timeDays: number
}

export function DecisionOverview({ budget, co2eLinks, decision, timeDays }: DecisionOverviewProps) {
  const recommendation = getRecommendedOption(decision)

  return (
    <>
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

          {!decision.recommendedFeasible && decision.bestFeasibleOption && recommendation ? (
            <div className="rounded-lg border border-amber-300/60 bg-amber-50/60 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">{decideCopy.recommendedNotFeasibleLabel}</p>
              {getFeasibilityDelta(recommendation) ? (
                <p className="mt-1">
                  {decideCopy.recommendationDeltaLabel} {getFeasibilityDelta(recommendation)}
                </p>
              ) : null}
              <p className="mt-2">
                {decideCopy.bestFeasibleLabel}: {decideCopy.optionCopy[decision.bestFeasibleOption].title}
              </p>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-semibold">{decideCopy.explainabilityTitle}</p>
            <div className="flex flex-wrap gap-2">
              {decision.explainability.map((reason) => (
                <Badge key={reason} variant="secondary">
                  {decideCopy.reasonLabels[reason]}
                </Badge>
              ))}
            </div>
          </div>

          {recommendation ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">{decideCopy.savingsLabel}</p>
                <p className="text-2xl font-bold text-primary">
                  {recommendation.savingsMin}-{recommendation.savingsMax} kr
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">{decideCopy.timeResultLabel}</p>
                <p className="text-2xl font-bold text-primary">
                  ~{recommendation.timeDays} {decideCopy.daysLabel}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">{decideCopy.impactLabel}</p>
                <p className="text-2xl font-bold text-primary">{formatScore(recommendation.impactScore)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {decideCopy.co2eLabel}: ~{recommendation.co2eSavedMin}-{recommendation.co2eSavedMax} kg
                </p>
                {co2eLinks.length > 0 ? (
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
                ) : null}
              </div>
            </div>
          ) : null}

          {decision.status === "not_fully_feasible" && decision.planB ? (
            <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
              <p className="text-sm font-semibold">{decideCopy.planB.title}</p>
              <p className="text-sm text-muted-foreground">{decideCopy.planB.description}</p>
              {decision.planB.budgetTooLow || decision.planB.timeTooShort ? (
                <p className="text-xs text-muted-foreground">
                  {decision.planB.deltaBudgetNok > 0
                    ? `${decideCopy.feasibilityDeltaBudgetLabel} +${decision.planB.deltaBudgetNok} NOK. `
                    : ""}
                  {decision.planB.deltaTimeDays > 0
                    ? `${decideCopy.feasibilityDeltaTimeLabel} +${decision.planB.deltaTimeDays} ${decideCopy.daysLabel}.`
                    : ""}
                </p>
              ) : null}
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {decideCopy.planB.steps[decision.planB.key].map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{decideCopy.comparisonTitle}</CardTitle>
          <CardDescription>{decideCopy.alternativesTitle}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {decision.options.slice(0, 3).map((option) => {
            const whyNot = getWhyNotReasons(decision, budget, timeDays, option)
            const feasibilityDelta = getFeasibilityDelta(option)

            return (
              <div key={option.type} className="space-y-2 rounded-lg border p-4">
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
                  {decideCopy.timeResultLabel}: ~{option.timeDays} {decideCopy.daysLabel}
                </div>
                <div className="text-sm text-muted-foreground">
                  {decideCopy.impactLabel}: {formatScore(option.impactScore)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {decideCopy.co2eLabel}: ~{option.co2eSavedMin}-{option.co2eSavedMax} kg
                </div>
                {feasibilityDelta ? (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">{decideCopy.feasibilityDeltaLabel}</span> {feasibilityDelta}
                  </div>
                ) : null}
                {whyNot.length > 0 ? (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">{decideCopy.whyNotTitle}</span> {whyNot.join(" · ")}
                  </div>
                ) : null}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </>
  )
}
