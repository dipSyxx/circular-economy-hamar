"use client"

import { useEffect, useMemo, useState } from "react"
import { challenges } from "@/lib/data"
import { completeChallenge, loadProfile, type ProfileData } from "@/lib/profile-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { challengesCopy } from "@/content/no"

export function ChallengesBoard() {
  const [profile, setProfile] = useState<ProfileData | null>(null)

  useEffect(() => {
    setProfile(loadProfile())
  }, [])

  const completed = useMemo(() => new Set(profile?.completedChallenges ?? []), [profile])
  const completedCount = completed.size

  const handleComplete = (challengeId: string, points: number) => {
    const nextProfile = completeChallenge(challengeId, points)
    setProfile(nextProfile)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{challengesCopy.stats.scoreLabel}</CardDescription>
            <CardTitle>{profile?.score ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{challengesCopy.stats.streakLabel}</CardDescription>
            <CardTitle>
              {profile?.streakDays ?? 0} {challengesCopy.stats.daysLabel}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{challengesCopy.stats.completedLabel}</CardDescription>
            <CardTitle>
              {completedCount} / {challenges.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {challenges.map((challenge) => {
          const isDone = completed.has(challenge.id)
          return (
            <Card key={challenge.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  <Badge variant={isDone ? "secondary" : "default"}>
                    {isDone ? challengesCopy.doneLabel : `+${challenge.points}`}
                  </Badge>
                </div>
                <CardDescription>{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant="outline">{challenge.category}</Badge>
                <Button
                  size="sm"
                  disabled={isDone}
                  onClick={() => handleComplete(challenge.id, challenge.points)}
                >
                  {isDone ? challengesCopy.doneLabel : challengesCopy.markCompleteLabel}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
