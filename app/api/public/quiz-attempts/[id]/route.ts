import { deletePublicResource, getPublicResource, updatePublicResource } from "@/app/api/public/_resource"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  return getPublicResource("quiz-attempts", id)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  return updatePublicResource("quiz-attempts", id, request)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  return deletePublicResource("quiz-attempts", id)
}