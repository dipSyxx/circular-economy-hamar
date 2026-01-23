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
  const { id, resource } = await Promise.resolve(params)
  return getAdminResource(resource, id)
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, resource } = await Promise.resolve(params)
  return updateAdminResource(resource, id, request)
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, resource } = await Promise.resolve(params)
  return deleteAdminResource(resource, id)
}
