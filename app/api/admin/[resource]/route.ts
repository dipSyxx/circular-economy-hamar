import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

type RouteParams = {
  params: Promise<{
    resource: string
  }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { resource } = await params
  return listAdminResource(resource)
}

export async function POST(request: Request, { params }: RouteParams) {
  const { resource } = await params
  return createAdminResource(resource, request)
}

