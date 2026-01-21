import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminResourceConfig } from "@/lib/admin/resource-config"
import { requireAdminApi, sanitizePayload } from "@/app/api/admin/_helpers"

type RouteParams = {
  params: {
    resource: string
    id: string
  }
}

const getResourceConfig = (resource: string) => adminResourceConfig[resource]

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const config = getResourceConfig(params.resource)
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  const model = (prisma as Record<string, any>)[config.model]
  const item = await model.findUnique({ where: { id: params.id } })
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(item)
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const config = getResourceConfig(params.resource)
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  const body = (await request.json()) as Record<string, unknown>
  const data = sanitizePayload(body)

  const model = (prisma as Record<string, any>)[config.model]
  const updated = await model.update({
    where: { id: params.id },
    data,
  })
  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const config = getResourceConfig(params.resource)
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  const model = (prisma as Record<string, any>)[config.model]
  await model.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
