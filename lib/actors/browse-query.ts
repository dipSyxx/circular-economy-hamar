import "server-only"

import type { Prisma } from "@prisma/client"
import { getActorTrustState } from "@/lib/actor-trust"
import { categoryOrder } from "@/lib/categories"
import { getCountyBySlug, getMunicipalityBySlug } from "@/lib/geo"
import { prisma } from "@/lib/prisma"
import type {
  ActorBrowseFacets,
  ActorBrowseFilters,
  ActorBrowseResponse,
  ActorListItem,
} from "@/lib/actors/types"
import type { ActorCategory } from "@/lib/data"

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

const getDistanceKm = (from: [number, number], to: [number, number]) => {
  const [lat1, lon1] = from
  const [lat2, lon2] = to
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return 6371 * c
}

const browseActorSelect = {
  id: true,
  name: true,
  slug: true,
  category: true,
  description: true,
  address: true,
  county: true,
  countySlug: true,
  municipality: true,
  municipalitySlug: true,
  city: true,
  nationwide: true,
  image: true,
  lat: true,
  lng: true,
  website: true,
  tags: true,
  searchText: true,
  verificationStatus: true,
  verifiedAt: true,
  browseScopes: {
    select: {
      countySlug: true,
      municipalitySlug: true,
      priority: true,
    },
  },
  _count: {
    select: {
      sources: true,
    },
  },
} satisfies Prisma.ActorSelect

type BrowseActorRow = Prisma.ActorGetPayload<{
  select: typeof browseActorSelect
}>

const getGeographyPriority = (row: BrowseActorRow, filters: Pick<ActorBrowseFilters, "county" | "municipality">) => {
  if (!filters.county) return null

  const matchingScopes = row.browseScopes.filter((scope) => {
    if (scope.countySlug !== filters.county) return false
    if (!filters.municipality) {
      return scope.municipalitySlug === null
    }
    return scope.municipalitySlug === null || scope.municipalitySlug === filters.municipality
  })

  if (!matchingScopes.length) return null
  return Math.min(...matchingScopes.map((scope) => scope.priority))
}

const getSearchScore = (row: BrowseActorRow, query: string) => {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) return 0

  const normalizedName = normalizeText(row.name)
  const normalizedDescription = normalizeText(row.description)
  const normalizedAddress = normalizeText(row.address)
  const normalizedSearchText = normalizeText(row.searchText)

  let score = 0
  if (normalizedName === normalizedQuery) score += 100
  if (normalizedName.startsWith(normalizedQuery)) score += 60
  if (normalizedName.includes(normalizedQuery)) score += 40
  if (normalizedDescription.includes(normalizedQuery)) score += 20
  if (normalizedAddress.includes(normalizedQuery)) score += 10
  if (normalizedSearchText.includes(normalizedQuery)) score += 5
  return score
}

const compareByName = (left: BrowseActorRow, right: BrowseActorRow) =>
  left.name.localeCompare(right.name, "no", { sensitivity: "base", numeric: true })

const buildBrowseWhere = (filters: Partial<ActorBrowseFilters>, userId?: string | null): Prisma.ActorWhereInput => {
  const where: Prisma.ActorWhereInput = {
    status: "approved",
  }

  if (filters.q?.trim()) {
    where.searchText = {
      contains: filters.q.trim(),
      mode: "insensitive",
    }
  }

  if (filters.categories?.length) {
    where.category = {
      in: filters.categories,
    }
  }

  if (filters.tags?.length) {
    where.tags = {
      hasSome: filters.tags,
    }
  }

  if (filters.favoriteOnly && userId) {
    where.favorites = {
      some: {
        userId,
      },
    }
  }

  if (filters.county) {
    where.browseScopes = {
      some: filters.municipality
        ? {
            countySlug: filters.county,
            OR: [{ municipalitySlug: null }, { municipalitySlug: filters.municipality }],
          }
        : {
            countySlug: filters.county,
            municipalitySlug: null,
          },
    }
  }

  if (filters.bounds) {
    where.lat = {
      gte: filters.bounds.south,
      lte: filters.bounds.north,
    }
    where.lng = {
      gte: filters.bounds.west,
      lte: filters.bounds.east,
    }
  }

  return where
}

const fetchBrowseRows = async (filters: Partial<ActorBrowseFilters>, userId?: string | null) =>
  prisma.actor.findMany({
    where: buildBrowseWhere(filters, userId),
    select: browseActorSelect,
  })

const toListItem = (row: BrowseActorRow, favoriteIds: Set<string>): ActorListItem => {
  const sourceCount = row._count.sources
  const trustState = getActorTrustState({
    verificationStatus: row.verificationStatus,
    verifiedAt: row.verifiedAt,
    sourceCount,
  })

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description,
    address: row.address,
    county: row.county,
    countySlug: row.countySlug,
    municipality: row.municipality,
    municipalitySlug: row.municipalitySlug,
    city: row.city,
    nationwide: row.nationwide,
    image: row.image,
    tagsPreview: row.tags.slice(0, 3),
    lat: row.lat,
    lng: row.lng,
    website: row.website,
    verificationStatus: row.verificationStatus,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    freshnessStatus: trustState.freshnessStatus,
    isTrusted: trustState.isTrusted,
    sourceCount,
    isFavorite: favoriteIds.has(row.id),
  }
}

const buildCountiesFacet = (rows: BrowseActorRow[]) => {
  const counts = new Map<string, Set<string>>()
  for (const row of rows) {
    for (const scope of row.browseScopes) {
      if (scope.municipalitySlug !== null) continue
      const key = scope.countySlug
      if (!counts.has(key)) counts.set(key, new Set())
      counts.get(key)?.add(row.id)
    }
  }

  return Array.from(counts.entries())
    .map(([slug, actorIds]) => ({
      slug,
      name: getCountyBySlug(slug)?.name ?? slug,
      count: actorIds.size,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "no", { sensitivity: "base" }))
}

const buildMunicipalitiesFacet = (rows: BrowseActorRow[], countySlug: string | null) => {
  if (!countySlug) return []

  const counts = new Map<string, Set<string>>()
  for (const row of rows) {
    for (const scope of row.browseScopes) {
      if (scope.countySlug !== countySlug || !scope.municipalitySlug) continue
      if (!counts.has(scope.municipalitySlug)) counts.set(scope.municipalitySlug, new Set())
      counts.get(scope.municipalitySlug)?.add(row.id)
    }
  }

  return Array.from(counts.entries())
    .map(([slug, actorIds]) => ({
      slug,
      name: getMunicipalityBySlug(slug, countySlug)?.name ?? slug,
      count: actorIds.size,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "no", { sensitivity: "base" }))
}

const buildCategoriesFacet = (rows: BrowseActorRow[]) => {
  const counts = new Map<ActorCategory, number>()
  for (const row of rows) {
    counts.set(row.category, (counts.get(row.category) ?? 0) + 1)
  }

  return categoryOrder
    .filter((category) => counts.has(category))
    .map((category) => ({
      category,
      count: counts.get(category) ?? 0,
    }))
}

const buildTagsFacet = (rows: BrowseActorRow[]) => {
  const counts = new Map<string, number>()
  for (const row of rows) {
    for (const tag of new Set(row.tags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => left.tag.localeCompare(right.tag, "no", { sensitivity: "base", numeric: true }))
}

const buildBrowseFacets = async (
  filters: ActorBrowseFilters,
  userId?: string | null,
): Promise<ActorBrowseFacets> => {
  const [countyRows, municipalityRows, categoryRows, tagRows] = await Promise.all([
    fetchBrowseRows({ favoriteOnly: filters.favoriteOnly }, userId),
    fetchBrowseRows({ favoriteOnly: filters.favoriteOnly, county: filters.county }, userId),
    fetchBrowseRows(
      {
        favoriteOnly: filters.favoriteOnly,
        county: filters.county,
        municipality: filters.municipality,
      },
      userId,
    ),
    fetchBrowseRows(
      {
        favoriteOnly: filters.favoriteOnly,
        county: filters.county,
        municipality: filters.municipality,
        categories: filters.categories,
      },
      userId,
    ),
  ])

  return {
    counties: buildCountiesFacet(countyRows),
    municipalities: buildMunicipalitiesFacet(municipalityRows, filters.county),
    categories: buildCategoriesFacet(categoryRows),
    tags: buildTagsFacet(tagRows),
  }
}

const sortBrowseRows = (
  rows: BrowseActorRow[],
  filters: ActorBrowseFilters,
  favoriteIds: Set<string>,
) => {
  const hasUserLocation = typeof filters.lat === "number" && typeof filters.lng === "number"
  const userLocation = hasUserLocation ? ([filters.lat as number, filters.lng as number] as [number, number]) : null

  const categoryIndex = new Map(categoryOrder.map((category, index) => [category, index]))

  return [...rows].sort((left, right) => {
    const leftGeoPriority = getGeographyPriority(left, filters) ?? 99
    const rightGeoPriority = getGeographyPriority(right, filters) ?? 99

    if (filters.sort === "favorite") {
      const leftFavorite = favoriteIds.has(left.id) ? 1 : 0
      const rightFavorite = favoriteIds.has(right.id) ? 1 : 0
      if (leftFavorite !== rightFavorite) return rightFavorite - leftFavorite
      if (leftGeoPriority !== rightGeoPriority) return leftGeoPriority - rightGeoPriority
      return compareByName(left, right)
    }

    if (filters.sort === "distance" && userLocation) {
      if (leftGeoPriority !== rightGeoPriority) return leftGeoPriority - rightGeoPriority
      return (
        getDistanceKm(userLocation, [left.lat, left.lng]) - getDistanceKm(userLocation, [right.lat, right.lng])
      )
    }

    if (filters.sort === "name_asc") {
      if (leftGeoPriority !== rightGeoPriority) return leftGeoPriority - rightGeoPriority
      return compareByName(left, right)
    }

    if (filters.sort === "name_desc") {
      if (leftGeoPriority !== rightGeoPriority) return leftGeoPriority - rightGeoPriority
      return compareByName(right, left)
    }

    if (filters.sort === "category") {
      if (leftGeoPriority !== rightGeoPriority) return leftGeoPriority - rightGeoPriority
      const leftCategory = categoryIndex.get(left.category) ?? 999
      const rightCategory = categoryIndex.get(right.category) ?? 999
      if (leftCategory !== rightCategory) return leftCategory - rightCategory
      return compareByName(left, right)
    }

    if (filters.county || filters.municipality) {
      if (leftGeoPriority !== rightGeoPriority) return leftGeoPriority - rightGeoPriority
      return compareByName(left, right)
    }

    if (filters.q) {
      const scoreDelta = getSearchScore(right, filters.q) - getSearchScore(left, filters.q)
      if (scoreDelta !== 0) return scoreDelta
      return compareByName(left, right)
    }

    return compareByName(left, right)
  })
}

const fetchFavoriteIds = async (userId: string | null | undefined, actorIds: string[]) => {
  if (!userId || actorIds.length === 0) return new Set<string>()
  const favorites = await prisma.actorFavorite.findMany({
    where: {
      userId,
      actorId: {
        in: actorIds,
      },
    },
    select: {
      actorId: true,
    },
  })

  return new Set(favorites.map((favorite) => favorite.actorId))
}

export const getBrowseResponse = async (
  filters: ActorBrowseFilters,
  userId?: string | null,
): Promise<ActorBrowseResponse> => {
  const [filteredRows, facets] = await Promise.all([
    fetchBrowseRows(filters, userId),
    buildBrowseFacets(filters, userId),
  ])

  const favoriteIds = await fetchFavoriteIds(userId, filteredRows.map((row) => row.id))
  const sortedRows = sortBrowseRows(filteredRows, filters, favoriteIds)
  const total = sortedRows.length
  const start = (filters.page - 1) * filters.pageSize
  const pageRows = sortedRows.slice(start, start + filters.pageSize)

  return {
    items: pageRows.map((row) => toListItem(row, favoriteIds)),
    page: filters.page,
    pageSize: filters.pageSize,
    total,
    hasMore: start + filters.pageSize < total,
    facets,
  }
}
