import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { publicResourceConfig, publicResourceUtils } from "@/lib/public/resource-config"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"

type RouteParams = {
  params: {
    resource: string
  }
}

const getConfig = (resource: string) => publicResourceConfig[resource]

const isPublicReadAllowed = (config: typeof publicResourceConfig[string]) =>
  Boolean(config.allowUnauthenticatedRead)

export async function GET(request: Request, { params }: RouteParams) {
  const config = getConfig(params.resource)
  if (!config) return jsonError("Unknown resource", 404)

  const requiresAuth = !isPublicReadAllowed(config)
  const { user, error } = await getPublicUser(requiresAuth || Boolean(config.readUsesUser))
  if (error) return error

  const url = new URL(request.url)
  const where = config.listWhere?.({ userId: user?.id ?? null, searchParams: url.searchParams }) ?? {}

  const model = (prisma as Record<string, any>)[config.model]
  const items = await model.findMany({ where, orderBy: config.orderBy })
  return NextResponse.json(items)
}

export async function POST(request: Request, { params }: RouteParams) {
  const config = getConfig(params.resource)
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
