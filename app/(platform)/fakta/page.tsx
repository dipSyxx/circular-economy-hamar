import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, BookOpen, Lightbulb, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { pageCopy } from "@/content/no"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { getCo2eSources, getDetailedFacts, getFacts } from "@/lib/public-data"

export default async function FactsPage() {
  const [facts, detailedFacts, co2eSources] = await Promise.all([
    getFacts(),
    getDetailedFacts(),
    getCo2eSources(),
  ])

  return (
    <div>
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">{pageCopy.facts.title}</h1>
            <p className="text-lg text-muted-foreground">{pageCopy.facts.description}</p>
          </div>
        </div>
      </section>

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
                      {pageCopy.facts.tipsTitle}
                    </h4>
                    <ul className="space-y-2">
                      {section.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary font-bold">-</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">{pageCopy.facts.sourcesLabel}</span>
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

      <section className="py-12 border-t">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>{pageCopy.facts.co2eSourcesTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">{pageCopy.facts.co2eSourcesDescription}</p>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="co2e-sources">
                  <AccordionTrigger>{pageCopy.facts.co2eSourcesToggleLabel}</AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-2">
                    {co2eSources.map((source) => (
                      <div key={source.id} className="space-y-2">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          {source.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {source.capturedAt && (
                          <p className="text-xs text-muted-foreground">Hentet: {source.capturedAt}</p>
                        )}
                        {source.anchors?.length ? (
                          <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {source.anchors.map((anchor) => (
                              <li key={anchor}>{anchor}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto text-center p-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-accent" />
            <h2 className="text-2xl font-bold mb-4">{pageCopy.facts.ctaTitle}</h2>
            <p className="text-muted-foreground mb-6">{pageCopy.facts.ctaDescription}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href={pageCopy.facts.ctaPrimary.href}>{pageCopy.facts.ctaPrimary.label}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={pageCopy.facts.ctaSecondary.href}>{pageCopy.facts.ctaSecondary.label}</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
