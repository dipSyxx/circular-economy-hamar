import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ActorsExplorer } from "@/components/actors-explorer"
import { RelatedGuidesSection } from "@/components/guides/related-guides-section"
import { PilotRolloutNote } from "@/components/pilot-rollout-note"
import { Badge } from "@/components/ui/badge"
import { actorCopy } from "@/content/no"
import { categoryOrder } from "@/lib/categories"
import { getGuidesForCategory } from "@/lib/guides"
import { getCountyBySlug, norwayCounties } from "@/lib/geo"
import { getPilotRolloutMode } from "@/lib/pilot-coverage"
import { getActors, getActorsByCounty, getActorsByCountyAndCategory } from "@/lib/public-data"
import { getSiteUrl } from "@/lib/seo"

type CountyCategoryPageProps = {
  params: Promise<{ county: string; category: string }>
}

export async function generateStaticParams() {
  const actors = await getActors()
  return Array.from(
    new Set(
      actors.flatMap((actor) => [
        ...(actor.countySlug ? [`${actor.countySlug}:${actor.category}`] : []),
        ...((actor.serviceAreaCountySlugs ?? []).map((countySlug) => `${countySlug}:${actor.category}`)),
      ]),
    ),
  ).map((entry) => {
    const [county, category] = entry.split(":")
    return { county, category }
  })
}

export async function generateMetadata({ params }: CountyCategoryPageProps): Promise<Metadata> {
  const { county, category } = await params
  const countyMeta = getCountyBySlug(county)
  if (!countyMeta || !categoryOrder.includes(category as (typeof categoryOrder)[number])) return {}

  const label = actorCopy.categoryLongLabels[category as keyof typeof actorCopy.categoryLongLabels] ?? category
  return {
    title: `${label} i ${countyMeta.name}`,
    description: `Utforsk ${label.toLowerCase()} i ${countyMeta.name}.`,
    alternates: { canonical: `${getSiteUrl()}/${countyMeta.slug}/kategori/${category}` },
  }
}

export default async function CountyCategoryPage({ params }: CountyCategoryPageProps) {
  const { county, category } = await params
  const countyMeta = getCountyBySlug(county)
  if (!countyMeta || !categoryOrder.includes(category as (typeof categoryOrder)[number])) notFound()

  const [countyActors, actors] = await Promise.all([
    getActorsByCounty(countyMeta.slug),
    getActorsByCountyAndCategory(countyMeta.slug, category as (typeof categoryOrder)[number]),
  ])
  const label = actorCopy.categoryLongLabels[category as keyof typeof actorCopy.categoryLongLabels] ?? category
  const relatedGuides = getGuidesForCategory(
    category as (typeof categoryOrder)[number],
    countyMeta.slug,
  )
  const rolloutMode = getPilotRolloutMode(
    countyMeta.slug,
    countyActors.map((actor) => ({
      category: actor.category,
      county: actor.county,
      countySlug: actor.countySlug,
      municipality: actor.municipality,
      municipalitySlug: actor.municipalitySlug,
      city: actor.city,
      freshnessStatus: actor.freshnessStatus,
      sourceCount: actor.sourceCount ?? 0,
      status: "approved" as const,
    })),
  )

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <section className="max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{countyMeta.name}</Badge>
          <Badge variant="outline">{label}</Badge>
        </div>
        <h1 className="text-4xl font-bold">{label} i {countyMeta.name}</h1>
        <p className="text-lg text-muted-foreground">
          En fylkesspesifikk kategoriside for sterkere discovery, internlenking og lokalt browse.
        </p>
        <PilotRolloutNote mode={rolloutMode} countyName={countyMeta.name} />
      </section>
      <RelatedGuidesSection
        title={`${label} i ${countyMeta.name}: guider og neste steg`}
        description="Guidene prioriterer denne kategorien først og fylket deretter."
        guides={relatedGuides}
      />
      <ActorsExplorer actors={actors} />
    </div>
  )
}
