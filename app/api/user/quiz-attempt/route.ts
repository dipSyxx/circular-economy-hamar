import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

export async function POST(request: Request) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const payload = (await request.json().catch(() => null)) as {
    score?: number
    maxScore?: number
    level?: string
    answers?: unknown
  } | null

  if (!payload?.level || payload.score === undefined || payload.maxScore === undefined) {
    return jsonError("Invalid payload", 400)
  }

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      score: payload.score,
      maxScore: payload.maxScore,
      level: payload.level as never,
      answers: payload.answers ?? undefined,
    },
  })

  return NextResponse.json(attempt, { status: 201 })
}
