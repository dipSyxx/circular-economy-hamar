import Link from "next/link"
import type { Metadata } from "next"
import { norwayCounties } from "@/lib/geo"
import { isPilotCounty } from "@/lib/pilot-counties"
import { getPilotRolloutMode } from "@/lib/pilot-coverage"
import { getActors } from "@/lib/public-data"
import { getSiteUrl } from "@/lib/seo"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PilotRolloutNote } from "@/components/pilot-rollout-note"

export const metadata: Metadata = {
  title: "Fylker i Norge",
  description: "Utforsk sirkulære tilbud per fylke i Norge.",
  alternates: { canonical: `${getSiteUrl()}/fylker` },
}

export default async function CountiesIndexPage() {
  const actors = await getActors()

  const counties = norwayCounties.map((county) => {
    const countyActors = actors.filter((actor) => actor.countySlug === county.slug)
    const municipalities = new Set(countyActors.map((actor) => actor.municipalitySlug).filter(Boolean))
    const categories = new Set(countyActors.map((actor) => actor.category))

    return {
      ...county,
      actorCount: countyActors.length,
      municipalityCount: municipalities.size,
      categoryCount: categories.size,
      rolloutMode: getPilotRolloutMode(
        county.slug,
        countyActors.map((actor) => ({
          category: actor.category,
          county: actor.county,
          countySlug: actor.countySlug,
          municipality: actor.municipality,
          municipalitySlug: actor.municipalitySlug,
          city: actor.city,
          freshnessStatus: actor.freshnessStatus,
          sourceCount: actor.sourceCount ?? 0,
          status: "approved" as const,
        })),
      ),
    }
  })

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl space-y-4">
        <Badge variant="secondary">Nationwide browse</Badge>
        <h1 className="text-4xl font-bold">Finn sirkulære tilbud i alle fylker</h1>
        <p className="text-lg text-muted-foreground">
          Start med fylke, gå videre til kommune eller kategori, og finn relevante aktører i Norge.
        </p>
        <PilotRolloutNote mode="non-pilot" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {counties.map((county) => (
          <Link key={county.slug} href={`/${county.slug}`} className="block">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{county.name}</CardTitle>
                <CardDescription>
                  {county.actorCount > 0
                    ? `${county.actorCount} aktører klare for browse.`
                    : "Ingen publiserte aktører ennå. Fylket er klart for utrulling."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{county.actorCount} aktører</Badge>
                <Badge variant="outline">{county.municipalityCount} kommuner</Badge>
                <Badge variant="outline">{county.categoryCount} kategorier</Badge>
                {isPilotCounty(county.slug) ? <Badge variant="secondary">pilot</Badge> : null}
                {county.rolloutMode === "pilot-ready" ? <Badge variant="outline">browse-ready</Badge> : null}
                {county.rolloutMode === "pilot-expanding" ? <Badge variant="outline">under utfylling</Badge> : null}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
