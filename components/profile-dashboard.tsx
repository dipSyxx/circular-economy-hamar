"use client"

import { useEffect, useMemo, useState } from "react"
import { loadProfile, type ProfileData } from "@/lib/profile-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MyActorsPanel } from "@/components/my-actors-panel"
import { profileCopy } from "@/content/no"

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
            <CardDescription>{profileCopy.stats.scoreLabel}</CardDescription>
            <CardTitle>{stats.score}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{profileCopy.stats.streakLabel}</CardDescription>
            <CardTitle>
              {stats.streakDays} {profileCopy.stats.daysLabel}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{profileCopy.stats.decisionsLabel}</CardDescription>
            <CardTitle>{stats.decisionsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{profileCopy.stats.challengesLabel}</CardDescription>
            <CardTitle>{stats.challengesCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{profileCopy.sections.recentDecisionsTitle}</CardTitle>
            <CardDescription>{profileCopy.sections.recentDecisionsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {decisions.length === 0 && (
              <p className="text-sm text-muted-foreground">{profileCopy.sections.emptyDecisions}</p>
            )}
            {decisions.map((decision) => (
              <div key={decision.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">
                    {profileCopy.itemLabels[decision.itemType] ?? decision.itemType} -{" "}
                    {profileCopy.problemLabels[decision.problemType] ?? decision.problemType}
                  </div>
                  <Badge>
                    {profileCopy.recommendationLabels[decision.recommendation] ?? decision.recommendation}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {profileCopy.metaLabels.impactLabel}: {decision.impactScore} | {profileCopy.metaLabels.savingsLabel}:{" "}
                  {decision.savingsMin}-{decision.savingsMax} kr
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
            <CardTitle>{profileCopy.sections.recentActionsTitle}</CardTitle>
            <CardDescription>{profileCopy.sections.recentActionsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {actions.length === 0 && (
              <p className="text-sm text-muted-foreground">{profileCopy.sections.emptyActions}</p>
            )}
            {actions.map((action) => (
              <div key={action.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{profileCopy.actionLabels[action.type] ?? action.type}</p>
                  <p className="text-xs text-muted-foreground">{new Date(action.createdAt).toLocaleString()}</p>
                </div>
                <Badge variant="secondary">+{action.points}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <MyActorsPanel />
    </div>
  )
}
