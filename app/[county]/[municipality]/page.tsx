import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ActorsExplorer } from "@/components/actors-explorer"
import { RelatedArticlesSection } from "@/components/editorial/related-articles-section"
import { RelatedGuidesSection } from "@/components/guides/related-guides-section"
import { PilotRolloutNote } from "@/components/pilot-rollout-note"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { actorCopy } from "@/content/no"
import { categoryOrder } from "@/lib/categories"
import { getArticlesForMunicipality } from "@/lib/editorial"
import { getGuidesForMunicipality } from "@/lib/guides"
import { getCountyBySlug, getMunicipalityBySlug, norwayCounties } from "@/lib/geo"
import { getPilotRolloutMode } from "@/lib/pilot-coverage"
import { getActors, getActorsByCounty, getActorsByMunicipality } from "@/lib/public-data"
import { getSiteUrl } from "@/lib/seo"

type MunicipalityPageProps = {
  params: Promise<{ county: string; municipality: string }>
}

export async function generateStaticParams() {
  const actors = await getActors()
  return Array.from(
    new Set(
      actors
        .flatMap((actor) => {
          const entries: string[] = []
          if (actor.countySlug && actor.municipalitySlug) {
            entries.push(`${actor.countySlug}:${actor.municipalitySlug}`)
          }
          for (const municipalitySlug of actor.serviceAreaMunicipalitySlugs ?? []) {
            const municipalityMeta = getMunicipalityBySlug(municipalitySlug)
            if (municipalityMeta) {
              entries.push(`${municipalityMeta.countySlug}:${municipalityMeta.slug}`)
            }
          }
          return entries
        }),
    ),
  ).map((entry) => {
    const [county, municipality] = entry.split(":")
    return { county, municipality }
  })
}

export async function generateMetadata({ params }: MunicipalityPageProps): Promise<Metadata> {
  const { county, municipality } = await params
  const countyMeta = getCountyBySlug(county)
  if (!countyMeta) return {}
  const municipalityMeta = getMunicipalityBySlug(municipality, countyMeta.slug)
  const municipalityName = municipalityMeta?.name ?? municipality

  return {
    title: `${municipalityName} | ${countyMeta.name}`,
    description: `Utforsk sirkulære aktører i ${municipalityName}, ${countyMeta.name}.`,
    alternates: { canonical: `${getSiteUrl()}/${county}/${municipality}` },
  }
}

export default async function MunicipalityPage({ params }: MunicipalityPageProps) {
  const { county, municipality } = await params
  const countyMeta = getCountyBySlug(county)
  if (!countyMeta) notFound()
  const municipalityMeta = getMunicipalityBySlug(municipality, countyMeta.slug)

  const [countyActors, actors] = await Promise.all([
    getActorsByCounty(countyMeta.slug),
    getActorsByMunicipality(countyMeta.slug, municipality),
  ])
  if (!municipalityMeta && actors.length === 0) notFound()

  const municipalityName = municipalityMeta?.name ?? actors[0]?.municipality ?? actors[0]?.city ?? municipality
  const categories = categoryOrder
    .filter((category) => actors.some((actor) => actor.category === category))
    .map((category) => ({
      category,
      count: actors.filter((actor) => actor.category === category).length,
    }))
  const relatedGuides = getGuidesForMunicipality(countyMeta.slug)
  const relatedArticles = getArticlesForMunicipality(countyMeta.slug)
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
          <Badge variant="outline">{municipalityName}</Badge>
        </div>
        <h1 className="text-4xl font-bold">Sirkulære tilbud i {municipalityName}</h1>
        <p className="text-lg text-muted-foreground">
          Denne siden samler lokale aktører i {municipalityName} og fungerer som landing page for local-intent browse
          og SEO.
        </p>
        <PilotRolloutNote mode={rolloutMode} countyName={countyMeta.name} municipalityName={municipalityName} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Kategorier i {municipalityName}</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((entry) => (
            <Link
              key={entry.category}
              href={`/${countyMeta.slug}/${municipality}/kategori/${entry.category}`}
            >
              <Badge variant="outline">
                {actorCopy.categoryLongLabels[entry.category]} · {entry.count}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      <RelatedGuidesSection
        title={`Guider for ${municipalityName}`}
        description={`Disse guidene passer for behov du typisk vil løse i ${municipalityName} og ${countyMeta.name}.`}
        guides={relatedGuides}
      />

      <RelatedArticlesSection
        title={`Artikler for ${municipalityName}`}
        description={`Redaksjonelle artikler som gir mer kontekst for hvordan ${municipalityName} og ${countyMeta.name} brukes i katalogen.`}
        articles={relatedArticles}
      />

      <ActorsExplorer actors={actors} />
    </div>
  )
}
