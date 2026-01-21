import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

type RouteParams = {
  params: {
    resource: string
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  return listAdminResource(params.resource)
}

export async function POST(request: Request, { params }: RouteParams) {
  return createAdminResource(params.resource, request)
}
