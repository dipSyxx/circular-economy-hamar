import { HeroSection } from "@/components/hero-section"
import { FylkerSection } from "@/components/fylker-section"
import { ActorCard } from "@/components/actor-card"
import { RelatedArticlesSection } from "@/components/editorial/related-articles-section"
import { FactCards } from "@/components/fact-cards"
import { CTASection } from "@/components/cta-section"
import { homeContent } from "@/content/no"
import { getLatestArticles } from "@/lib/editorial"
import { getFacts, getLatestActors } from "@/lib/public-data"

export default async function HomePage() {
  const [actors, facts, featuredArticles] = await Promise.all([
    getLatestActors(6),
    getFacts(),
    getLatestArticles(3),
  ])

  return (
    <div>
      <HeroSection />
      <FylkerSection />

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center md:mb-12">
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl">{homeContent.actorsTitle}</h2>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">{homeContent.actorsDescription}</p>
            <p className="mt-3 text-sm text-muted-foreground">Nylig lagt til i katalogen.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {actors.map((actor) => (
              <ActorCard key={actor.id} actor={actor} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4">
          <RelatedArticlesSection
            title="Redaksjonelle artikler"
            description="Her ser du de nyeste redaksjonelle artiklene om lokale mønstre, tillitssignaler og hvordan du bruker katalogen smartere."
            articles={featuredArticles}
          />
        </div>
      </section>

      <FactCards facts={facts} />
      <CTASection />
    </div>
  )
}
