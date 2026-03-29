import { NextResponse } from "next/server"
import { requireAdminApi } from "@/app/api/admin/_helpers"
import { updateVerificationTaskStatus } from "@/lib/admin/verification-tasks"

type TaskUpdateBody = {
  action?: unknown
  snoozeUntil?: unknown
  note?: unknown
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const body = (await request.json().catch(() => ({}))) as TaskUpdateBody
  if (body.action !== "snooze" && body.action !== "resolve") {
    return NextResponse.json({ error: "action ma vaere snooze eller resolve." }, { status: 400 })
  }

  const { id } = await params

  try {
    const task = await updateVerificationTaskStatus(id, {
      action: body.action,
      snoozeUntil:
        body.action === "snooze" && typeof body.snoozeUntil === "string" && body.snoozeUntil
          ? new Date(body.snoozeUntil)
          : null,
      note: typeof body.note === "string" ? body.note.trim() : null,
      resolvedById: auth.user.id,
    })

    return NextResponse.json({ task })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Kunne ikke oppdatere verification task.",
      },
      { status: 400 },
    )
  }
}
