"use client"

import { useEffect, useMemo, useState } from "react"
import { loadProfile, type ProfileData } from "@/lib/profile-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const itemLabels: Record<string, string> = {
  phone: "Phone",
  laptop: "Laptop",
  clothing: "Clothing",
  other: "Other",
}

const problemLabels: Record<string, string> = {
  screen: "Screen",
  battery: "Battery",
  slow: "Slow",
  no_power: "No power",
  water: "Water damage",
  zipper: "Zipper",
  seam: "Seam",
  other: "Other",
}

const recommendationLabels: Record<string, string> = {
  repair: "Repair",
  buy_used: "Buy used",
  donate: "Donate",
  recycle: "Recycle",
}

const actionLabels: Record<string, string> = {
  decision_complete: "Decision completed",
  go_call: "Call actor",
  go_directions: "Open directions",
  go_website: "Open website",
  open_actor: "Open actor page",
  challenge_complete: "Challenge completed",
}

export function ProfileDashboard() {
  const [profile, setProfile] = useState<ProfileData | null>(null)

  useEffect(() => {
    setProfile(loadProfile())
  }, [])

  const decisions = profile?.decisionHistory ?? []
  const actions = profile?.actions ?? []
  const completedChallenges = profile?.completedChallenges ?? []

  const stats = useMemo(
    () => ({
      score: profile?.score ?? 0,
      streakDays: profile?.streakDays ?? 0,
      decisionsCount: decisions.length,
      challengesCount: completedChallenges.length,
    }),
    [profile, decisions.length, completedChallenges.length],
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Score</CardDescription>
            <CardTitle>{stats.score}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Streak</CardDescription>
            <CardTitle>{stats.streakDays} days</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Decisions</CardDescription>
            <CardTitle>{stats.decisionsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Challenges</CardDescription>
            <CardTitle>{stats.challengesCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent decisions</CardTitle>
            <CardDescription>Latest results from the decision engine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {decisions.length === 0 && <p className="text-sm text-muted-foreground">No decisions yet.</p>}
            {decisions.map((decision) => (
              <div key={decision.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">
                    {itemLabels[decision.itemType] ?? decision.itemType} -{" "}
                    {problemLabels[decision.problemType] ?? decision.problemType}
                  </div>
                  <Badge>{recommendationLabels[decision.recommendation] ?? decision.recommendation}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Impact: {decision.impactScore} | Savings: {decision.savingsMin}-{decision.savingsMax} kr
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(decision.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent actions</CardTitle>
            <CardDescription>Tracking activity for streaks and missions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actions.length === 0 && <p className="text-sm text-muted-foreground">No actions yet.</p>}
            {actions.map((action) => (
              <div key={action.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{actionLabels[action.type] ?? action.type}</p>
                  <p className="text-xs text-muted-foreground">{new Date(action.createdAt).toLocaleString()}</p>
                </div>
                <Badge variant="secondary">+{action.points}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
