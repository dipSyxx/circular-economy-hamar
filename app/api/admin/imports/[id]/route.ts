import { NextResponse } from "next/server"
import { requireAdminApi } from "@/app/api/admin/_helpers"
import { getActorImportBatchDetails } from "@/lib/admin/imports"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdminApi()
  if (error) return error

  const { id } = await params
  const batch = await getActorImportBatchDetails(id)
  if (!batch) {
    return NextResponse.json({ error: "Import batch ikke funnet." }, { status: 404 })
  }

  return NextResponse.json(batch)
}
