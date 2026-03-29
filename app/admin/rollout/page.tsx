import { requireAdmin } from "@/lib/auth"
import { RolloutBoard } from "@/components/admin/rollout-board"
import { listCountyRolloutStatuses } from "@/lib/admin/rollout-status"

export default async function AdminRolloutPage() {
  await requireAdmin()
  const statuses = await listCountyRolloutStatuses()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Nationwide rollout board</h1>
        <p className="text-muted-foreground">
          Operasjonell fylkesoversikt med stage, prioritet, coverage targets, county workflow og siste importpavirkning.
        </p>
      </div>
      <RolloutBoard initialStatuses={statuses} />
    </div>
  )
}
