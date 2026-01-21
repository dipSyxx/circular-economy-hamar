import { deletePublicResource, getPublicResource, updatePublicResource } from "@/app/api/public/_resource"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return getPublicResource("actor-repair-services", params.id)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return updatePublicResource("actor-repair-services", params.id, request)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return deletePublicResource("actor-repair-services", params.id)
}