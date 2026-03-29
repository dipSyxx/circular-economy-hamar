import { NextResponse } from "next/server"
import { refreshAllAutomationState } from "@/lib/admin/automation"

const isAuthorized = (request: Request) => {
  const expectedSecret = process.env.AUTOMATION_CRON_SECRET ?? process.env.CRON_SECRET
  if (!expectedSecret) {
    return false
  }

  const authorization = request.headers.get("authorization")
  return authorization === `Bearer ${expectedSecret}`
}

const handleRefresh = async (request: Request) => {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await refreshAllAutomationState()
  return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() })
}

export async function GET(request: Request) {
  return handleRefresh(request)
}

export async function POST(request: Request) {
  return handleRefresh(request)
}
