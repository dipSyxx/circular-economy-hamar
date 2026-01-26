import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicResourceConfig, publicResourceUtils } from "@/lib/public/resource-config"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

type PublicConfig = (typeof publicResourceConfig)[string]

const getConfig = (resource: string) => publicResourceConfig[resource]

const isPublicReadAllowed = (config: PublicConfig) => Boolean(config.allowUnauthenticatedRead)

const assertOwner = async (config: PublicConfig, item: Record<string, any>, userId: string) => {
  const ownerCheck = config.update?.ownerCheck ?? config.remove?.ownerCheck
  if (!ownerCheck) return null

  if (ownerCheck.type === "user") {
    if (item[ownerCheck.field] !== userId) {
      return jsonError("Forbidden", 403)
    }
    if (ownerCheck.allowedStatuses?.length && ownerCheck.statusField) {
      if (!ownerCheck.allowedStatuses.includes(item[ownerCheck.statusField])) {
        return jsonError("Forbidden", 403)
      }
    }
    return null
  }

  if (ownerCheck.type === "actor") {
    const actorId = item[ownerCheck.actorIdField]
    if (!actorId) return jsonError("Actor not found", 404)
    const actor = await prisma.actor.findUnique({ where: { id: actorId } })
    if (!actor) return jsonError("Actor not found", 404)
    if (actor.createdById !== userId) {
      return jsonError("Forbidden", 403)
    }
    if (ownerCheck.allowedStatuses?.length) {
      if (!ownerCheck.allowedStatuses.includes(actor.status)) {
        return jsonError("Forbidden", 403)
      }
    }
  }

  return null
}

export const listPublicResource = async (resource: string, request: Request) => {
  const config = getConfig(resource)
  if (!config) return jsonError("Unknown resource", 404)

  const requiresAuth = !isPublicReadAllowed(config)
  const { user, error } = await getPublicUser(requiresAuth)
  if (error) return error

  const url = new URL(request.url)
  const where = config.listWhere?.({ userId: user?.id ?? null, searchParams: url.searchParams }) ?? {}

  const model = (prisma as Record<string, any>)[config.model]
  const items = await model.findMany({ where, orderBy: config.orderBy })
  return NextResponse.json(items)
}

export const createPublicResource = async (resource: string, request: Request) => {
  const config = getConfig(resource)
  if (!config) return jsonError("Unknown resource", 404)
  if (!config.create) return jsonError("Not allowed", 403)

  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const payload = (await request.json()) as Record<string, unknown>
  const data = publicResourceUtils.pickFields(payload, config.create.fields)
  const createdData = config.create.transform ? config.create.transform(data, { userId: user.id }) : data

  if (config.create.ownerCheck?.type === "actor") {
    const actorId = createdData[config.create.ownerCheck.actorIdField]
    if (!actorId || typeof actorId !== "string") return jsonError("actorId is required", 400)
    const actor = await prisma.actor.findUnique({ where: { id: actorId } })
    if (!actor) return jsonError("Actor not found", 404)
    if (actor.createdById !== user.id) return jsonError("Forbidden", 403)
    if (config.create.ownerCheck.allowedStatuses?.length) {
      if (!config.create.ownerCheck.allowedStatuses.includes(actor.status)) {
        return jsonError("Forbidden", 403)
      }
    }
  }

  if (config.create.ownerCheck?.type === "user") {
    createdData[config.create.ownerCheck.field] = user.id
  }

  const model = (prisma as Record<string, any>)[config.model]
  const created = await model.create({ data: createdData })
  return NextResponse.json(created, { status: 201 })
}

export const getPublicResource = async (resource: string, id: string) => {
  const config = getConfig(resource)
  if (!config) return jsonError("Unknown resource", 404)

  const requiresAuth = !isPublicReadAllowed(config)
  const { user, error } = await getPublicUser(requiresAuth)
  if (error) return error

  const where = config.detailWhere?.({ userId: user?.id ?? null, id }) ?? { id }

  const model = (prisma as Record<string, any>)[config.model]
  const item = await model.findFirst({ where })
  if (!item) return jsonError("Not found", 404)
  return NextResponse.json(item)
}

export const updatePublicResource = async (resource: string, id: string, request: Request) => {
  const config = getConfig(resource)
  if (!config) return jsonError("Unknown resource", 404)
  if (!config.update) return jsonError("Not allowed", 403)

  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const model = (prisma as Record<string, any>)[config.model]
  const existing = await model.findUnique({ where: { id } })
  if (!existing) return jsonError("Not found", 404)

  const ownershipError = await assertOwner(config, existing, user.id)
  if (ownershipError) return ownershipError

  const payload = (await request.json()) as Record<string, unknown>
  const data = publicResourceUtils.pickFields(payload, config.update.fields)
  const updateData = config.update.transform ? config.update.transform(data, { userId: user.id }) : data

  const updated = await model.update({ where: { id }, data: updateData })
  return NextResponse.json(updated)
}

export const deletePublicResource = async (resource: string, id: string) => {
  const config = getConfig(resource)
  if (!config) return jsonError("Unknown resource", 404)
  if (!config.remove) return jsonError("Not allowed", 403)

  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const model = (prisma as Record<string, any>)[config.model]
  const existing = await model.findUnique({ where: { id } })
  if (!existing) return jsonError("Not found", 404)

  const ownershipError = await assertOwner(config, existing, user.id)
  if (ownershipError) return ownershipError

  await model.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
