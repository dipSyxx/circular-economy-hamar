import {
  deleteAdminResource,
  getAdminResource,
  updateAdminResource,
} from "@/app/api/admin/_resource"

type RouteParams = {
  params: {
    resource: string
    id: string
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  return getAdminResource(params.resource, params.id)
}

export async function PATCH(request: Request, { params }: RouteParams) {
  return updateAdminResource(params.resource, params.id, request)
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  return deleteAdminResource(params.resource, params.id)
}
