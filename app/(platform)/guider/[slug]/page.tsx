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
import { getArticlesForGuide } from "@/lib/editorial"
import {
  getGuideBySlug,
  getGuideCategoryLinks,
  getGuideCountyLinks,
  getGuideHref,
  getGuides,
  getRelatedActorsForGuide,
  getRelatedGuidesForGuide,
} from "@/lib/guides"
import { getSiteUrl } from "@/lib/seo"

type GuidePageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getGuides().map((guide) => ({ slug: guide.slug }))
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = getGuideBySlug(slug)
  if (!guide) return {}

  return {
    title: guide.seoTitle,
    description: guide.seoDescription,
    alternates: { canonical: `${getSiteUrl()}${getGuideHref(guide.slug)}` },
    openGraph: {
      title: guide.seoTitle,
      description: guide.seoDescription,
      url: `${getSiteUrl()}${getGuideHref(guide.slug)}`,
    },
  }
}

export default async function GuideDetailPage({ params }: GuidePageProps) {
  const { slug } = await params
  const guide = getGuideBySlug(slug)
  if (!guide) notFound()

  const [relatedActors] = await Promise.all([getRelatedActorsForGuide(guide)])
  const relatedGuides = getRelatedGuidesForGuide(guide.slug)
  const relatedArticles = getArticlesForGuide(guide)
  const countyLinks = getGuideCountyLinks(guide)
  const categoryLinks = getGuideCategoryLinks(guide)

  return (
    <div className="container mx-auto space-y-10 px-4 py-10">
      <section className="max-w-4xl space-y-5">
        <Button variant="ghost" asChild className="px-0">
          <Link href="/guider">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake til guider
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Praktisk guide</Badge>
          {categoryLinks.slice(0, 3).map((categoryLink) => (
            <Link key={categoryLink.href} href={categoryLink.href}>
              <Badge variant="outline">{actorCopy.categoryLongLabels[categoryLink.category]}</Badge>
            </Link>
          ))}
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">{guide.title}</h1>
          <p className="text-lg text-muted-foreground">{guide.summary}</p>
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
          {guide.bodySections.map((section) => (
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
                <Link href="/aktorer">Utforsk aktører</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/fylker">Finn fylke og kommune</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/decide">Prøv beslutningsmotoren</Link>
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
              Disse aktørene matcher kategoriene i guiden og prioriteres fra fylker med aktiv pilotdekning.
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
        title="Flere praktiske guider"
        description="Neste steg fra andre sirkulære behov og intents."
        guides={relatedGuides}
      />

      <RelatedArticlesSection
        title="Redaksjonelle artikler som utdyper guiden"
        description="Bruk artiklene når du vil forstå sammenhenger, kvalitetssignaler og lokale mønstre bedre før du handler."
        articles={relatedArticles}
      />
    </div>
  )
}
