import { requireAdmin } from "@/lib/auth"
import { listActorImportBatches } from "@/lib/admin/imports"
import { ImportsPanel } from "@/components/admin/imports-panel"

export default async function AdminImportsPage() {
  await requireAdmin()
  const batches = await listActorImportBatches()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">CSV imports</h1>
        <p className="text-muted-foreground">
          Preview, valider og bruk batch-importer for a skalere katalogen pa tvers av fylker og kommuner.
        </p>
      </div>
      <ImportsPanel initialBatches={batches} />
    </div>
  )
}
