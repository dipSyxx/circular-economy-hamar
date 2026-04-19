import { ActorSubmissionDialog } from "@/components/actor-submission-dialog"
import { ActorsExplorer } from "@/components/actors-explorer"
import { Badge } from "@/components/ui/badge"
import { pageCopy } from "@/content/no"
import { getBrowseResponse } from "@/lib/actors/browse-query"
import { parseActorBrowseFilters, searchParamsFromObject } from "@/lib/actors/search-params"

type ActorsPageProps = {
  searchParams: Promise<{
    q?: string | string[]
    category?: string | string[]
    county?: string | string[]
    municipality?: string | string[]
  }>
}

export default async function ActorsPage({ searchParams }: ActorsPageProps) {
  const resolvedSearchParams = await searchParams
  const initialFilters = parseActorBrowseFilters(searchParamsFromObject(resolvedSearchParams), { pageSize: 24 })
  const initialData = await getBrowseResponse(initialFilters)

  return (
    <div>
      <section className="bg-muted/30 py-6 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl rounded-[28px] border border-border/60 bg-background/80 p-5 shadow-sm md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <div className="space-y-4 md:space-y-5">
              <div className="space-y-2.5 md:space-y-3">
                <h1 className="text-3xl font-bold sm:text-4xl">{pageCopy.actors.title}</h1>
                <p className="text-base text-muted-foreground sm:text-lg">{pageCopy.actors.description}</p>
              </div>

              <div className="sm:hidden -mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
                <div className="flex w-max gap-2 pr-5">
                  {pageCopy.actors.badges.map((badge) => (
                    <Badge key={badge} variant="secondary" className="shrink-0">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="hidden flex-wrap gap-2 sm:flex">
                {pageCopy.actors.badges.map((badge) => (
                  <Badge key={badge} variant="secondary">
                    {badge}
                  </Badge>
                ))}
              </div>

              <div className="grid gap-2.5 sm:flex sm:items-center sm:gap-3">
                <ActorSubmissionDialog triggerClassName="w-full sm:w-auto" />
                <span className="text-sm text-muted-foreground">
                  Foreslå en ny aktør som bør være med i oversikten.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 md:py-12">
        <div className="container mx-auto px-4">
          <ActorsExplorer
            initialData={initialData}
            initialFilters={initialFilters}
            enableGeographyFilters
            syncToUrl
          />
        </div>
      </section>
    </div>
  )
}
