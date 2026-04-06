import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
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
  Mail,
  ExternalLink,
} from "lucide-react"
import { actorCopy, actorPageCopy } from "@/content/no"
import type { SourceType } from "@/lib/data"
import { ActorCorrectionDialog } from "@/components/actor-correction-dialog"
import { RelatedArticlesSection } from "@/components/editorial/related-articles-section"
import { RelatedGuidesSection } from "@/components/guides/related-guides-section"
import { ActorTrustBadges } from "@/components/actor-trust-badges"
import { ActorImage } from "@/components/actor-image"
import { BackButton } from "@/components/back-button"
import { categoryConfig } from "@/lib/categories"
import { getArticlesForActor } from "@/lib/editorial"
import { getGuidesForActor } from "@/lib/guides"
import { getActorBySlug } from "@/lib/public-data"
import { prisma } from "@/lib/prisma"
import { FavoriteButton } from "@/components/favorite-button"
import { formatActorGeoLabel } from "@/lib/geo"
import { getSiteUrl } from "@/lib/seo"

interface ActorPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const actors = await prisma.actor.findMany({
    where: { status: "approved" },
    select: { slug: true },
  })
  return actors.map((actor) => ({ slug: actor.slug }))
}

export async function generateMetadata({ params }: ActorPageProps): Promise<Metadata> {
  const { slug } = await params
  const actor = await getActorBySlug(slug)
  if (!actor) {
    return {}
  }

  const locationLabel = formatActorGeoLabel(actor)

  return {
    title: `${actor.name} | ${locationLabel || "Norge"}`,
    description: actor.description,
    alternates: { canonical: `${getSiteUrl()}/aktorer/${actor.slug}` },
    openGraph: {
      title: actor.name,
      description: actor.description,
      images: actor.image ? [{ url: actor.image }] : undefined,
    },
  }
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
  const backFallback =
    actor.countySlug && actor.municipalitySlug
      ? `/${actor.countySlug}/${actor.municipalitySlug}`
      : actor.countySlug
        ? `/${actor.countySlug}`
        : "/aktorer"

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
  const geoLabel = formatActorGeoLabel(actor)
  const relatedGuides = getGuidesForActor(actor)
  const relatedArticles = await getArticlesForActor(actor)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: actor.name,
    description: actor.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: actor.address,
      postalCode: actor.postalCode,
      addressLocality: actor.city,
      addressRegion: actor.county,
      addressCountry: actor.country ?? "Norway",
    },
    telephone: actor.phone,
    email: actor.email,
    url: actor.website ?? `${getSiteUrl()}/aktorer/${actor.slug}`,
    sameAs: [actor.website, actor.instagram].filter(Boolean),
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <BackButton fallbackHref={backFallback} label={actorPageCopy.backLabel} className="mb-6" />

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="min-w-0 space-y-6 sm:space-y-8 lg:col-span-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted sm:aspect-[16/10] lg:aspect-video">
            <ActorImage src={actor.image} alt={actor.name} />
          </div>

          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <Badge variant="outline" className="border" style={badgeStyle}>
                {actorCopy.categoryLongLabels[actor.category]}
              </Badge>
              {actor.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <h1 className="max-w-[16ch] break-words text-3xl font-bold leading-tight text-balance sm:max-w-none sm:text-4xl">
                  {actor.name}
                </h1>
                {geoLabel && <p className="break-words text-sm text-muted-foreground">{geoLabel}</p>}
                <ActorTrustBadges actor={actor} className="min-w-0" />
                {actor.verifiedAt ? (
                  <p className="break-words text-xs text-muted-foreground">
                    Sist verifisert {new Date(actor.verifiedAt).toLocaleDateString("no-NO")}
                  </p>
                ) : null}
              </div>
              <FavoriteButton actorId={actor.id} className="w-fit shrink-0 self-start" />
            </div>
            <p className="max-w-prose break-words text-base leading-7 text-muted-foreground sm:text-lg">
              {actor.longDescription}
            </p>
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

          <RelatedGuidesSection
            title="Praktiske guider som passer her"
            description="Guidene under matcher kategorien til aktøren først, og fylket deretter."
            guides={relatedGuides}
          />
          <RelatedArticlesSection
            title="Redaksjonelle artikler som gir mer kontekst"
            description="Les mer om lokale mønstre, datakvalitet og hvordan denne typen tilbud passer inn i et større sirkulært bilde."
            articles={relatedArticles}
          />
        </div>

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tillit og datakvalitet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActorTrustBadges actor={actor} />
              <p className="text-sm text-muted-foreground">
                {actor.isTrusted
                  ? "Denne aktøren er redaksjonelt verifisert og har fortsatt gyldig friskhetsstatus."
                  : actor.freshnessStatus === "stale"
                    ? "Dataene finnes fortsatt i katalogen, men posten trenger ny verifisering."
                    : "Posten er synlig, men har ikke full redaksjonell tillitsstatus i denne fasen."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{actorPageCopy.contactTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="min-w-0">
                  <p className="font-medium">{actorPageCopy.addressLabel}</p>
                  <p className="break-words text-sm text-muted-foreground">{actor.address}</p>
                </div>
              </div>

              {actor.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium">{actorPageCopy.phoneLabel}</p>
                    <a href={`tel:${actor.phone}`} className="break-words text-sm text-primary hover:underline">
                      {actor.phone}
                    </a>
                  </div>
                </div>
              )}

              {actor.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium">{actorPageCopy.emailLabel}</p>
                    <a href={`mailto:${actor.email}`} className="break-all text-sm text-primary hover:underline">
                      {actor.email}
                    </a>
                  </div>
                </div>
              )}

              {actor.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium">{actorPageCopy.websiteLabel}</p>
                    <a
                      href={actor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-primary hover:underline"
                    >
                      {actor.website}
                    </a>
                  </div>
                </div>
              )}

              {actor.instagram && (
                <div className="flex items-start gap-3">
                  <Instagram className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-medium">{actorPageCopy.instagramLabel}</p>
                    <a
                      href={actor.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-primary hover:underline"
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
              {actor.sources.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen kilder er registrert ennå.</p>
              ) : (
                actor.sources.map((source) => (
                  <div key={source.url} className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variant="secondary">{sourceLabels[source.type]}</Badge>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-w-0 items-center gap-1 break-all text-primary hover:underline"
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
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Finner du feil?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Hjelp oss holde katalogen oppdatert med korrigeringer, nye kilder eller endrede kontaktdata.
              </p>
              <ActorCorrectionDialog
                actor={{
                  id: actor.id,
                  name: actor.name,
                  address: actor.address,
                  postalCode: actor.postalCode ?? null,
                  county: actor.county,
                  municipality: actor.municipality,
                  city: actor.city,
                  phone: actor.phone ?? null,
                  email: actor.email ?? null,
                  website: actor.website ?? null,
                  openingHoursOsm: actor.openingHoursOsm ?? null,
                }}
              />
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
