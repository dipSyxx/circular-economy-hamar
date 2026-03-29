import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

type ImportedProfile = {
  score?: number
  streakDays?: number
  lastActionDate?: string
  completedChallenges?: string[]
  decisionHistory?: Array<{
    id: string
    createdAt: string
    itemType: string
    problemType: string
    recommendation: string
    budgetNok: number
    timeDays: number
    priority?: string
    status?: string
    confidence?: string
    recommendedFeasible?: boolean
    bestFeasibleOption?: string | null
    modelRepairabilityScore?: number
    impactScore: number
    savingsMin: number
    savingsMax: number
    co2eSavedMin?: number
    co2eSavedMax?: number
    explainability?: unknown[]
    options?: unknown[]
    planB?: Record<string, unknown> | null
  }>
  actions?: Array<{
    id: string
    type: string
    createdAt: string
    meta?: Record<string, string>
    points: number
  }>
}

const parseDate = (value?: string) => {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const asJsonValue = (value: unknown) =>
  value === undefined ? undefined : (value as Prisma.InputJsonValue)

export async function POST(request: Request) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const payload = (await request.json().catch(() => null)) as ImportedProfile | null
  if (!payload) return jsonError("Invalid payload", 400)

  const lastActionDate = parseDate(payload.lastActionDate)
  const completedKeys = payload.completedChallenges ?? []
  const challengeMap = new Map(
    (
      await prisma.challenge.findMany({
        where: { key: { in: completedKeys } },
        select: { id: true, key: true, points: true },
      })
    ).map((challenge) => [challenge.key, challenge]),
  )

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      score: Math.max(0, payload.score ?? 0),
      streakDays: Math.max(0, payload.streakDays ?? 0),
      lastActionDate,
    },
    update: {
      score: { set: Math.max(0, payload.score ?? 0) },
      streakDays: { set: Math.max(0, payload.streakDays ?? 0) },
      lastActionDate,
    },
  })

  if ((payload.actions ?? []).length > 0) {
    await prisma.userAction.createMany({
      data: payload.actions!.map((action) => ({
        id: action.id,
        userId: user.id,
        type: action.type as never,
        points: action.points,
        meta: action.meta ?? undefined,
        createdAt: parseDate(action.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })
  }

  if ((payload.decisionHistory ?? []).length > 0) {
    await prisma.decision.createMany({
      data: payload.decisionHistory!.map((decision) => ({
        id: decision.id,
        userId: user.id,
        itemType: decision.itemType as never,
        problemType: decision.problemType as never,
        recommendation: decision.recommendation as never,
        priority: (decision.priority as never) ?? undefined,
        status: (decision.status as never) ?? undefined,
        confidence: (decision.confidence as never) ?? undefined,
        recommendedFeasible: decision.recommendedFeasible,
        bestFeasibleOption: (decision.bestFeasibleOption as never) ?? undefined,
        budgetNok: decision.budgetNok,
        timeDays: decision.timeDays,
        modelRepairabilityScore: decision.modelRepairabilityScore,
        impactScore: decision.impactScore,
        savingsMin: decision.savingsMin,
        savingsMax: decision.savingsMax,
        co2eSavedMin: decision.co2eSavedMin,
        co2eSavedMax: decision.co2eSavedMax,
        explainability: asJsonValue(decision.explainability),
        options: asJsonValue(decision.options),
        planB: asJsonValue(decision.planB),
        createdAt: parseDate(decision.createdAt) ?? new Date(),
      })),
      skipDuplicates: true,
    })
  }

  for (const challengeKey of completedKeys) {
    const challenge = challengeMap.get(challengeKey)
    if (!challenge) continue
    await prisma.challengeCompletion.upsert({
      where: { userId_challengeId: { userId: user.id, challengeId: challenge.id } },
      update: {},
      create: {
        userId: user.id,
        challengeId: challenge.id,
        points: challenge.points,
      },
    })
  }

  return NextResponse.json({ ok: true })
}
