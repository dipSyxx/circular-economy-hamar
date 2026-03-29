import { NextResponse } from "next/server"
import { requireAdminApi } from "@/app/api/admin/_helpers"
import { listCountyRolloutStatuses } from "@/lib/admin/rollout-status"

export async function GET() {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const statuses = await listCountyRolloutStatuses()
  return NextResponse.json({ statuses })
}
