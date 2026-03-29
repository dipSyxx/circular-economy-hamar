import { requireAdmin } from "@/lib/auth"
import { listActorCorrectionSuggestions } from "@/lib/admin/corrections"
import { CorrectionSuggestionsPanel } from "@/components/admin/correction-suggestions-panel"

export default async function AdminCorrectionsPage() {
  await requireAdmin()
  const suggestions = await listActorCorrectionSuggestions()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Korrekturforslag</h1>
        <p className="text-muted-foreground">
          Gjennomga brukerforslag, sammenlign patcher og oppdater aktorene med redaksjonell verifisering.
        </p>
      </div>
      <CorrectionSuggestionsPanel initialSuggestions={suggestions} />
    </div>
  )
}
