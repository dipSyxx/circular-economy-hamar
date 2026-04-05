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

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{homeContent.actorsTitle}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{homeContent.actorsDescription}</p>
            <p className="mt-3 text-sm text-muted-foreground">Nylig lagt til i katalogen.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
