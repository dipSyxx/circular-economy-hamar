import { deleteAdminResource, getAdminResource, updateAdminResource } from "@/app/api/admin/_resource"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return getAdminResource("user-profiles", params.id)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return updateAdminResource("user-profiles", params.id, request)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return deleteAdminResource("user-profiles", params.id)
}
