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
  const { id, resource } = await Promise.resolve(params)
  return getPublicResource(resource, id)
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, resource } = await Promise.resolve(params)
  return updatePublicResource(resource, id, request)
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, resource } = await Promise.resolve(params)
  return deletePublicResource(resource, id)
}
