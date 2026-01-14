import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { MapComponent } from "@/components/map-component"

export default function MapPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <section className="py-8 bg-muted/30">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-2">Sirkulært kart over Hamar</h1>
            <p className="text-muted-foreground">Finn bruktbutikker, reparatører og gjenvinningsstasjoner nær deg.</p>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-4">
            <MapComponent />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
