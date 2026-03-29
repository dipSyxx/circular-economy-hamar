import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { requireAdminApi } from "@/app/api/admin/_helpers"
import { applyActorImportBatch, getActorImportBatchDetails } from "@/lib/admin/imports"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdminApi()
  if (error) return error

  const { id } = await params

  try {
    const batch = await applyActorImportBatch(id, user?.id ?? null)
    revalidateTag("public-actors", "max")
    const details = await getActorImportBatchDetails(batch.id)
    return NextResponse.json(details ?? { batch, rows: [] })
  } catch (applyError) {
    return NextResponse.json(
      {
        error: applyError instanceof Error ? applyError.message : "Kunne ikke bruke import batch.",
      },
      { status: 400 },
    )
  }
}
