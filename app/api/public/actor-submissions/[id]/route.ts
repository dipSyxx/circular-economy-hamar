import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { prepareActorPersistData } from "@/lib/actor-write"
import { validateActorSubmission, type SubmissionPayload } from "@/lib/actor-submissions"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"
import { safeDeleteBlob } from "@/lib/blob"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const { id } = await params
  const existing = await prisma.actor.findUnique({ where: { id } })
  if (!existing) return jsonError("Aktør ikke funnet.", 404)
  if (existing.createdById !== user.id) return jsonError("Forbidden", 403)

  const payload = (await request.json()) as SubmissionPayload

  let validated: ReturnType<typeof validateActorSubmission>
  try {
    validated = validateActorSubmission(payload)
  } catch (validationError) {
    return jsonError(
      validationError instanceof Error ? validationError.message : "Ugyldig innsending.",
      400,
    )
  }

  if (!validated.ok) {
    return jsonError(validated.error, 400)
  }

  const slugOwner = await prisma.actor.findFirst({
    where: { slug: validated.value.actorData.slug, NOT: { id } },
    select: { id: true },
  })
  if (slugOwner) {
    return jsonError("Denne sluggen er allerede i bruk.", 409)
  }

  try {
    const updatedActor = await prisma.$transaction(async (tx) => {
      const prepared = await prepareActorPersistData(tx, validated.value.actorData)
      const actor = await tx.actor.update({
        where: { id },
        data: {
          ...prepared.actorData,
          status: "pending",
          reviewNote: null,
          verificationStatus: "unverified",
          verifiedAt: null,
          reviewedById: null,
          reviewedAt: null,
        },
      })

      await tx.actorRepairService.deleteMany({ where: { actorId: actor.id } })
      await tx.actorServiceArea.deleteMany({ where: { actorId: actor.id } })
      if (validated.value.repairServices.length > 0) {
        await tx.actorRepairService.createMany({
          data: validated.value.repairServices.map((service) => ({
            actorId: actor.id,
            ...service,
          })),
        })
      }

      if (prepared.serviceAreaLinks.length > 0) {
        await tx.actorServiceArea.createMany({
          data: prepared.serviceAreaLinks.map((serviceArea) => ({
            actorId: actor.id,
            countyId: serviceArea.countyId,
            municipalityId: serviceArea.municipalityId,
          })),
        })
      }

      await tx.actorSource.deleteMany({ where: { actorId: actor.id } })
      await tx.actorSource.createMany({
        data: validated.value.sources.map((source) => ({
          actorId: actor.id,
          ...source,
        })),
      })

      return actor
    })

    revalidateTag("public-actors", "max")
    return NextResponse.json({ actor: updatedActor })
  } catch (updateError) {
    if (updateError instanceof Error && updateError.message.includes("Unique constraint failed")) {
      return jsonError("Denne sluggen er allerede i bruk.", 409)
    }
    return jsonError(
      updateError instanceof Error ? updateError.message : "Kunne ikke oppdatere aktor.",
      400,
    )
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const { id } = await params
  const existing = await prisma.actor.findUnique({ where: { id } })
  if (!existing) return jsonError("Aktør ikke funnet.", 404)
  if (existing.createdById !== user.id) return jsonError("Forbidden", 403)

  await prisma.actor.delete({ where: { id } })
  await safeDeleteBlob(existing.image)
  revalidateTag("public-actors", "max")

  return NextResponse.json({ ok: true })
}
