import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { prepareActorPersistData } from "@/lib/actor-write"
import { validateActorSubmission, type SubmissionPayload } from "@/lib/actor-submissions"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

export async function POST(request: Request) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

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

  const existing = await prisma.actor.findUnique({ where: { slug: validated.value.actorData.slug } })
  if (existing) {
    return jsonError("Denne sluggen er allerede i bruk.", 409)
  }

  try {
    const createdActor = await prisma.$transaction(async (tx) => {
      const prepared = await prepareActorPersistData(tx, validated.value.actorData)
      const actor = await tx.actor.create({
        data: {
          ...prepared.actorData,
          status: "pending",
          verificationStatus: "unverified",
          verifiedAt: null,
          createdById: user.id,
          reviewedById: null,
          reviewedAt: null,
        },
      })

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

      await tx.actorSource.createMany({
        data: validated.value.sources.map((source) => ({
          actorId: actor.id,
          ...source,
        })),
      })

      return actor
    })

    revalidateTag("public-actors", "max")
    return NextResponse.json({ actor: createdActor }, { status: 201 })
  } catch (submissionError) {
    if (submissionError instanceof Error && submissionError.message.includes("Unique constraint failed")) {
      return jsonError("Denne sluggen er allerede i bruk.", 409)
    }
    return jsonError(
      submissionError instanceof Error ? submissionError.message : "Kunne ikke sende inn aktor.",
      400,
    )
  }
}
