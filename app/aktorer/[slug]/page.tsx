import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { actors } from "@/lib/data"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Phone, Globe, Instagram, Clock, CheckCircle2, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface ActorPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return actors.map((actor) => ({
    slug: actor.slug,
  }))
}

export default async function ActorPage({ params }: ActorPageProps) {
  const { slug } = await params
  const actor = actors.find((a) => a.slug === slug)

  if (!actor) {
    notFound()
  }

  const categoryColors = {
    brukt: "bg-primary/10 text-primary",
    reparasjon: "bg-accent/20 text-accent-foreground",
    gjenvinning: "bg-chart-2/20 text-chart-2",
  }

  const categoryLabels = {
    brukt: "Brukthandel",
    reparasjon: "Reparasjon",
    gjenvinning: "Gjenvinning",
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/aktorer">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake til aktører
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <div className="aspect-video rounded-xl overflow-hidden">
                <img src={actor.image || "/placeholder.svg"} alt={actor.name} className="w-full h-full object-cover" />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={categoryColors[actor.category]}>{categoryLabels[actor.category]}</Badge>
                  {actor.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <h1 className="text-4xl font-bold mb-4">{actor.name}</h1>
                <p className="text-lg text-muted-foreground">{actor.longDescription}</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Hvorfor {actor.name}?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {actor.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Slik bruker du det</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {actor.howToUse.map((step, index) => (
                      <li key={step} className="flex items-start gap-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-muted-foreground pt-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kontaktinfo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Adresse</p>
                      <p className="text-sm text-muted-foreground">{actor.address}</p>
                    </div>
                  </div>

                  {actor.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Telefon</p>
                        <a href={`tel:${actor.phone}`} className="text-sm text-primary hover:underline">
                          {actor.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {actor.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Nettside</p>
                        <a
                          href={actor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {actor.website}
                        </a>
                      </div>
                    </div>
                  )}

                  {actor.instagram && (
                    <div className="flex items-start gap-3">
                      <Instagram className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">Instagram</p>
                        <span className="text-sm text-muted-foreground">{actor.instagram}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Åpningstider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {actor.openingHours.map((hours) => (
                      <li key={hours} className="text-sm text-muted-foreground">
                        {hours}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Button asChild className="w-full" size="lg">
                <Link href="/kart">
                  <MapPin className="h-4 w-4 mr-2" />
                  Se på kartet
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
