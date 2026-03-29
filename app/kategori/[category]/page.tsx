import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ActorsExplorer } from "@/components/actors-explorer"
import { RelatedArticlesSection } from "@/components/editorial/related-articles-section"
import { RelatedGuidesSection } from "@/components/guides/related-guides-section"
import { PilotRolloutNote } from "@/components/pilot-rollout-note"
import { Badge } from "@/components/ui/badge"
import { actorCopy } from "@/content/no"
import { categoryOrder } from "@/lib/categories"
import { getArticlesForCategory } from "@/lib/editorial"
import { getGuidesForCategory } from "@/lib/guides"
import { getActorsByCategory } from "@/lib/public-data"
import { getSiteUrl } from "@/lib/seo"

type CategoryPageProps = {
  params: Promise<{ category: string }>
}

export async function generateStaticParams() {
  return categoryOrder.map((category) => ({ category }))
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params
  if (!categoryOrder.includes(category as (typeof categoryOrder)[number])) return {}

  const label = actorCopy.categoryLongLabels[category as keyof typeof actorCopy.categoryLongLabels] ?? category
  return {
    title: `${label} | Norge`,
    description: `Utforsk aktører i kategorien ${label.toLowerCase()} på tvers av Norge.`,
    alternates: { canonical: `${getSiteUrl()}/kategori/${category}` },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params
  if (!categoryOrder.includes(category as (typeof categoryOrder)[number])) notFound()

  const actors = await getActorsByCategory(category as (typeof categoryOrder)[number])
  const label = actorCopy.categoryLongLabels[category as keyof typeof actorCopy.categoryLongLabels] ?? category
  const relatedGuides = getGuidesForCategory(category as (typeof categoryOrder)[number])
  const relatedArticles = getArticlesForCategory(category as (typeof categoryOrder)[number])

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <section className="max-w-4xl space-y-4">
        <Badge variant="secondary">Kategori</Badge>
        <h1 className="text-4xl font-bold">{label} i Norge</h1>
        <p className="text-lg text-muted-foreground">
          En nasjonal kategoriside for browse, sammenligning og indeksering på tvers av fylker og kommuner.
        </p>
        <PilotRolloutNote mode="non-pilot" />
      </section>
      <RelatedGuidesSection
        title={`Praktiske guider for ${label.toLowerCase()}`}
        description="Guidene under er valgt ut fordi de matcher denne kategorien direkte."
        guides={relatedGuides}
      />
      <RelatedArticlesSection
        title={`Artikler om ${label.toLowerCase()}`}
        description="Redaksjonelle artikler som utdyper hvordan denne kategorien fungerer lokalt og nasjonalt."
        articles={relatedArticles}
      />
      <ActorsExplorer actors={actors} />
    </div>
  )
}
