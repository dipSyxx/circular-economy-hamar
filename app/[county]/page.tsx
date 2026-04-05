import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ActorsExplorer } from "@/components/actors-explorer"
import { RelatedArticlesSection } from "@/components/editorial/related-articles-section"
import { RelatedGuidesSection } from "@/components/guides/related-guides-section"
import { PilotRolloutNote } from "@/components/pilot-rollout-note"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getArticlesForCounty } from "@/lib/editorial"
import { getActorGeographyMatchPriority, getAvailableMunicipalityOptions } from "@/lib/actor-scope"
import { categoryOrder } from "@/lib/categories"
import { formatCategoryLabel } from "@/lib/enum-labels"
import { getGuidesForCounty } from "@/lib/guides"
import { getCountyBySlug, norwayCounties } from "@/lib/geo"
import { getPilotRolloutMode } from "@/lib/pilot-coverage"
import { getActorsByCounty } from "@/lib/public-data"
import { getSiteUrl } from "@/lib/seo"

type CountyPageProps = {
  params: Promise<{ county: string }>
}

export async function generateStaticParams() {
  return norwayCounties.map((county) => ({ county: county.slug }))
}

export async function generateMetadata({ params }: CountyPageProps): Promise<Metadata> {
  const { county } = await params
  const countyMeta = getCountyBySlug(county)
  if (!countyMeta) {
    return {}
  }

  return {
    title: `${countyMeta.name} | Sirkulære aktører`,
    description: `Utforsk sirkulære aktører, kategorier og kommuner i ${countyMeta.name}.`,
    alternates: { canonical: `${getSiteUrl()}/${countyMeta.slug}` },
  }
}

export default async function CountyPage({ params }: CountyPageProps) {
  const { county } = await params
  const countyMeta = getCountyBySlug(county)
  if (!countyMeta) notFound()

  const actors = await getActorsByCounty(countyMeta.slug)
  const rolloutMode = getPilotRolloutMode(
    countyMeta.slug,
    actors.map((actor) => ({
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
  const municipalityCountMap = new Map<string, number>()
  const categoryCountMap = new Map<string, number>()
  for (const actor of actors) {
    if (actor.municipalitySlug) {
      municipalityCountMap.set(
        actor.municipalitySlug,
        (municipalityCountMap.get(actor.municipalitySlug) ?? 0) + 1,
      )
    }
    categoryCountMap.set(actor.category, (categoryCountMap.get(actor.category) ?? 0) + 1)
  }

  const municipalities = getAvailableMunicipalityOptions(actors, countyMeta.slug).map((municipality) => ({
    ...municipality,
    count: municipalityCountMap.get(municipality.slug) ?? 0,
  }))

  const categories = categoryOrder
    .filter((category) => categoryCountMap.has(category))
    .map((category) => ({
      category,
      count: categoryCountMap.get(category) ?? 0,
    }))
  const relatedGuides = getGuidesForCounty(countyMeta.slug)
  const relatedArticles = await getArticlesForCounty(countyMeta.slug)

  return (
    <div className="container mx-auto px-4 py-10 space-y-10">
      <section className="max-w-4xl space-y-4">
        <Badge variant="secondary">{countyMeta.name}</Badge>
        <h1 className="text-4xl font-bold">Sirkulære tilbud i {countyMeta.name}</h1>
        <p className="text-lg text-muted-foreground">
          Browse kommuner, kategorier og publiserte aktører i {countyMeta.name}. Denne siden fungerer som SEO- og
          navigasjonsinngang for fylket.
        </p>
        <PilotRolloutNote mode={rolloutMode} countyName={countyMeta.name} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kommuner og byer</CardTitle>
            <CardDescription>Gå videre til en lokal oversikt for kommune eller by.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {municipalities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen publiserte kommunesider ennå.</p>
            ) : (
              municipalities.map((municipality) => (
                <Link
                  key={municipality.slug}
                  href={`/${countyMeta.slug}/${municipality.slug}`}
                  className="rounded-lg border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <p className="font-medium">{municipality.name}</p>
                  <p className="text-sm text-muted-foreground">{municipality.count} aktører</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kategorier i {countyMeta.name}</CardTitle>
            <CardDescription>Direkte innganger for browse og internlenking.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen kategorier publisert for dette fylket ennå.</p>
            ) : (
              categories.map((entry) => (
                <Link key={entry.category} href={`/${countyMeta.slug}/kategori/${entry.category}`}>
                  <Badge variant="outline">{formatCategoryLabel(entry.category)} · {entry.count}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <RelatedGuidesSection
        title={`Praktiske guider for ${countyMeta.name}`}
        description="Disse guidene peker videre til relevante kategorier, fylker og lokale neste steg."
        guides={relatedGuides}
      />

      <RelatedArticlesSection
        title={`Redaksjonelle artikler for ${countyMeta.name}`}
        description="Artiklene under forklarer lokale mønstre, rollout-gap og hvordan fylket henger sammen med kategoriene."
        articles={relatedArticles}
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Aktører i {countyMeta.name}</h2>
          <p className="text-muted-foreground">Filtrer på kategori, tagger og søk direkte i fylkets katalog.</p>
        </div>
        <ActorsExplorer actors={actors} />
      </section>
    </div>
  )
}
