import { NextResponse } from "next/server"
import { requireAdminApi } from "@/app/api/admin/_helpers"
import { createActorImportPreview } from "@/lib/admin/imports"

type PreviewRequestBody = {
  filename?: unknown
  actorsCsv?: unknown
  actorSourcesCsv?: unknown
  actorRepairServicesCsv?: unknown
}

export async function POST(request: Request) {
  const { user, error } = await requireAdminApi()
  if (error) return error

  const body = (await request.json()) as PreviewRequestBody
  if (typeof body.filename !== "string" || !body.filename.trim()) {
    return NextResponse.json({ error: "filename er pakrevd." }, { status: 400 })
  }
  if (typeof body.actorsCsv !== "string" || !body.actorsCsv.trim()) {
    return NextResponse.json({ error: "actorsCsv er pakrevd." }, { status: 400 })
  }

  try {
    const preview = await createActorImportPreview({
      filename: body.filename.trim(),
      actorsCsv: body.actorsCsv,
      actorSourcesCsv: typeof body.actorSourcesCsv === "string" ? body.actorSourcesCsv : undefined,
      actorRepairServicesCsv:
        typeof body.actorRepairServicesCsv === "string" ? body.actorRepairServicesCsv : undefined,
      createdById: user?.id ?? null,
    })

    return NextResponse.json(preview, { status: 201 })
  } catch (requestError) {
    return NextResponse.json(
      {
        error:
          requestError instanceof Error ? requestError.message : "Kunne ikke generere importforhandsvisning.",
      },
      { status: 400 },
    )
  }
}
