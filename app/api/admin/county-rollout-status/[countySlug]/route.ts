import { NextResponse } from "next/server"
import { requireAdminApi } from "@/app/api/admin/_helpers"
import { updateCountyRolloutStatus } from "@/lib/admin/rollout-status"
import type { CountyRolloutStage } from "@/lib/data"

const allowedStages = new Set<CountyRolloutStage>(["pilot", "queued", "in_progress", "ready"])

type CountyRolloutUpdateBody = {
  stage?: unknown
  priority?: unknown
  notes?: unknown
}

export async function PATCH(request: Request, { params }: { params: Promise<{ countySlug: string }> }) {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const body = (await request.json().catch(() => ({}))) as CountyRolloutUpdateBody
  const { countySlug } = await params

  try {
    const status = await updateCountyRolloutStatus(countySlug, {
      stage:
        typeof body.stage === "string" && allowedStages.has(body.stage as CountyRolloutStage)
          ? (body.stage as CountyRolloutStage)
          : undefined,
      priority:
        typeof body.priority === "number"
          ? body.priority
          : typeof body.priority === "string" && body.priority.trim()
            ? Number(body.priority)
            : undefined,
      notes: typeof body.notes === "string" ? body.notes.trim() : body.notes === null ? null : undefined,
    })

    return NextResponse.json({ status })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Kunne ikke oppdatere rolloutstatus.",
      },
      { status: 400 },
    )
  }
}
