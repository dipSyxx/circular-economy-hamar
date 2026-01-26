import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminResourceConfig } from "@/lib/admin/resource-config"
import { requireAdminApi, sanitizePayload } from "@/app/api/admin/_helpers"
import { safeDeleteBlob } from "@/lib/blob"

const getResourceConfig = (resource: string) => adminResourceConfig[resource]

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

  const body = (await request.json()) as Record<string, unknown>
  const data = sanitizePayload(body, { allowId: resource === "users" })

  const model = (prisma as Record<string, any>)[config.model]
  const created = await model.create({ data })
  return NextResponse.json(created, { status: 201 })
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

  const body = (await request.json()) as Record<string, unknown>
  const data = sanitizePayload(body)

  const model = (prisma as Record<string, any>)[config.model]
  const updated = await model.update({
    where: { id },
    data,
  })
  return NextResponse.json(updated)
}

export const deleteAdminResource = async (resource: string, id: string) => {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const config = getResourceConfig(resource)
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  let imageToDelete: string | null = null
  if (resource === "actors") {
    const actor = await prisma.actor.findUnique({ where: { id }, select: { image: true } })
    if (!actor) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    imageToDelete = actor.image
  }

  const model = (prisma as Record<string, any>)[config.model]
  await model.delete({ where: { id } })

  if (imageToDelete) {
    await safeDeleteBlob(imageToDelete)
  }
  return NextResponse.json({ ok: true })
}
