"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { repairData, actors } from "@/lib/data"
import { Wrench, ShoppingBag, ArrowRight, Leaf, Coins, Clock } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { calculatorCopy } from "@/content/no"

type DeviceType = "phone" | "laptop" | "clothing"

type IssueType = string

interface Result {
  recommendation: "repair" | "buy_used" | "recycle"
  title: string
  description: string
  savingsMin: number
  savingsMax: number
  co2Saved: number
  actors: typeof actors
  estimate: typeof repairData.phone.screen
}

export function Calculator() {
  const [deviceType, setDeviceType] = useState<DeviceType | "">("")
  const [issue, setIssue] = useState<IssueType>("")
  const [result, setResult] = useState<Result | null>(null)

  const calculateResult = () => {
    if (!deviceType || !issue) return

    const estimate = repairData[deviceType]?.[issue]
    if (!estimate) return

    const repairCostAvg = (estimate.repairCostMin + estimate.repairCostMax) / 2
    const usedPriceAvg = (estimate.usedPriceMin + estimate.usedPriceMax) / 2

    let recommendation: "repair" | "buy_used" | "recycle"
    let title: string
    let description: string

    if (repairCostAvg < usedPriceAvg * 0.7) {
      recommendation = "repair"
      title = calculatorCopy.decisionCopy.repairTitle
      description = calculatorCopy.decisionCopy.repairDescription.replace(
        "{device}",
        estimate.deviceType.toLowerCase(),
      )
    } else if (repairCostAvg > estimate.newPrice * 0.6) {
      recommendation = "buy_used"
      title = calculatorCopy.decisionCopy.buyUsedTitle
      description = calculatorCopy.decisionCopy.buyUsedDescription
    } else {
      recommendation = "repair"
      title = calculatorCopy.decisionCopy.fallbackTitle
      description = calculatorCopy.decisionCopy.fallbackDescription
    }

    const savingsMin = estimate.newPrice - estimate.repairCostMax
    const savingsMax = estimate.newPrice - estimate.repairCostMin

    const relevantActors = actors.filter((actor) =>
      recommendation === "repair" ? actor.category === "reparasjon" : actor.category === "brukt",
    )

    setResult({
      recommendation,
      title,
      description,
      savingsMin,
      savingsMax,
      co2Saved: estimate.co2Saved,
      actors: relevantActors,
      estimate,
    })
  }

  const reset = () => {
    setDeviceType("")
    setIssue("")
    setResult(null)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  {calculatorCopy.cardTitle}
                </CardTitle>
                <CardDescription>{calculatorCopy.cardDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="device">{calculatorCopy.deviceLabel}</Label>
                  <Select
                    value={deviceType}
                    onValueChange={(value) => {
                      setDeviceType(value as DeviceType)
                      setIssue("")
                    }}
                  >
                    <SelectTrigger id="device">
                      <SelectValue placeholder={calculatorCopy.devicePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {calculatorCopy.deviceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {deviceType && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <Label htmlFor="issue">{calculatorCopy.issueLabel}</Label>
                    <Select value={issue} onValueChange={setIssue}>
                      <SelectTrigger id="issue">
                        <SelectValue placeholder={calculatorCopy.issuePlaceholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {calculatorCopy.issueOptions[deviceType].map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}

                <Button onClick={calculateResult} disabled={!deviceType || !issue} className="w-full" size="lg">
                  {calculatorCopy.actionLabel}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card className={`border-2 ${result.recommendation === "repair" ? "border-primary" : "border-accent"}`}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4">
                  {result.recommendation === "repair" ? (
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Wrench className="h-8 w-8 text-primary" />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-accent-foreground" />
                    </div>
                  )}
                </div>
                <Badge className="mx-auto mb-2" variant={result.recommendation === "repair" ? "default" : "secondary"}>
                  {calculatorCopy.recommendationBadge}
                </Badge>
                <CardTitle className="text-3xl">{result.title}</CardTitle>
                <CardDescription className="text-base">{result.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-lg bg-muted text-center">
                    <Coins className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-primary">
                      {result.savingsMin}-{result.savingsMax} kr
                    </p>
                    <p className="text-sm text-muted-foreground">{calculatorCopy.savingsLabel}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted text-center">
                    <Leaf className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-primary">~{result.co2Saved} kg</p>
                    <p className="text-sm text-muted-foreground">{calculatorCopy.co2Label}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted text-center">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold text-primary">
                      ~{result.estimate.repairDays} dag{result.estimate.repairDays > 1 ? "er" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">{calculatorCopy.timeLabel}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <p className="font-medium">{calculatorCopy.priceComparisonLabel}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{calculatorCopy.priceLabels.repair}</span>
                      <span className="font-medium">
                        {result.estimate.repairCostMin}-{result.estimate.repairCostMax} kr
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{calculatorCopy.priceLabels.used}</span>
                      <span className="font-medium">
                        {result.estimate.usedPriceMin}-{result.estimate.usedPriceMax} kr
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{calculatorCopy.priceLabels.new}</span>
                      <span className="font-medium text-muted-foreground">~{result.estimate.newPrice} kr</span>
                    </div>
                  </div>
                </div>

                {result.actors.length > 0 && (
                  <div>
                    <p className="font-medium mb-3">{calculatorCopy.recommendedActorsLabel}</p>
                    <div className="flex gap-2 flex-wrap">
                      {result.actors.map((actor) => (
                        <Button key={actor.id} asChild variant="outline">
                          <Link href={`/aktorer/${actor.slug}`}>
                            {actor.name}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={reset} variant="ghost" className="w-full">
                  {calculatorCopy.resetLabel}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
