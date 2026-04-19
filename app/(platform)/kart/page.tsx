import { ListChecks, MapPin, Route } from "lucide-react"
import { pageCopy } from "@/content/no"
import { MapClient } from "@/components/map-client"
import { Badge } from "@/components/ui/badge"
import { getActorMapSummary } from "@/lib/actors/map-query"
import { parseActorBrowseFilters, searchParamsFromObject } from "@/lib/actors/search-params"

type MapPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function MapPage({ searchParams }: MapPageProps) {
  const summary = await getActorMapSummary()
  const resolvedSearchParams = await searchParams
  const initialFilters = parseActorBrowseFilters(searchParamsFromObject(resolvedSearchParams ?? {}), {
    pageSize: 20,
  })
  const statsText = pageCopy.map.statsTemplate.replace("{count}", String(summary.plottedCount))
  const hintItems = [
    { icon: ListChecks, text: pageCopy.map.hintFilters },
    { icon: MapPin, text: pageCopy.map.hintMarkers },
    { icon: Route, text: pageCopy.map.hintRoute },
  ]

  return (
    <div>
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-muted/40 via-muted/25 to-background py-7 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl space-y-3 md:space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {statsText}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{pageCopy.map.title}</h1>
            <p className="text-[15px] leading-7 text-muted-foreground sm:text-lg">{pageCopy.map.description}</p>

            <div className="sm:hidden -mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
              <div className="flex w-max gap-2 pr-4">
                {hintItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.text}
                      className="flex min-w-[15rem] shrink-0 gap-2 rounded-xl border border-border/60 bg-card/60 px-3 py-2.5 text-sm text-muted-foreground"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span>{item.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <ul className="hidden gap-3 text-sm text-muted-foreground sm:grid sm:grid-cols-3">
              {hintItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.text} className="flex gap-2 rounded-lg border border-border/60 bg-card/50 px-3 py-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{item.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-3 md:py-8">
        <div className="container mx-auto px-4">
          <MapClient initialSummary={summary} initialFilters={initialFilters} />
        </div>
      </section>
    </div>
  )
}
