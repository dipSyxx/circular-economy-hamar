import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { ActorCard } from "@/components/actor-card"
import { FactCards } from "@/components/fact-cards"
import { CTASection } from "@/components/cta-section"
import { actors } from "@/lib/data"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <HeroSection />

        {/* Actors Preview */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Sirkulære aktører i Hamar</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Disse lokale aktørene hjelper deg med å handle mer bærekraftig. Kjøp brukt, få ting reparert, og gi ting
                nytt liv.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {actors.map((actor) => (
                <ActorCard key={actor.id} actor={actor} />
              ))}
            </div>
          </div>
        </section>

        <FactCards />
        <CTASection />
      </main>

      <Footer />
    </div>
  )
}
