import { ActorSubmissionDialog } from "@/components/actor-submission-dialog"
import { ActorsExplorer } from "@/components/actors-explorer"
import { Badge } from "@/components/ui/badge"
import { pageCopy } from "@/content/no"
import { getAvailableCountyOptions, getAvailableMunicipalityOptions } from "@/lib/actor-scope"
import { categoryOrder } from "@/lib/categories"
import { getActors } from "@/lib/public-data"

type ActorsPageProps = {
  searchParams: Promise<{
    q?: string | string[]
    category?: string | string[]
    county?: string | string[]
    municipality?: string | string[]
  }>
}

const pickParam = (value?: string | string[]) => {
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

export default async function ActorsPage({ searchParams }: ActorsPageProps) {
  const resolvedSearchParams = await searchParams
  const actors = await getActors()
  const initialQuery = pickParam(resolvedSearchParams.q).trim()
  const requestedCategory = pickParam(resolvedSearchParams.category).trim()
  const requestedCounty = pickParam(resolvedSearchParams.county).trim()
  const requestedMunicipality = pickParam(resolvedSearchParams.municipality).trim()

  const initialCategory = categoryOrder.includes(requestedCategory as (typeof categoryOrder)[number])
    ? (requestedCategory as (typeof categoryOrder)[number])
    : null
  const initialCounty = getAvailableCountyOptions(actors).some((county) => county.slug === requestedCounty)
    ? requestedCounty
    : null
  const initialMunicipality =
    initialCounty &&
    getAvailableMunicipalityOptions(actors, initialCounty).some(
      (municipality) => municipality.slug === requestedMunicipality,
    )
      ? requestedMunicipality
      : null

  return (
    <div>
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">{pageCopy.actors.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{pageCopy.actors.description}</p>
            <div className="flex flex-wrap gap-2">
              {pageCopy.actors.badges.map((badge) => (
                <Badge key={badge} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ActorSubmissionDialog />
              <span className="text-sm text-muted-foreground">
                Foreslå en ny aktør som bør være med i oversikten.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <ActorsExplorer
            actors={actors}
            enableGeographyFilters
            syncToUrl
            initialQuery={initialQuery}
            initialCategory={initialCategory}
            initialCounty={initialCounty}
            initialMunicipality={initialMunicipality}
          />
        </div>
      </section>
    </div>
  )
}
