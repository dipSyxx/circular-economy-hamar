import { deletePublicResource, getPublicResource, updatePublicResource } from "@/app/api/public/_resource"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  return getPublicResource("detailed-fact-sources", params.id)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  return updatePublicResource("detailed-fact-sources", params.id, request)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  return deletePublicResource("detailed-fact-sources", params.id)
}