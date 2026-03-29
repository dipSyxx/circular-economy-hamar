import { NextResponse } from "next/server"
import { requireAdminApi } from "@/app/api/admin/_helpers"
import { listActorCorrectionSuggestions } from "@/lib/admin/corrections"

export async function GET(request: Request) {
  const { error } = await requireAdminApi()
  if (error) return error

  const searchParams = new URL(request.url).searchParams
  const status = searchParams.get("status")
  const suggestions = await listActorCorrectionSuggestions(
    status === "pending" || status === "accepted" || status === "rejected" ? status : undefined,
  )
  return NextResponse.json({ suggestions })
}
