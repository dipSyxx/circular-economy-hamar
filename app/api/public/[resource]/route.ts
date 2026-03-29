import { listPublicResource, createPublicResource } from "@/app/api/public/_resource"

type RouteParams = {
  params: Promise<{
    resource: string
  }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { resource } = await params
  return listPublicResource(resource, request)
}

export async function POST(request: Request, { params }: RouteParams) {
  const { resource } = await params
  return createPublicResource(resource, request)
}

