import {
  deleteAdminResource,
  getAdminResource,
  updateAdminResource,
} from "@/app/api/admin/_resource"

type RouteParams = {
  params: Promise<{
    resource: string
    id: string
  }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id, resource } = await params
  return getAdminResource(resource, id)
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id, resource } = await params
  return updateAdminResource(resource, id, request)
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id, resource } = await params
  return deleteAdminResource(resource, id)
}

