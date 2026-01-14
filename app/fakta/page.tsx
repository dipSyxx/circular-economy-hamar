import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { facts } from "@/lib/data"
import { ExternalLink, BookOpen, Lightbulb, AlertTriangle } from "lucide-react"
import Link from "next/link"

const detailedFacts = [
  {
    category: "E-avfall",
    icon: "📱",
    title: "E-avfall er et voksende problem",
    content: [
      "Globalt produseres over 50 millioner tonn e-avfall hvert år – og det øker med 3-5% årlig.",
      "Bare 20% av e-avfall blir resirkulert på riktig måte. Resten havner på søppelfyllinger eller blir eksportert til utviklingsland.",
      "E-avfall inneholder verdifulle materialer som gull, sølv og kobber, men også giftige stoffer som bly og kvikksølv.",
      "Ved å levere inn e-avfall riktig, sikrer du at materialene kan gjenvinnes og at giftige stoffer håndteres forsvarlig.",
    ],
    tips: [
      "Lever inn gammel elektronikk på gjenvinningsstasjon eller i butikker som tar imot",
      "Vurder å reparere før du kjøper nytt",
      "Kjøp kvalitetsprodukter som varer lenger",
    ],
    sources: [
      { name: "Global E-waste Monitor", url: "https://globalewaste.org" },
      { name: "WEEE Forum", url: "https://weee-forum.org" },
    ],
  },
  {
    category: "Tekstiler",
    icon: "👕",
    title: "Fast fashion skader miljøet",
    content: [
      "Klesindustrien står for 10% av globale CO₂-utslipp – mer enn fly og shipping til sammen.",
      "92 millioner tonn tekstilavfall produseres globalt hvert år. Det meste havner på søppelfyllinger.",
      "Det kreves 2700 liter vann å produsere én eneste t-skjorte – nok til drikkevann for én person i 2,5 år.",
      "Ved å kjøpe brukt sparer du i gjennomsnitt 95% av energien som trengs for å produsere noe nytt.",
    ],
    tips: [
      "Kjøp brukt – bruktbutikker har ofte unike funn",
      "Reparer klær i stedet for å kaste dem",
      "Velg kvalitet over kvantitet",
      "Doner eller selg klær du ikke bruker",
    ],
    sources: [
      { name: "Ellen MacArthur Foundation", url: "https://ellenmacarthurfoundation.org" },
      { name: "WRAP", url: "https://wrap.org.uk" },
    ],
  },
  {
    category: "Reparasjon",
    icon: "🔧",
    title: "Reparasjon forlenger levetiden",
    content: [
      "Opptil 70% av elektronikk som kastes kunne vært reparert.",
      'EU har innført nye regler som gir deg "rett til å reparere" – produsenter må tilby reservedeler.',
      "Å reparere i stedet for å kjøpe nytt kan spare deg tusenvis av kroner.",
      "Reparasjon skaper lokale arbeidsplasser og holder penger i lokalsamfunnet.",
    ],
    tips: [
      "Sjekk alltid om noe kan repareres før du kjøper nytt",
      "Finn lokale reparatører – de er ofte billigere enn du tror",
      "Lær enkle reparasjoner selv (YouTube er din venn!)",
      "Velg produkter som er laget for å kunne repareres",
    ],
    sources: [
      { name: "European Right to Repair", url: "https://repair.eu" },
      { name: "iFixit", url: "https://www.ifixit.com" },
    ],
  },
  {
    category: "Sirkulær økonomi",
    icon: "♻️",
    title: "Hva er sirkulær økonomi?",
    content: [
      "I en sirkulær økonomi holder vi ressurser i bruk så lenge som mulig.",
      "Det handler om å redusere, gjenbruke, reparere og resirkulere – i den rekkefølgen.",
      "Norge har som mål å bli et foregangsland innen sirkulær økonomi innen 2030.",
      "Lokale initiativer som bruktbutikker og reparasjonsverksteder er viktige brikker i dette.",
    ],
    tips: [
      'Tenk "trenger jeg dette?" før du kjøper',
      "Velg brukt eller lånt fremfor nytt",
      "Del ting med venner og naboer",
      "Støtt lokale sirkulære bedrifter",
    ],
    sources: [
      { name: "Framtiden i våre hender", url: "https://www.framtiden.no" },
      { name: "Miljødirektoratet", url: "https://miljostatus.miljodirektoratet.no" },
    ],
  },
]

export default function FactsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold mb-4">Fakta om bærekraft</h1>
              <p className="text-lg text-muted-foreground">
                Lær mer om hvorfor gjenbruk, reparasjon og riktig avfallshåndtering er viktig – for deg, for miljøet og
                for fremtiden.
              </p>
            </div>
          </div>
        </section>

        {/* Quick stats */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {facts.map((fact) => (
                <Card key={fact.title} className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">{fact.icon}</div>
                    <div className="text-2xl font-bold text-primary mb-2">{fact.stat}</div>
                    <h3 className="font-semibold mb-1">{fact.title}</h3>
                    <p className="text-sm text-muted-foreground">{fact.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed facts */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="space-y-8">
              {detailedFacts.map((section) => (
                <Card key={section.category}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{section.icon}</span>
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          {section.category}
                        </Badge>
                        <CardTitle>{section.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      {section.content.map((paragraph, index) => (
                        <p key={index} className="text-muted-foreground flex items-start gap-2">
                          <BookOpen className="h-4 w-4 mt-1 flex-shrink-0 text-primary" />
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h4 className="font-semibold flex items-center gap-2 mb-3">
                        <Lightbulb className="h-5 w-5 text-accent" />
                        Tips for deg:
                      </h4>
                      <ul className="space-y-2">
                        {section.tips.map((tip, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary font-bold">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">Kilder:</span>
                      {section.sources.map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          {source.name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <Card className="max-w-2xl mx-auto text-center p-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-accent" />
              <h2 className="text-2xl font-bold mb-4">Klar til å gjøre en forskjell?</h2>
              <p className="text-muted-foreground mb-6">
                Nå som du vet mer om hvorfor sirkulær økonomi er viktig, er det på tide å sette kunnskapen ut i praksis!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/aktorer">Finn aktører i Hamar</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/quiz">Ta sirkulærquizen</Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
