import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

export async function GET() {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const actors = await prisma.actor.findMany({
    where: { createdById: user.id },
    include: {
      repairServices: true,
      sources: true,
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json(actors)
}
