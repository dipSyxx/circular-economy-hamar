import { NextResponse } from "next/server"
import { requireAdminApi } from "@/app/api/admin/_helpers"
import { listActorImportBatches } from "@/lib/admin/imports"

export async function GET() {
  const { error } = await requireAdminApi()
  if (error) return error

  const batches = await listActorImportBatches()
  return NextResponse.json({ batches })
}
