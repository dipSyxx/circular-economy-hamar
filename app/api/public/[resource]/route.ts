import { listPublicResource, createPublicResource } from "@/app/api/public/_resource"

type RouteParams = {
  params: {
    resource: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  const { resource } = await Promise.resolve(params)
  return listPublicResource(resource, request)
}

export async function POST(request: Request, { params }: RouteParams) {
  const { resource } = await Promise.resolve(params)
  return createPublicResource(resource, request)
}
