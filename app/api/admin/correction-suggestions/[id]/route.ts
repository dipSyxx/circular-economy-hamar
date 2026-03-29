import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { requireAdminApi } from "@/app/api/admin/_helpers"
import { getActorCorrectionSuggestion, reviewActorCorrectionSuggestion } from "@/lib/admin/corrections"

type ReviewRequestBody = {
  status?: unknown
  reviewNote?: unknown
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdminApi()
  if (error) return error

  const { id } = await params
  const suggestion = await getActorCorrectionSuggestion(id)
  if (!suggestion) {
    return NextResponse.json({ error: "Forslaget ble ikke funnet." }, { status: 404 })
  }

  return NextResponse.json({ suggestion })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAdminApi()
  if (error) return error

  const body = (await request.json()) as ReviewRequestBody
  if (body.status !== "accepted" && body.status !== "rejected") {
    return NextResponse.json({ error: "status må være accepted eller rejected." }, { status: 400 })
  }

  const { id } = await params

  try {
    const suggestion = await reviewActorCorrectionSuggestion(id, {
      status: body.status,
      reviewNote: typeof body.reviewNote === "string" ? body.reviewNote.trim() : null,
      reviewedById: user?.id ?? null,
    })
    revalidateTag("public-actors", "max")
    return NextResponse.json({ suggestion })
  } catch (reviewError) {
    return NextResponse.json(
      {
        error: reviewError instanceof Error ? reviewError.message : "Kunne ikke gjennomga forslaget.",
      },
      { status: 400 },
    )
  }
}
