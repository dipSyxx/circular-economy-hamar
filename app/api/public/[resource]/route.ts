import { listPublicResource, createPublicResource } from "@/app/api/public/_resource"

type RouteParams = {
  params: {
    resource: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  return listPublicResource(params.resource, request)
}

export async function POST(request: Request, { params }: RouteParams) {
  return createPublicResource(params.resource, request)
}
