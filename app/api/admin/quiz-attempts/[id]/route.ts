import { deleteAdminResource, getAdminResource, updateAdminResource } from "@/app/api/admin/_resource"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return getAdminResource("quiz-attempts", params.id)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return updateAdminResource("quiz-attempts", params.id, request)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return deleteAdminResource("quiz-attempts", params.id)
}
