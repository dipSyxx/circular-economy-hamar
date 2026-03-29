import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

export async function POST(request: Request) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const payload = (await request.json().catch(() => null)) as { challengeId?: string; points?: number } | null
  const challengeId = payload?.challengeId
  if (!challengeId) return jsonError("challengeId is required.", 400)

  const challenge = await prisma.challenge.findFirst({
    where: {
      OR: [{ id: challengeId }, { key: challengeId }],
    },
    select: { id: true, points: true },
  })
  if (!challenge) return jsonError("Challenge not found.", 404)

  const completion = await prisma.challengeCompletion.upsert({
    where: {
      userId_challengeId: {
        userId: user.id,
        challengeId: challenge.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      challengeId: challenge.id,
      points: payload?.points ?? challenge.points,
    },
  })

  return NextResponse.json(completion, { status: 201 })
}
