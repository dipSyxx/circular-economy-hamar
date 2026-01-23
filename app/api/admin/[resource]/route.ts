import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

type RouteParams = {
  params: {
    resource: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  const { resource } = await Promise.resolve(params)
  return listAdminResource(resource)
}

export async function POST(request: Request, { params }: RouteParams) {
  const { resource } = await Promise.resolve(params)
  return createAdminResource(resource, request)
}
