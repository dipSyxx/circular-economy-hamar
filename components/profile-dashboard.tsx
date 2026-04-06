"use client"

import { useEffect, useMemo, useState } from "react"
import { authClient } from "@/lib/auth/client"
import { loadProfile, type ProfileData } from "@/lib/profile-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MyActorsPanel } from "@/components/my-actors-panel"
import { MyFavoritesPanel } from "@/components/my-favorites-panel"
import { profileCopy } from "@/content/no"

export function ProfileDashboard() {
  const { data } = authClient.useSession()
  const isSignedIn = Boolean(data?.session)
  const [profile, setProfile] = useState<ProfileData | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!isSignedIn) {
        if (active) setProfile(loadProfile())
        return
      }

      try {
        const response = await fetch("/api/user/profile-summary", { cache: "no-store" })
        if (!response.ok) throw new Error("Kunne ikke hente profil.")
        const nextProfile = (await response.json()) as ProfileData
        if (active) setProfile(nextProfile)
      } catch {
        if (active) setProfile(loadProfile())
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [isSignedIn])

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
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="space-y-1 p-3.5 md:p-4">
            <CardDescription>{profileCopy.stats.scoreLabel}</CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{stats.score}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1 p-3.5 md:p-4">
            <CardDescription>{profileCopy.stats.streakLabel}</CardDescription>
            <CardTitle className="text-xl sm:text-2xl">
              {stats.streakDays} {profileCopy.stats.daysLabel}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1 p-3.5 md:p-4">
            <CardDescription>{profileCopy.stats.decisionsLabel}</CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{stats.decisionsCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="space-y-1 p-3.5 md:p-4">
            <CardDescription>{profileCopy.stats.challengesLabel}</CardDescription>
            <CardTitle className="text-xl sm:text-2xl">{stats.challengesCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-1 p-4 md:p-6">
            <CardTitle>{profileCopy.sections.recentDecisionsTitle}</CardTitle>
            <CardDescription>{profileCopy.sections.recentDecisionsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 md:p-6 md:pt-0">
            {decisions.length === 0 && (
              <p className="text-sm text-muted-foreground">{profileCopy.sections.emptyDecisions}</p>
            )}
            {decisions.map((decision) => (
              <div key={decision.id} className="space-y-2 rounded-xl border p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 font-semibold">
                    {profileCopy.itemLabels[decision.itemType] ?? decision.itemType} -{" "}
                    {profileCopy.problemLabels[decision.problemType] ?? decision.problemType}
                  </div>
                  <Badge>
                    {profileCopy.recommendationLabels[decision.recommendation] ?? decision.recommendation}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span>{profileCopy.metaLabels.impactLabel}: {decision.impactScore}</span>
                  <span>{profileCopy.metaLabels.savingsLabel}: {decision.savingsMin}-{decision.savingsMax} kr</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(decision.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1 p-4 md:p-6">
            <CardTitle>{profileCopy.sections.recentActionsTitle}</CardTitle>
            <CardDescription>{profileCopy.sections.recentActionsDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 md:p-6 md:pt-0">
            {actions.length === 0 && (
              <p className="text-sm text-muted-foreground">{profileCopy.sections.emptyActions}</p>
            )}
            {actions.map((action) => (
              <div key={action.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{profileCopy.actionLabels[action.type] ?? action.type}</p>
                  <p className="text-xs text-muted-foreground">{new Date(action.createdAt).toLocaleString()}</p>
                </div>
                <Badge variant="secondary">+{action.points}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <MyFavoritesPanel />

      <MyActorsPanel />
    </div>
  )
}
