import { HeroSection } from "@/components/hero-section"
import { ActorCard } from "@/components/actor-card"
import { FactCards } from "@/components/fact-cards"
import { CTASection } from "@/components/cta-section"
import { homeContent } from "@/content/no"
import { getActors, getFacts } from "@/lib/public-data"

export default async function HomePage() {
  const [actors, facts] = await Promise.all([getActors(), getFacts()])

  return (
    <div>
      <HeroSection />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{homeContent.actorsTitle}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{homeContent.actorsDescription}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {actors.map((actor) => (
              <ActorCard key={actor.id} actor={actor} />
            ))}
          </div>
        </div>
      </section>

      <FactCards facts={facts} />
      <CTASection />
    </div>
  )
}
