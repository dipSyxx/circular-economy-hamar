import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import type { ActorCategory, ItemType, ProblemType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { validateRepairServiceAgainstScope } from "@/lib/category-repair-scope"
import { adminResourceConfig } from "@/lib/admin/resource-config"
import { requireAdminApi, sanitizePayload } from "@/app/api/admin/_helpers"
import { parseAdminActorNestedRelations } from "@/lib/admin/actor-create-staging"
import {
  assertActorCanAcceptRepairServices,
  assertActorCategorySupportsExistingRepairServices,
  assertActorRepairServicesMatchCategory,
  prepareActorPersistData,
  replaceActorBrowseScopes,
  replaceActorServiceAreas,
} from "@/lib/actor-write"
import { prepareArticlePersistData } from "@/lib/article-write"
import { safeDeleteBlob } from "@/lib/blob"
import { refreshAutomationStateForActors, refreshAutomationStateForCounties } from "@/lib/admin/automation"

const getResourceConfig = (resource: string) => adminResourceConfig[resource]

const parseRepairServicePriceInput = (priceMinRaw: unknown, priceMaxRaw: unknown) => {
  const priceMin = typeof priceMinRaw === "number" ? priceMinRaw : Number(priceMinRaw)
  const priceMax =
    priceMaxRaw === null || priceMaxRaw === undefined || priceMaxRaw === ""
      ? null
      : typeof priceMaxRaw === "number"
        ? priceMaxRaw
        : Number(priceMaxRaw)

  if (!Number.isFinite(priceMin) || priceMin < 0) {
    return { error: "price_min er påkrevd og må være >= 0." } as const
  }
  if (priceMax !== null && (!Number.isFinite(priceMax) || priceMax < priceMin)) {
    return { error: "price_max må være tom eller >= price_min." } as const
  }

  return { priceMin, priceMax } as const
}

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
    articles: ["public-articles"],
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

    let preparedActor:
      | Awaited<ReturnType<typeof prepareActorPersistData>>
      | undefined

    if (resource === "actors") {
      const actorPayload = { ...data } as Record<string, unknown>
      const nestedRepairs = actorPayload.repairServices
      const nestedSources = actorPayload.sources
      delete actorPayload.repairServices
      delete actorPayload.sources

      preparedActor = await prepareActorPersistData(prisma, actorPayload as never)
      data = preparedActor.actorData
      affectedCountySlug = typeof preparedActor.actorData.countySlug === "string" ? preparedActor.actorData.countySlug : null
    }

    if (resource === "articles") {
      data = prepareArticlePersistData(data as Record<string, unknown>)
    }

    if (resource === "actor-repair-services") {
      const actorId = typeof data.actorId === "string" ? data.actorId : ""
      if (!actorId) {
        return NextResponse.json({ error: "actorId er påkrevd." }, { status: 400 })
      }
      const parsedPrices = parseRepairServicePriceInput(data.priceMin, data.priceMax)
      if ("error" in parsedPrices) {
        return NextResponse.json({ error: parsedPrices.error }, { status: 400 })
      }
      const actor = await assertActorCanAcceptRepairServices(prisma, actorId)
      const problemType = data.problemType as ProblemType
      const itemTypes = Array.isArray(data.itemTypes) ? (data.itemTypes as ItemType[]) : []
      const scopeError = validateRepairServiceAgainstScope(actor.category as ActorCategory, problemType, itemTypes)
      if (scopeError) {
        return NextResponse.json({ error: scopeError }, { status: 400 })
      }
      data.priceMin = parsedPrices.priceMin
      data.priceMax = parsedPrices.priceMax
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

    let created: Record<string, unknown>
    if (resource === "actors" && preparedActor) {
      const nested = parseAdminActorNestedRelations(
        data.category as ActorCategory,
        (body as Record<string, unknown>).repairServices,
        (body as Record<string, unknown>).sources,
      )

      const actorRow = await prisma.$transaction(async (tx) => {
        const actor = await tx.actor.create({
          data: data as never,
        })

        await replaceActorServiceAreas(tx, actor.id, preparedActor.serviceAreaLinks)
        await replaceActorBrowseScopes(tx, actor.id, preparedActor.browseScopes)

        if (nested.repairServices.length > 0) {
          await tx.actorRepairService.createMany({
            data: nested.repairServices.map((service) => ({
              actorId: actor.id,
              problemType: service.problemType,
              itemTypes: service.itemTypes,
              priceMin: service.priceMin,
              priceMax: service.priceMax,
              etaDays: service.etaDays,
            })),
          })
        }

        if (nested.sources.length > 0) {
          await tx.actorSource.createMany({
            data: nested.sources.map((source) => ({
              actorId: actor.id,
              type: source.type,
              title: source.title,
              url: source.url,
              capturedAt: source.capturedAt,
              note: source.note,
            })),
          })
        }

        return actor
      })

      created = actorRow as Record<string, unknown>
      affectedActorIds.add(actorRow.id)
      affectedCountySlug = actorRow.countySlug ?? affectedCountySlug
    } else {
      created = (await model.create({ data })) as Record<string, unknown>
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
    let preparedActorUpdate: Awaited<ReturnType<typeof prepareActorPersistData>> | null = null

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
      await assertActorRepairServicesMatchCategory(prisma, id, mergedActor.category as ActorCategory)
      preparedActorUpdate = await prepareActorPersistData(prisma, mergedActor as never)
      data = preparedActorUpdate.actorData
      affectedActorIds.add(id)
      if (existingActor.countySlug) affectedCountySlugs.add(existingActor.countySlug)
      if (typeof preparedActorUpdate.actorData.countySlug === "string") {
        affectedCountySlugs.add(preparedActorUpdate.actorData.countySlug)
      }
    }

    if (resource === "articles") {
      const existingArticle = await prisma.article.findUnique({ where: { id } })
      if (!existingArticle) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      data = prepareArticlePersistData({
        ...existingArticle,
        ...data,
      })
    }

    if (resource === "actor-repair-services") {
      const existingRepairService = await prisma.actorRepairService.findUnique({
        where: { id },
        select: {
          actorId: true,
          problemType: true,
          itemTypes: true,
          priceMin: true,
          priceMax: true,
        },
      })
      if (!existingRepairService) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      const actor = await assertActorCanAcceptRepairServices(prisma, existingRepairService.actorId)
      const problemType = (data.problemType ?? existingRepairService.problemType) as ProblemType
      const itemTypes = (
        Array.isArray(data.itemTypes) ? data.itemTypes : existingRepairService.itemTypes
      ) as ItemType[]
      const parsedPrices = parseRepairServicePriceInput(
        data.priceMin ?? existingRepairService.priceMin,
        data.priceMax ?? existingRepairService.priceMax,
      )
      if ("error" in parsedPrices) {
        return NextResponse.json({ error: parsedPrices.error }, { status: 400 })
      }
      const scopeError = validateRepairServiceAgainstScope(actor.category as ActorCategory, problemType, itemTypes)
      if (scopeError) {
        return NextResponse.json({ error: scopeError }, { status: 400 })
      }
      data.priceMin = parsedPrices.priceMin
      data.priceMax = parsedPrices.priceMax
      affectedActorIds.add(existingRepairService.actorId)
      delete data.actorId
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
      delete data.actorId
    }

    const model = (prisma as Record<string, any>)[config.model]
    const updated =
      resource === "actors" && preparedActorUpdate
        ? await prisma.$transaction(async (tx) => {
            const actor = await tx.actor.update({
              where: { id },
              data: preparedActorUpdate.actorData,
            })
            await replaceActorServiceAreas(tx, actor.id, preparedActorUpdate.serviceAreaLinks)
            await replaceActorBrowseScopes(tx, actor.id, preparedActorUpdate.browseScopes)
            return actor
          })
        : await model.update({
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
