import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicResourceConfig, publicResourceUtils } from "@/lib/public/resource-config"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

type RouteParams = {
  params: {
    resource: string
    id: string
  }
}

const getConfig = (resource: string) => publicResourceConfig[resource]

const isPublicReadAllowed = (config: typeof publicResourceConfig[string]) =>
  Boolean(config.allowUnauthenticatedRead)

const assertOwner = async (config: typeof publicResourceConfig[string], item: Record<string, any>, userId: string) => {
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

export async function GET(_request: Request, { params }: RouteParams) {
  const config = getConfig(params.resource)
  if (!config) return jsonError("Unknown resource", 404)

  const requiresAuth = !isPublicReadAllowed(config)
  const { user, error } = await getPublicUser(requiresAuth || Boolean(config.readUsesUser))
  if (error) return error

  const where =
    config.detailWhere?.({ userId: user?.id ?? null, id: params.id }) ?? { id: params.id }

  const model = (prisma as Record<string, any>)[config.model]
  const item = await model.findFirst({ where })
  if (!item) return jsonError("Not found", 404)
  return NextResponse.json(item)
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const config = getConfig(params.resource)
  if (!config) return jsonError("Unknown resource", 404)
  if (!config.update) return jsonError("Not allowed", 403)

  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const model = (prisma as Record<string, any>)[config.model]
  const existing = await model.findUnique({ where: { id: params.id } })
  if (!existing) return jsonError("Not found", 404)

  const ownershipError = await assertOwner(config, existing, user.id)
  if (ownershipError) return ownershipError

  const payload = (await request.json()) as Record<string, unknown>
  const data = publicResourceUtils.pickFields(payload, config.update.fields)
  const updateData = config.update.transform ? config.update.transform(data, { userId: user.id }) : data

  const updated = await model.update({ where: { id: params.id }, data: updateData })
  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const config = getConfig(params.resource)
  if (!config) return jsonError("Unknown resource", 404)
  if (!config.remove) return jsonError("Not allowed", 403)

  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const model = (prisma as Record<string, any>)[config.model]
  const existing = await model.findUnique({ where: { id: params.id } })
  if (!existing) return jsonError("Not found", 404)

  const ownershipError = await assertOwner(config, existing, user.id)
  if (ownershipError) return ownershipError

  await model.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
