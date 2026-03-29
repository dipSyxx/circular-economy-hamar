import "server-only"

import { guideDocs, guideIntentLabels, guideHubCopy } from "@/content/guides/no"
import { getActorGeographyMatchPriority } from "@/lib/actor-scope"
import { categoryOrder } from "@/lib/categories"
import type { Actor, ActorCategory, GuideDoc } from "@/lib/data"
import { getCountyBySlug } from "@/lib/geo"
import { getActors } from "@/lib/public-data"

const guideBySlug = new Map(guideDocs.map((guide) => [guide.slug, guide]))
const localDiscoveryGuideSlug = "slik-finner-du-lokale-sirkulaere-tilbud"

const freshnessRank = (actor: Actor) => {
  switch (actor.freshnessStatus) {
    case "fresh":
      return 0
    case "aging":
      return 1
    case "stale":
      return 2
    default:
      return 3
  }
}

const compareGuidesByTitle = (left: GuideDoc, right: GuideDoc) =>
  left.title.localeCompare(right.title, "no-NO")

const getBestCountyPriority = (actor: Actor, countySlugs: string[]) => {
  let bestPriority = 99

  for (const countySlug of countySlugs) {
    const priority = getActorGeographyMatchPriority(actor, countySlug)
    if (priority !== null && priority < bestPriority) {
      bestPriority = priority
    }
  }

  return bestPriority
}

const dedupeGuides = (guides: GuideDoc[]) => {
  const seen = new Set<string>()
  return guides.filter((guide) => {
    if (seen.has(guide.slug)) return false
    seen.add(guide.slug)
    return true
  })
}

const ensureLocalDiscoveryGuide = (guides: GuideDoc[]) => {
  const localGuide = guideBySlug.get(localDiscoveryGuideSlug)
  if (!localGuide) return guides
  return dedupeGuides([localGuide, ...guides])
}

const guideMatchesCounty = (guide: GuideDoc, countySlug?: string | null) =>
  Boolean(countySlug && guide.relatedCounties.includes(countySlug))

const guideMatchesCategory = (guide: GuideDoc, category: ActorCategory) =>
  guide.relatedCategories.includes(category)

const sortGuidesForCounty = (guides: GuideDoc[], countySlug?: string | null) =>
  [...guides].sort((left, right) => {
    const leftIsLocal = left.slug === localDiscoveryGuideSlug ? 1 : 0
    const rightIsLocal = right.slug === localDiscoveryGuideSlug ? 1 : 0
    if (leftIsLocal !== rightIsLocal) return rightIsLocal - leftIsLocal

    const leftCountyMatch = guideMatchesCounty(left, countySlug) ? 1 : 0
    const rightCountyMatch = guideMatchesCounty(right, countySlug) ? 1 : 0
    if (leftCountyMatch !== rightCountyMatch) return rightCountyMatch - leftCountyMatch

    return compareGuidesByTitle(left, right)
  })

export const getGuides = () => guideDocs

export const getGuideHubCopy = () => guideHubCopy

export const getGuideIntentLabel = (intent: GuideDoc["primaryIntent"]) => guideIntentLabels[intent]

export const getGuideBySlug = (slug: string) => guideBySlug.get(slug) ?? null

export const getGuideHref = (slug: string) => `/guider/${slug}`

export const getGuidesGroupedByIntent = () =>
  guideDocs.map((guide) => ({
    intent: guide.primaryIntent,
    intentLabel: guideIntentLabels[guide.primaryIntent],
    guides: [guide],
  }))

export const getGuidesForActor = (actor: Actor, limit = 3) => {
  const guides = guideDocs
    .map((guide) => ({
      guide,
      categoryMatch: guideMatchesCategory(guide, actor.category) ? 1 : 0,
      countyMatch: guideMatchesCounty(guide, actor.countySlug) ? 1 : 0,
    }))
    .filter(({ categoryMatch, countyMatch, guide }) => categoryMatch || countyMatch || guide.slug === localDiscoveryGuideSlug)
    .sort((left, right) => {
      if (left.categoryMatch !== right.categoryMatch) return right.categoryMatch - left.categoryMatch
      if (left.countyMatch !== right.countyMatch) return right.countyMatch - left.countyMatch
      return compareGuidesByTitle(left.guide, right.guide)
    })
    .map(({ guide }) => guide)

  return dedupeGuides(guides).slice(0, limit)
}

export const getGuidesForCounty = (countySlug: string, limit = 4) => {
  const guides = guideDocs.filter((guide) => guideMatchesCounty(guide, countySlug))
  return sortGuidesForCounty(ensureLocalDiscoveryGuide(guides), countySlug).slice(0, limit)
}

export const getGuidesForMunicipality = (countySlug: string, limit = 4) => {
  return getGuidesForCounty(countySlug, limit)
}

export const getGuidesForCategory = (
  category: ActorCategory,
  countySlug?: string | null,
  limit = 4,
) => {
  const matchingGuides = guideDocs.filter((guide) => guideMatchesCategory(guide, category))
  return sortGuidesForCounty(matchingGuides, countySlug).slice(0, limit)
}

export const getRelatedGuidesForGuide = (slug: string, limit = 5) => {
  const guide = getGuideBySlug(slug)
  if (!guide) return []

  return [...guideDocs]
    .filter((candidate) => candidate.slug !== slug)
    .sort((left, right) => {
      const leftCategoryOverlap = left.relatedCategories.filter((category) =>
        guide.relatedCategories.includes(category),
      ).length
      const rightCategoryOverlap = right.relatedCategories.filter((category) =>
        guide.relatedCategories.includes(category),
      ).length
      if (leftCategoryOverlap !== rightCategoryOverlap) return rightCategoryOverlap - leftCategoryOverlap

      const leftCountyOverlap = left.relatedCounties.filter((county) => guide.relatedCounties.includes(county)).length
      const rightCountyOverlap = right.relatedCounties.filter((county) => guide.relatedCounties.includes(county)).length
      if (leftCountyOverlap !== rightCountyOverlap) return rightCountyOverlap - leftCountyOverlap

      return compareGuidesByTitle(left, right)
    })
    .slice(0, limit)
}

export const getGuideRelatedActorLimit = () => 6

export const getRelatedActorsForGuide = async (guide: GuideDoc, limit = getGuideRelatedActorLimit()) => {
  const actors = await getActors()
  const relatedCategorySet = new Set<ActorCategory>(guide.relatedCategories)
  const relatedCountySet = new Set(guide.relatedCounties)

  const categoryFiltered = actors.filter((actor) => relatedCategorySet.has(actor.category))
  const candidates = categoryFiltered.length > 0 ? categoryFiltered : actors

  return [...candidates]
    .sort((left, right) => {
      const leftCountyMatch =
        left.countySlug && relatedCountySet.has(left.countySlug)
          ? 1
          : (left.serviceAreaCountySlugs ?? []).some((slug) => relatedCountySet.has(slug))
            ? 1
            : 0
      const rightCountyMatch =
        right.countySlug && relatedCountySet.has(right.countySlug)
          ? 1
          : (right.serviceAreaCountySlugs ?? []).some((slug) => relatedCountySet.has(slug))
            ? 1
            : 0
      if (leftCountyMatch !== rightCountyMatch) return rightCountyMatch - leftCountyMatch

      const leftPriority = getBestCountyPriority(left, guide.relatedCounties)
      const rightPriority = getBestCountyPriority(right, guide.relatedCounties)
      if (leftPriority !== rightPriority) return leftPriority - rightPriority

      const leftTrust = left.isTrusted ? 1 : 0
      const rightTrust = right.isTrusted ? 1 : 0
      if (leftTrust !== rightTrust) return rightTrust - leftTrust

      const freshnessDelta = freshnessRank(left) - freshnessRank(right)
      if (freshnessDelta !== 0) return freshnessDelta

      return left.name.localeCompare(right.name, "no-NO")
    })
    .slice(0, limit)
}

export const getGuideCountyLinks = (guide: GuideDoc) =>
  guide.relatedCounties
    .map((countySlug) => {
      const county = getCountyBySlug(countySlug)
      if (!county) return null
      return { slug: county.slug, label: county.name, href: `/${county.slug}` }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

export const getGuideCategoryLinks = (guide: GuideDoc) =>
  categoryOrder
    .filter((category) => guide.relatedCategories.includes(category))
    .map((category) => ({ category, href: `/kategori/${category}` }))
