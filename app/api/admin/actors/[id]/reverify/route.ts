import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireAdminApi } from "@/app/api/admin/_helpers"
import { adminActorReviewSelect, buildAdminActorReviewItem } from "@/lib/admin/actor-review"
import { refreshAutomationStateForActors } from "@/lib/admin/automation"
import { resolveVerificationTasksForActor } from "@/lib/admin/verification-tasks"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi()
  if ("error" in auth) return auth.error

  const { id } = await params
  const body = (await request.json().catch(() => ({}))) as { reviewNote?: string }
  const reviewedAt = new Date()

  try {
    const updatedActor = await prisma.actor.update({
      where: { id },
      data: {
        verificationStatus: "editorial_verified",
        verifiedAt: reviewedAt,
        reviewedAt,
        reviewedById: auth.user.id,
        ...(body.reviewNote !== undefined ? { reviewNote: body.reviewNote?.trim() || null } : {}),
      },
      select: adminActorReviewSelect,
    })

    await resolveVerificationTasksForActor(id, {
      resolvedById: auth.user.id,
      resolutionNote: "Resolved after manual reverification.",
    })
    await refreshAutomationStateForActors([id], [updatedActor.countySlug ?? ""])

    revalidateTag("public-actors", "max")
    return NextResponse.json({ actor: buildAdminActorReviewItem(updatedActor) })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunne ikke reverifisere aktøren." },
      { status: 400 },
    )
  }
}
