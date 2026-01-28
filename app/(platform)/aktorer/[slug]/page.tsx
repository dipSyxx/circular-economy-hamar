import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  MapPin,
  Phone,
  Globe,
  Instagram,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Mail,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { actorCopy, actorPageCopy } from "@/content/no"
import type { SourceType } from "@/lib/data"
import { categoryConfig } from "@/lib/categories"
import { getActorBySlug } from "@/lib/public-data"
import { FavoriteButton } from "@/components/favorite-button"

interface ActorPageProps {
  params: Promise<{ slug: string }>
}

export default async function ActorPage({ params }: ActorPageProps) {
  const { slug } = await params
  const actor = await getActorBySlug(slug)

  if (!actor) {
    notFound()
  }

  const categoryColor = categoryConfig[actor.category]?.color ?? "#64748b"
  const badgeStyle = {
    backgroundColor: `${categoryColor}1A`,
    borderColor: categoryColor,
    color: categoryColor,
  }

  const sourceLabels: Record<SourceType, string> = {
    website: "Nettside",
    social: "Sosiale medier",
    google_reviews: "Google-omtaler",
    article: "Artikkel",
    map: "Kart",
  }
  const mapDeltaLat = 0.005
  const mapDeltaLng = 0.008
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${actor.lng - mapDeltaLng},${
    actor.lat - mapDeltaLat
  },${actor.lng + mapDeltaLng},${actor.lat + mapDeltaLat}&layer=mapnik&marker=${actor.lat},${actor.lng}`
  const mapLink = `https://www.openstreetmap.org/?mlat=${actor.lat}&mlon=${actor.lng}#map=16/${actor.lat}/${actor.lng}`
  const mapGoogleLink = `https://www.google.com/maps/search/?api=1&query=${actor.lat},${actor.lng}`

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/aktorer">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {actorPageCopy.backLabel}
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-video rounded-xl overflow-hidden">
            <img src={actor.image || "/placeholder.svg"} alt={actor.name} className="w-full h-full object-cover" />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className="border" style={badgeStyle}>
                {actorCopy.categoryLongLabels[actor.category]}
              </Badge>
              {actor.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <h1 className="text-4xl font-bold">{actor.name}</h1>
              <FavoriteButton actorId={actor.id} />
            </div>
            <p className="text-lg text-muted-foreground">{actor.longDescription}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {actorPageCopy.whyTitleTemplate.replace("{name}", actor.name)}
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
              <CardTitle>{actorPageCopy.howToUseTitle}</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Kart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-hidden rounded-lg border">
                <iframe
                  title={`Kart for ${actor.name}`}
                  src={mapEmbedUrl}
                  className="h-80 w-full"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Åpne i OpenStreetMap
                </a>
                <a
                  href={mapGoogleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Åpne i Google Maps
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{actorPageCopy.contactTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{actorPageCopy.addressLabel}</p>
                  <p className="text-sm text-muted-foreground">{actor.address}</p>
                </div>
              </div>

              {actor.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{actorPageCopy.phoneLabel}</p>
                    <a href={`tel:${actor.phone}`} className="text-sm text-primary hover:underline">
                      {actor.phone}
                    </a>
                  </div>
                </div>
              )}

              {actor.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{actorPageCopy.emailLabel}</p>
                    <a href={`mailto:${actor.email}`} className="text-sm text-primary hover:underline">
                      {actor.email}
                    </a>
                  </div>
                </div>
              )}

              {actor.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{actorPageCopy.websiteLabel}</p>
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
                    <p className="font-medium">{actorPageCopy.instagramLabel}</p>
                    <a
                      href={actor.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {actor.instagram}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {actorPageCopy.openingHoursTitle}
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

          <Card>
            <CardHeader>
              <CardTitle>{actorPageCopy.sourcesTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {actor.sources.map((source) => (
                <div key={source.url} className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">{sourceLabels[source.type]}</Badge>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {source.title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  {source.note && (
                    <p className="text-xs text-muted-foreground">
                      {actorPageCopy.sourcesNoteLabel}: {source.note}
                    </p>
                  )}
                  {source.capturedAt && (
                    <p className="text-xs text-muted-foreground">
                      {actorPageCopy.sourcesCapturedLabel}: {source.capturedAt}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button asChild className="w-full" size="lg">
            <Link href="/kart">
              <MapPin className="h-4 w-4 mr-2" />
              {actorPageCopy.mapButton}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
