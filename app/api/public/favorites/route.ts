import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

export async function GET() {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const favorites = await prisma.actorFavorite.findMany({
    where: { userId: user.id },
    select: { actorId: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(favorites)
}

export async function POST(request: Request) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const payload = (await request.json().catch(() => null)) as { actorId?: string } | null
  const actorId = typeof payload?.actorId === "string" ? payload.actorId : ""
  if (!actorId) {
    return jsonError("actorId is required.", 400)
  }

  const actor = await prisma.actor.findUnique({
    where: { id: actorId },
    select: { id: true, status: true },
  })
  if (!actor || actor.status !== "approved") {
    return jsonError("Actor not found.", 404)
  }

  const favorite = await prisma.actorFavorite.upsert({
    where: { userId_actorId: { userId: user.id, actorId } },
    update: {},
    create: { userId: user.id, actorId },
  })

  return NextResponse.json(favorite, { status: 201 })
}
