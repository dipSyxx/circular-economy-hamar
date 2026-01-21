import {
  deletePublicResource,
  getPublicResource,
  updatePublicResource,
} from "@/app/api/public/_resource"

type RouteParams = {
  params: {
    resource: string
    id: string
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  return getPublicResource(params.resource, params.id)
}

export async function PATCH(request: Request, { params }: RouteParams) {
  return updatePublicResource(params.resource, params.id, request)
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  return deletePublicResource(params.resource, params.id)
}
