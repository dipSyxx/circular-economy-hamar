import type { MetadataRoute } from "next"
import { getArticles } from "@/lib/editorial"
import { prisma } from "@/lib/prisma"
import { categoryOrder } from "@/lib/categories"
import { getGuides } from "@/lib/guides"
import { getMunicipalityBySlug, norwayCounties } from "@/lib/geo"
import { getActors } from "@/lib/public-data"
import { getSiteUrl } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const guides = getGuides()
  const articles = getArticles()
  const [actors, actorPages] = await Promise.all([
    getActors(),
    prisma.actor.findMany({
      where: { status: "approved" },
      select: {
        slug: true,
        updatedAt: true,
      },
    }),
  ])

  const staticRoutes = [
    "",
    "/aktorer",
    "/kart",
    "/decide",
    "/kalkulator",
    "/quiz",
    "/fakta",
    "/challenges",
    "/fylker",
    "/guider",
    "/artikler",
    ...categoryOrder.map((category) => `/kategori/${category}`),
    ...norwayCounties.map((county) => `/${county.slug}`),
  ]

  const countyCategoryRoutes = Array.from(
    new Set(
      actors.flatMap((actor) => [
        ...(actor.countySlug ? [`/${actor.countySlug}/kategori/${actor.category}`] : []),
        ...((actor.serviceAreaCountySlugs ?? []).map((countySlug) => `/${countySlug}/kategori/${actor.category}`)),
      ]),
    ),
  )
  const municipalityRoutes = Array.from(
    new Set(
      actors.flatMap((actor) => {
        const routes: string[] = []
        if (actor.countySlug && actor.municipalitySlug) {
          routes.push(`/${actor.countySlug}/${actor.municipalitySlug}`)
          routes.push(`/${actor.countySlug}/${actor.municipalitySlug}/kategori/${actor.category}`)
        }
        for (const municipalitySlug of actor.serviceAreaMunicipalitySlugs ?? []) {
          const municipalityMeta = getMunicipalityBySlug(municipalitySlug)
          if (municipalityMeta) {
            routes.push(`/${municipalityMeta.countySlug}/${municipalityMeta.slug}`)
            routes.push(`/${municipalityMeta.countySlug}/${municipalityMeta.slug}/kategori/${actor.category}`)
          }
        }
        return routes
      }),
    ),
  )

  return [
    ...staticRoutes.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
    })),
    ...countyCategoryRoutes.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
    })),
    ...municipalityRoutes.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
    })),
    ...guides.map((guide) => ({
      url: `${siteUrl}/guider/${guide.slug}`,
      lastModified: new Date(),
    })),
    ...articles.map((article) => ({
      url: `${siteUrl}/artikler/${article.slug}`,
      lastModified: new Date(article.publishedAt),
    })),
    ...actorPages.map((actor) => ({
      url: `${siteUrl}/aktorer/${actor.slug}`,
      lastModified: actor.updatedAt,
    })),
  ]
}
