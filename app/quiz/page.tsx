import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Quiz } from "@/components/quiz"

export default function QuizPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-4">Sirkulær Quiz</h1>
              <p className="text-lg text-muted-foreground">
                Test kunnskapen din om gjenbruk og bærekraft. Få personlige tips basert på svarene dine!
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <Quiz />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
