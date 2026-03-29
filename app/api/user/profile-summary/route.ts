import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

export async function GET() {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const [profile, actions, decisions, completions] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: user.id } }),
    prisma.userAction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.decision.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.challengeCompletion.findMany({
      where: { userId: user.id },
      include: { challenge: { select: { key: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return NextResponse.json({
    score: profile?.score ?? 0,
    streakDays: profile?.streakDays ?? 0,
    lastActionDate: profile?.lastActionDate ? profile.lastActionDate.toISOString().slice(0, 10) : undefined,
    completedChallenges: completions.map((completion) => completion.challenge.key),
    decisionHistory: decisions.map((decision) => ({
      id: decision.id,
      createdAt: decision.createdAt.toISOString(),
      itemType: decision.itemType,
      problemType: decision.problemType,
      recommendation: decision.recommendation,
      budgetNok: decision.budgetNok,
      timeDays: decision.timeDays,
      priority: decision.priority ?? undefined,
      status: decision.status ?? undefined,
      confidence: decision.confidence ?? undefined,
      recommendedFeasible: decision.recommendedFeasible ?? undefined,
      bestFeasibleOption: decision.bestFeasibleOption ?? undefined,
      modelRepairabilityScore: decision.modelRepairabilityScore ?? undefined,
      impactScore: decision.impactScore,
      savingsMin: decision.savingsMin,
      savingsMax: decision.savingsMax,
      co2eSavedMin: decision.co2eSavedMin ?? undefined,
      co2eSavedMax: decision.co2eSavedMax ?? undefined,
      explainability: (decision.explainability as unknown[] | null) ?? undefined,
      options: (decision.options as unknown[] | null) ?? undefined,
      planB: (decision.planB as Record<string, unknown> | null) ?? undefined,
    })),
    actions: actions.map((action) => ({
      id: action.id,
      type: action.type,
      createdAt: action.createdAt.toISOString(),
      meta: (action.meta as Record<string, string> | null) ?? undefined,
      points: action.points,
    })),
  })
}
