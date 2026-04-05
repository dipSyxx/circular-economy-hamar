import { requireAdmin } from "@/lib/auth"
import { adminActorReviewSelect, buildAdminActorReviewItem } from "@/lib/admin/actor-review"
import { ActorReviewBoard } from "@/components/admin/actor-review-board"
import { VerificationQueuePanel } from "@/components/admin/verification-queue-panel"
import { listAdminVerificationTasks } from "@/lib/admin/verification-tasks"
import { prisma } from "@/lib/prisma"

export default async function AdminActorsReviewPage() {
  await requireAdmin()

  const LIMIT = 500
  const [actors, verificationTasks] = await Promise.all([
    prisma.actor.findMany({
      select: adminActorReviewSelect,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: LIMIT,
    }),
    listAdminVerificationTasks(),
  ])

  const payload = actors.map(buildAdminActorReviewItem)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Aktør review board</h1>
        <p className="text-muted-foreground">
          Se pilotfylker, stale records, manglende kilder og pending public submissions i ett arbeidsbrett.
        </p>
        {actors.length === LIMIT && (
          <p className="text-sm text-amber-600 mt-1">
            Viser de første {LIMIT} aktørene. Bruk filtre for å innsnevre resultatene.
          </p>
        )}
      </div>
      <VerificationQueuePanel initialTasks={verificationTasks} />
      <ActorReviewBoard
        initialActors={payload}
      />
    </div>
  )
}
