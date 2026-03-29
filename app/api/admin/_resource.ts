import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { adminResourceConfig } from "@/lib/admin/resource-config"
import { requireAdminApi, sanitizePayload } from "@/app/api/admin/_helpers"
import {
  assertActorCanAcceptRepairServices,
  assertActorCategorySupportsExistingRepairServices,
  prepareActorPersistData,
} from "@/lib/actor-write"
import { safeDeleteBlob } from "@/lib/blob"
import { refreshAutomationStateForActors, refreshAutomationStateForCounties } from "@/lib/admin/automation"

const getResourceConfig = (resource: string) => adminResourceConfig[resource]

const revalidatePublicResource = (resource: string) => {
  const tagsByResource: Record<string, string[]> = {
    actors: ["public-actors"],
    challenges: ["public-challenges"],
    "quiz-questions": ["public-quiz"],
    "quiz-options": ["public-quiz"],
    "quiz-results": ["public-quiz"],
    "repair-estimates": ["public-repair-data"],
    facts: ["public-facts"],
    "detailed-facts": ["public-detailed-facts"],
    "detailed-fact-sources": ["public-detailed-facts"],
    "co2e-sources": ["public-co2e-sources"],
    "co2e-source-items": ["public-co2e-source-items"],
  }

  for (const tag of tagsByResource[resource] ?? []) {
    revalidateTag(tag, "max")
  }
}

export const listAdminResource = async (resource: string) => {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const config = getResourceConfig(resource)
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  const model = (prisma as Record<string, any>)[config.model]
  const items = await model.findMany({ orderBy: config.orderBy })
  return NextResponse.json(items)
}

export const createAdminResource = async (resource: string, request: Request) => {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const config = getResourceConfig(resource)
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    let data = sanitizePayload(body, { allowId: resource === "users" })
    const affectedActorIds = new Set<string>()
    let affectedCountySlug: string | null = null

    if (resource === "actors") {
      const prepared = await prepareActorPersistData(prisma, data as never)
      data = prepared.actorData
      affectedCountySlug = typeof prepared.actorData.countySlug === "string" ? prepared.actorData.countySlug : null
    }

    if (resource === "actor-repair-services") {
      const actorId = typeof data.actorId === "string" ? data.actorId : ""
      if (!actorId) {
        return NextResponse.json({ error: "actorId er påkrevd." }, { status: 400 })
      }
      await assertActorCanAcceptRepairServices(prisma, actorId)
      affectedActorIds.add(actorId)
    }

    if (resource === "actor-sources") {
      const actorId = typeof data.actorId === "string" ? data.actorId : ""
      if (!actorId) {
        return NextResponse.json({ error: "actorId er påkrevd." }, { status: 400 })
      }
      affectedActorIds.add(actorId)
    }

    const model = (prisma as Record<string, any>)[config.model]
    const created = await model.create({ data })
    if (resource === "actors") {
      affectedActorIds.add(created.id)
      affectedCountySlug = created.countySlug ?? affectedCountySlug
    }
    if (affectedActorIds.size > 0 || affectedCountySlug) {
      await refreshAutomationStateForActors(
        Array.from(affectedActorIds),
        affectedCountySlug ? [affectedCountySlug] : [],
      )
    }
    revalidatePublicResource(resource)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunne ikke opprette ressurs." },
      { status: 400 },
    )
  }
}

export const getAdminResource = async (resource: string, id: string) => {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const config = getResourceConfig(resource)
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  const model = (prisma as Record<string, any>)[config.model]
  const item = await model.findUnique({ where: { id } })
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(item)
}

export const updateAdminResource = async (resource: string, id: string, request: Request) => {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const config = getResourceConfig(resource)
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    let data = sanitizePayload(body)
    const affectedActorIds = new Set<string>()
    const affectedCountySlugs = new Set<string>()

    if (resource === "actors") {
      const existingActor = await prisma.actor.findUnique({ where: { id } })
      if (!existingActor) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      const mergedActor = {
        ...existingActor,
        ...data,
      }
      await assertActorCategorySupportsExistingRepairServices(prisma, id, mergedActor.category)
      const prepared = await prepareActorPersistData(prisma, mergedActor as never)
      data = prepared.actorData
      affectedActorIds.add(id)
      if (existingActor.countySlug) affectedCountySlugs.add(existingActor.countySlug)
      if (typeof prepared.actorData.countySlug === "string") affectedCountySlugs.add(prepared.actorData.countySlug)
    }

    if (resource === "actor-repair-services") {
      const existingRepairService = await prisma.actorRepairService.findUnique({
        where: { id },
        select: { actorId: true },
      })
      if (!existingRepairService) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      await assertActorCanAcceptRepairServices(prisma, existingRepairService.actorId)
      affectedActorIds.add(existingRepairService.actorId)
      if (typeof data.actorId === "string") {
        affectedActorIds.add(data.actorId)
      }
    }

    if (resource === "actor-sources") {
      const existingSource = await prisma.actorSource.findUnique({
        where: { id },
        select: { actorId: true },
      })
      if (!existingSource) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      affectedActorIds.add(existingSource.actorId)
      if (typeof data.actorId === "string") {
        affectedActorIds.add(data.actorId)
      }
    }

    const model = (prisma as Record<string, any>)[config.model]
    const updated = await model.update({
      where: { id },
      data,
    })
    if (resource === "actors") {
      if (updated.countySlug) {
        affectedCountySlugs.add(updated.countySlug)
      }
    }
    if (affectedActorIds.size > 0 || affectedCountySlugs.size > 0) {
      await refreshAutomationStateForActors(
        Array.from(affectedActorIds),
        Array.from(affectedCountySlugs),
      )
    }
    revalidatePublicResource(resource)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunne ikke oppdatere ressurs." },
      { status: 400 },
    )
  }
}

export const deleteAdminResource = async (resource: string, id: string) => {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const config = getResourceConfig(resource)
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  let imageToDelete: string | null = null
  const affectedActorIds = new Set<string>()
  const affectedCountySlugs = new Set<string>()
  if (resource === "actors") {
    const actor = await prisma.actor.findUnique({
      where: { id },
      select: { image: true, countySlug: true },
    })
    if (!actor) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    imageToDelete = actor.image
    if (actor.countySlug) affectedCountySlugs.add(actor.countySlug)
  }

  if (resource === "actor-repair-services") {
    const repairService = await prisma.actorRepairService.findUnique({
      where: { id },
      select: { actorId: true },
    })
    if (!repairService) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    affectedActorIds.add(repairService.actorId)
  }

  if (resource === "actor-sources") {
    const actorSource = await prisma.actorSource.findUnique({
      where: { id },
      select: { actorId: true },
    })
    if (!actorSource) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    affectedActorIds.add(actorSource.actorId)
  }

  const model = (prisma as Record<string, any>)[config.model]
  await model.delete({ where: { id } })
  if (resource === "actors") {
    await refreshAutomationStateForCounties(Array.from(affectedCountySlugs))
  } else if (affectedActorIds.size > 0) {
    await refreshAutomationStateForActors(Array.from(affectedActorIds), Array.from(affectedCountySlugs))
  }
  revalidatePublicResource(resource)

  if (imageToDelete) {
    await safeDeleteBlob(imageToDelete)
  }
  return NextResponse.json({ ok: true })
}
