import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { ActorCard } from "@/components/actor-card"
import { RelatedArticlesSection } from "@/components/editorial/related-articles-section"
import { RelatedGuidesSection } from "@/components/guides/related-guides-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { actorCopy } from "@/content/no"
import {
  getArticleBySlug,
  getArticleCategoryLinks,
  getArticleCountyLinks,
  getArticleHref,
  getArticles,
  getGuidesForArticle,
  getRelatedActorsForArticle,
  getRelatedArticlesForArticle,
  getEditorialThemeLabel,
} from "@/lib/editorial"
import { getSiteUrl } from "@/lib/seo"

type ArticlePageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return (await getArticles()).map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) return {}

  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical: `${getSiteUrl()}${getArticleHref(article.slug)}` },
    openGraph: {
      title: article.seoTitle,
      description: article.seoDescription,
      url: `${getSiteUrl()}${getArticleHref(article.slug)}`,
    },
  }
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const [relatedActors] = await Promise.all([getRelatedActorsForArticle(article)])
  const [relatedArticles, relatedGuides] = await Promise.all([
    getRelatedArticlesForArticle(article.slug),
    getGuidesForArticle(article),
  ])
  const countyLinks = getArticleCountyLinks(article)
  const categoryLinks = getArticleCategoryLinks(article)

  return (
    <div className="container mx-auto space-y-10 px-4 py-10">
      <section className="max-w-4xl space-y-5">
        <Button variant="ghost" asChild className="px-0">
          <Link href="/artikler">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake til artikler
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{getEditorialThemeLabel(article.theme)}</Badge>
          <Badge variant="outline">{article.readingMinutes} min lesing</Badge>
          {categoryLinks.slice(0, 3).map((categoryLink) => (
            <Link key={categoryLink.href} href={categoryLink.href}>
              <Badge variant="outline">{actorCopy.categoryLongLabels[categoryLink.category]}</Badge>
            </Link>
          ))}
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">{article.title}</h1>
          <p className="text-lg text-muted-foreground">{article.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {countyLinks.map((countyLink) => (
            <Link key={countyLink.href} href={countyLink.href} className="text-primary hover:underline">
              {countyLink.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {article.bodySections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-muted-foreground">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                {section.checklist?.length ? (
                  <ul className="space-y-2">
                    {section.checklist.map((entry) => (
                      <li key={entry} className="flex gap-3 text-sm text-muted-foreground">
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                        <span>{entry}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.ctaLinks?.length ? (
                  <div className="flex flex-wrap gap-3">
                    {section.ctaLinks.map((link) => (
                      <Button key={link.href} variant="outline" asChild>
                        <Link href={link.href}>{link.label}</Link>
                      </Button>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gå videre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/guider">Les praktiske guider</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/aktorer">Utforsk aktører</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/fylker">Finn fylke og kommune</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relevante fylker</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {countyLinks.map((countyLink) => (
                <Link key={countyLink.href} href={countyLink.href}>
                  <Badge variant="outline">{countyLink.label}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Relevante kategorier</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {categoryLinks.map((categoryLink) => (
                <Link key={categoryLink.href} href={categoryLink.href}>
                  <Badge variant="outline">{actorCopy.categoryLongLabels[categoryLink.category]}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Relevante aktører</h2>
            <p className="text-muted-foreground">
              Disse aktørene matcher kategoriene i artikkelen og prioriteres mot lokale fylker først.
            </p>
          </div>
          <Link href="/aktorer" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            Se hele katalogen
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {relatedActors.map((actor) => (
            <ActorCard key={actor.id} actor={actor} />
          ))}
        </div>
      </section>

      <RelatedGuidesSection
        title="Praktiske guider som bygger videre"
        description="Bruk en guide når du vil gå fra innsikt til et konkret neste steg."
        guides={relatedGuides}
      />

      <RelatedArticlesSection
        title="Flere redaksjonelle artikler"
        description="Nærliggende temaer som utdyper lokale valg, tillit og sirkulære systemer."
        articles={relatedArticles}
      />
    </div>
  )
}
