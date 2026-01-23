import { deleteAdminResource, getAdminResource, updateAdminResource } from "@/app/api/admin/_resource"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  return getAdminResource("detailed-facts", id)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  return updateAdminResource("detailed-facts", id, request)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  return deleteAdminResource("detailed-facts", id)
}