import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminResourceConfig } from "@/lib/admin/resource-config"
import { requireAdminApi, sanitizePayload } from "@/app/api/admin/_helpers"

type RouteParams = {
  params: {
    resource: string
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
  const items = await model.findMany({ orderBy: config.orderBy })
  return NextResponse.json(items)
}

export async function POST(request: Request, { params }: RouteParams) {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const config = getResourceConfig(params.resource)
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  const body = (await request.json()) as Record<string, unknown>
  const data = sanitizePayload(body)

  const model = (prisma as Record<string, any>)[config.model]
  const created = await model.create({ data })
  return NextResponse.json(created, { status: 201 })
}
