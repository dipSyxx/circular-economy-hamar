import { NextResponse } from "next/server"
import { requireAdminApi } from "@/app/api/admin/_helpers"
import { listAdminVerificationTasks } from "@/lib/admin/verification-tasks"
import type { VerificationDueState, VerificationTaskStatus } from "@/lib/data"

const verificationDueStates = new Set<VerificationDueState>(["healthy", "due_soon", "due", "overdue", "blocked"])
const verificationTaskStatuses = new Set<VerificationTaskStatus>(["open", "snoozed", "resolved"])

export async function GET(request: Request) {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const dueState = searchParams.get("dueState")
  const status = searchParams.get("status")
  const countySlug = searchParams.get("county")
  const pilot = searchParams.get("pilot")

  const tasks = await listAdminVerificationTasks({
    dueState: dueState && verificationDueStates.has(dueState as VerificationDueState)
      ? (dueState as VerificationDueState)
      : null,
    status: status && verificationTaskStatuses.has(status as VerificationTaskStatus)
      ? (status as VerificationTaskStatus)
      : null,
    countySlug: countySlug?.trim() || null,
    pilot:
      pilot === "true"
        ? true
        : pilot === "false"
          ? false
          : null,
  })

  return NextResponse.json({ tasks })
}
