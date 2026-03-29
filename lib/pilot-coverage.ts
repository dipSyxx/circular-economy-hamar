import { categoryOrder, supportsRepairServices } from "@/lib/categories"
import type {
  ActorCategory,
  AdminActorReviewItem,
  CountyCoverageSummary,
  CoverageClusterKey,
  CoverageClusterStatus,
  MunicipalityCoverageSummary,
} from "@/lib/data"
import { getCountyBySlug, norwayCounties } from "@/lib/geo"
import { isPilotCounty, pilotCountySlugs } from "@/lib/pilot-counties"

export type PilotRolloutMode = "pilot-ready" | "pilot-expanding" | "non-pilot"

type CoverageActor = Pick<
  AdminActorReviewItem,
  | "category"
  | "county"
  | "countySlug"
  | "municipality"
  | "municipalitySlug"
  | "city"
  | "freshnessStatus"
  | "sourceCount"
  | "status"
> & {
  dueState?: AdminActorReviewItem["dueState"]
}

const coverageClusterMeta: Array<{
  key: CoverageClusterKey
  label: string
  matches: (category: ActorCategory) => boolean
}> = [
  {
    key: "reuse",
    label: "Ombruk / second hand",
    matches: (category) => category === "brukt",
  },
  {
    key: "repair",
    label: "Reparasjon",
    matches: (category) => supportsRepairServices(category),
  },
  {
    key: "recycling",
    label: "Gjenvinning",
    matches: (category) => category === "gjenvinning",
  },
  {
    key: "access_redistribution",
    label: "Utleie / mottak for ombruk",
    matches: (category) => category === "utleie" || category === "mottak_ombruk",
  },
]

const getClusterCategories = (key: CoverageClusterKey) =>
  categoryOrder.filter((category) =>
    coverageClusterMeta.find((cluster) => cluster.key === key)?.matches(category),
  )

const toCoverageClusters = (actors: CoverageActor[]): CoverageClusterStatus[] =>
  coverageClusterMeta.map((cluster) => {
    const actorCount = actors.filter((actor) => cluster.matches(actor.category)).length
    return {
      key: cluster.key,
      label: cluster.label,
      categories: getClusterCategories(cluster.key),
      actorCount,
      isReady: actorCount > 0,
    }
  })

const toCategoryCounts = (actors: CoverageActor[]) =>
  categoryOrder
    .map((category) => ({
      category,
      count: actors.filter((actor) => actor.category === category).length,
    }))
    .filter((entry) => entry.count > 0)

export const getPilotRolloutMode = (countySlug: string, actors: CoverageActor[]): PilotRolloutMode => {
  if (!isPilotCounty(countySlug)) {
    return "non-pilot"
  }

  const coverageClusters = toCoverageClusters(actors.filter((actor) => actor.status === "approved"))
  return coverageClusters.every((cluster) => cluster.isReady) ? "pilot-ready" : "pilot-expanding"
}

export const getCountyCoverageSummaries = (actors: CoverageActor[]): CountyCoverageSummary[] => {
  const approvedActors = actors.filter((actor) => actor.status === "approved")
  const grouped = new Map<string, CoverageActor[]>()

  for (const actor of approvedActors) {
    const countySlug = actor.countySlug?.trim()
    if (!countySlug) continue
    const existing = grouped.get(countySlug) ?? []
    existing.push(actor)
    grouped.set(countySlug, existing)
  }

  const countySlugs = Array.from(
    new Set([...norwayCounties.map((county) => county.slug), ...grouped.keys(), ...pilotCountySlugs]),
  ).sort((left, right) => {
    const leftName = getCountyBySlug(left)?.name ?? left
    const rightName = getCountyBySlug(right)?.name ?? right
    return leftName.localeCompare(rightName, "no", { sensitivity: "base" })
  })

  return countySlugs.map((countySlug) => {
    const countyActors = grouped.get(countySlug) ?? []
    const coverageClusters = toCoverageClusters(countyActors)
    const countyName = countyActors[0]?.county ?? getCountyBySlug(countySlug)?.name ?? countySlug
    const municipalities = new Set(
      countyActors
        .map((actor) => actor.municipality?.trim() || actor.city?.trim())
        .filter(Boolean),
    )

    return {
      county: countyName,
      countySlug,
      approvedActorCount: countyActors.length,
      municipalityCount: municipalities.size,
      missingSourceCount: countyActors.filter((actor) => actor.sourceCount === 0).length,
      staleCount: countyActors.filter((actor) => actor.freshnessStatus === "stale").length,
      blockedCount: countyActors.filter((actor) => actor.dueState === "blocked").length,
      categoryCounts: toCategoryCounts(countyActors),
      coverageClusters,
      isPilotCounty: isPilotCounty(countySlug),
      isBrowseReady: coverageClusters.every((cluster) => cluster.isReady),
      needsFill: isPilotCounty(countySlug) && coverageClusters.some((cluster) => !cluster.isReady),
    }
  })
}

export const getMunicipalityCoverageSummaries = (actors: CoverageActor[]): MunicipalityCoverageSummary[] => {
  const approvedActors = actors.filter((actor) => actor.status === "approved" && actor.countySlug)
  const grouped = new Map<string, CoverageActor[]>()

  for (const actor of approvedActors) {
    const countySlug = actor.countySlug?.trim()
    const municipality = actor.municipality?.trim() || actor.city?.trim()
    const municipalitySlug = actor.municipalitySlug?.trim()
    if (!countySlug || !municipality || !municipalitySlug) continue
    const key = `${countySlug}:${municipalitySlug}`
    const existing = grouped.get(key) ?? []
    existing.push(actor)
    grouped.set(key, existing)
  }

  return Array.from(grouped.entries())
    .map(([key, municipalityActors]) => {
      const [countySlug, municipalitySlug] = key.split(":")
      const firstActor = municipalityActors[0]
      const countyName =
        firstActor?.county ?? norwayCounties.find((county) => county.slug === countySlug)?.name ?? countySlug
      const municipalityName = firstActor?.municipality ?? firstActor?.city ?? "Ukjent sted"

      return {
        county: countyName,
        countySlug,
        municipality: municipalityName,
        municipalitySlug,
        approvedActorCount: municipalityActors.length,
        missingSourceCount: municipalityActors.filter((actor) => actor.sourceCount === 0).length,
        staleCount: municipalityActors.filter((actor) => actor.freshnessStatus === "stale").length,
        categoryCounts: toCategoryCounts(municipalityActors),
      }
    })
    .sort((left, right) => {
      const countyCompare = left.county.localeCompare(right.county, "no", { sensitivity: "base" })
      if (countyCompare !== 0) return countyCompare
      return left.municipality.localeCompare(right.municipality, "no", { sensitivity: "base" })
    })
}
