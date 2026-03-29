import { requireAdmin } from "@/lib/auth"
import { getCountyRolloutWorkflow } from "@/lib/admin/rollout-status"
import { listActorImportBatches } from "@/lib/admin/imports"
import { ImportsPanel } from "@/components/admin/imports-panel"

export default async function AdminImportsPage({
  searchParams,
}: {
  searchParams: Promise<{ county?: string }>
}) {
  await requireAdmin()
  const { county } = await searchParams

  const [batches, countyWorkflow] = await Promise.all([
    listActorImportBatches(),
    county ? getCountyRolloutWorkflow(county) : Promise.resolve(null),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">CSV imports</h1>
        <p className="text-muted-foreground">
          Preview, valider og bruk batch-importer for a skalere katalogen pa tvers av fylker og kommuner.
        </p>
      </div>
      <ImportsPanel initialBatches={batches} countyWorkflow={countyWorkflow} />
    </div>
  )
}
