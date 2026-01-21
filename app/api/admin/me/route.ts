import { NextResponse } from "next/server"
import { requireAdminApi } from "@/app/api/admin/_helpers"

export async function GET() {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  return NextResponse.json({ ok: true })
}
