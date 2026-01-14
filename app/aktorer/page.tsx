import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { ActorCard } from "@/components/actor-card"
import { actors } from "@/lib/data"
import { Badge } from "@/components/ui/badge"

export default function ActorsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-4">Sirkulære aktører i Hamar</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Utforsk lokale bruktbutikker, reparatører og gjenvinningsstasjoner. Hver aktør bidrar til en mer
                bærekraftig by.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Brukt</Badge>
                <Badge variant="secondary">Reparasjon</Badge>
                <Badge variant="secondary">Gjenvinning</Badge>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {actors.map((actor) => (
                <ActorCard key={actor.id} actor={actor} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
