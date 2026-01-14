import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Calculator } from "@/components/calculator"

export default function CalculatorPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">Reparasjonskalkulator</h1>
              <p className="text-lg text-muted-foreground">
                Lurer du på om du bør reparere eller kjøpe nytt? Vår kalkulator hjelper deg å ta det smarteste valget –
                for lommeboka og miljøet.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <Calculator />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
