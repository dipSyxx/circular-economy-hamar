import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ActorsExplorer } from "@/components/actors-explorer"
import { RelatedArticlesSection } from "@/components/editorial/related-articles-section"
import { RelatedGuidesSection } from "@/components/guides/related-guides-section"
import { Badge } from "@/components/ui/badge"
import { actorCopy } from "@/content/no"
import { categoryOrder } from "@/lib/categories"
import { getArticlesForCategory } from "@/lib/editorial"
import { getGuidesForCategory } from "@/lib/guides"
import { getCountyBySlug, getMunicipalityBySlug } from "@/lib/geo"
import { getActors, getActorsByMunicipalityAndCategory } from "@/lib/public-data"
import { getSiteUrl } from "@/lib/seo"

type MunicipalityCategoryPageProps = {
  params: Promise<{ county: string; municipality: string; category: string }>
}

export async function generateStaticParams() {
  const actors = await getActors()
  return Array.from(
    new Set(
      actors.flatMap((actor) => {
        const entries: string[] = []
        if (actor.countySlug && actor.municipalitySlug) {
          entries.push(`${actor.countySlug}:${actor.municipalitySlug}:${actor.category}`)
        }
        for (const municipalitySlug of actor.serviceAreaMunicipalitySlugs ?? []) {
          const municipalityMeta = getMunicipalityBySlug(municipalitySlug)
          if (municipalityMeta) {
            entries.push(`${municipalityMeta.countySlug}:${municipalityMeta.slug}:${actor.category}`)
          }
        }
        return entries
      }),
    ),
  ).map((entry) => {
    const [county, municipality, category] = entry.split(":")
    return { county, municipality, category }
  })
}

export async function generateMetadata({ params }: MunicipalityCategoryPageProps): Promise<Metadata> {
  const { county, municipality, category } = await params
  const countyMeta = getCountyBySlug(county)
  if (!countyMeta || !categoryOrder.includes(category as (typeof categoryOrder)[number])) {
    return {}
  }

  const municipalityMeta = getMunicipalityBySlug(municipality, countyMeta.slug)
  const municipalityName = municipalityMeta?.name ?? municipality
  const categoryLabel =
    actorCopy.categoryLongLabels[category as keyof typeof actorCopy.categoryLongLabels] ?? category

  return {
    title: `${categoryLabel} i ${municipalityName}`,
    description: `Utforsk ${categoryLabel.toLowerCase()} i ${municipalityName}, ${countyMeta.name}.`,
    alternates: { canonical: `${getSiteUrl()}/${county}/${municipality}/kategori/${category}` },
  }
}

export default async function MunicipalityCategoryPage({ params }: MunicipalityCategoryPageProps) {
  const { county, municipality, category } = await params
  const countyMeta = getCountyBySlug(county)
  if (!countyMeta || !categoryOrder.includes(category as (typeof categoryOrder)[number])) {
    notFound()
  }

  const municipalityMeta = getMunicipalityBySlug(municipality, countyMeta.slug)
  const actors = await getActorsByMunicipalityAndCategory(
    countyMeta.slug,
    municipality,
    category as (typeof categoryOrder)[number],
  )

  if (!municipalityMeta && actors.length === 0) {
    notFound()
  }

  const municipalityName = municipalityMeta?.name ?? actors[0]?.municipality ?? actors[0]?.city ?? municipality
  const categoryLabel =
    actorCopy.categoryLongLabels[category as keyof typeof actorCopy.categoryLongLabels] ?? category
  const relatedGuides = getGuidesForCategory(
    category as (typeof categoryOrder)[number],
    countyMeta.slug,
  )
  const relatedArticles = getArticlesForCategory(
    category as (typeof categoryOrder)[number],
    countyMeta.slug,
  )

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <section className="max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{countyMeta.name}</Badge>
          <Badge variant="outline">{municipalityName}</Badge>
          <Badge variant="outline">{categoryLabel}</Badge>
        </div>
        <h1 className="text-4xl font-bold">{categoryLabel} i {municipalityName}</h1>
        <p className="text-lg text-muted-foreground">
          Lokalt kategoribrowse for {municipalityName} med lokale treff først, deretter eksplisitte
          dekningsområder og landsdekkende alternativer.
        </p>
        <Link href={`/${countyMeta.slug}/${municipality}`} className="text-sm text-primary hover:underline">
          Tilbake til {municipalityName}
        </Link>
      </section>

      <RelatedGuidesSection
        title={`Guider for ${categoryLabel.toLowerCase()} i ${municipalityName}`}
        description={`Disse guidene matcher kategorien først, men peker også tilbake til ${countyMeta.name} og lokale browse-flater.`}
        guides={relatedGuides}
      />

      <RelatedArticlesSection
        title={`Artikler om ${categoryLabel.toLowerCase()} i ${municipalityName}`}
        description={`Redaksjonelle artikler som bruker ${countyMeta.name} som lokal kontekst og utdyper hvorfor denne kategorien betyr noe.`}
        articles={relatedArticles}
      />

      <ActorsExplorer actors={actors} />
    </div>
  )
}
