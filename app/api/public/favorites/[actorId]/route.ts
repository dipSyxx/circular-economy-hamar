import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

export async function GET(_request: Request, { params }: { params: { actorId: string } }) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const { actorId } = await Promise.resolve(params)
  const favorite = await prisma.actorFavorite.findUnique({
    where: { userId_actorId: { userId: user.id, actorId } },
    select: { actorId: true },
  })

  return NextResponse.json({ favorite: Boolean(favorite) })
}

export async function DELETE(_request: Request, { params }: { params: { actorId: string } }) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const { actorId } = await Promise.resolve(params)

  await prisma.actorFavorite.deleteMany({
    where: { userId: user.id, actorId },
  })

  return NextResponse.json({ ok: true })
}
