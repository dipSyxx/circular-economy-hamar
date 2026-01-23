import { deleteAdminResource, getAdminResource, updateAdminResource } from "@/app/api/admin/_resource"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  return getAdminResource("co2e-sources", id)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  return updateAdminResource("co2e-sources", id, request)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  return deleteAdminResource("co2e-sources", id)
}