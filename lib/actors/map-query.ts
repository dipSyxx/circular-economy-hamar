import "server-only"

import type { Prisma } from "@prisma/client"
import { unstable_cache } from "next/cache"
import Supercluster from "supercluster"
import { prisma } from "@/lib/prisma"
import { getMapResponseMode } from "@/lib/actors/map-mode"
import type {
  ActorBoundsSummary,
  ActorBrowseFilters,
  ActorMapPoint,
  ActorMapResponse,
  ActorMapSummary,
} from "@/lib/actors/types"

const mapPointSelect = {
  id: true,
  slug: true,
  name: true,
  category: true,
  lat: true,
  lng: true,
  address: true,
  image: true,
} satisfies Prisma.ActorSelect

type MapPointRow = Prisma.ActorGetPayload<{
  select: typeof mapPointSelect
}>

const buildMapWhere = (filters: Partial<ActorBrowseFilters>, userId?: string | null): Prisma.ActorWhereInput => {
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

const toPoint = (row: MapPointRow): ActorMapPoint => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  category: row.category,
  lat: row.lat,
  lng: row.lng,
  address: row.address,
  image: row.image,
})

const getBoundsFromPoints = (points: Array<{ lat: number; lng: number }>): ActorBoundsSummary | null => {
  if (!points.length) return null

  return points.reduce<ActorBoundsSummary>(
    (acc, point) => ({
      north: Math.max(acc.north, point.lat),
      south: Math.min(acc.south, point.lat),
      east: Math.max(acc.east, point.lng),
      west: Math.min(acc.west, point.lng),
    }),
    {
      north: points[0].lat,
      south: points[0].lat,
      east: points[0].lng,
      west: points[0].lng,
    },
  )
}

const mapSummaryCached = unstable_cache(
  async (): Promise<ActorMapSummary> => {
    const rows = await prisma.actor.findMany({
      where: { status: "approved" },
      select: { lat: true, lng: true },
    })

    return {
      plottedCount: rows.length,
      globalBounds: getBoundsFromPoints(rows),
    }
  },
  ["actor-map-summary"],
  { revalidate: 300, tags: ["public-actors"] },
)

export const getActorMapSummary = () => mapSummaryCached()

export const getMapResponse = async (
  filters: ActorBrowseFilters,
  userId?: string | null,
): Promise<ActorMapResponse> => {
  const rows = await prisma.actor.findMany({
    where: buildMapWhere(filters, userId),
    select: mapPointSelect,
  })

  const points = rows.map(toPoint)
  const resultBounds = getBoundsFromPoints(points)
  const zoom = Math.max(0, Math.floor(filters.zoom ?? 0))
  const mode = getMapResponseMode(filters.zoom)

  if (mode === "points" || !filters.bounds) {
    return {
      mode: "points",
      totalMatching: points.length,
      resultBounds,
      clusters: [],
      points,
    }
  }

  const index = new Supercluster<{ pointId: string }>({
    radius: 60,
    maxZoom: 17,
  })

  index.load(
    points.map((point) => ({
      type: "Feature" as const,
      properties: {
        pointId: point.id,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [point.lng, point.lat] as [number, number],
      },
    })),
  )

  const clusterResults = index.getClusters(
    [filters.bounds.west, filters.bounds.south, filters.bounds.east, filters.bounds.north],
    Math.max(0, Math.min(zoom, 17)),
  )
  const pointById = new Map(points.map((point) => [point.id, point]))
  const clusters = clusterResults.flatMap((feature) => {
    const properties = feature.properties as { cluster?: boolean; point_count?: number }
    if (!properties.cluster) return []
    return [
      {
        id: String((feature as { id?: string | number }).id ?? ""),
        lat: Number(feature.geometry.coordinates[1]),
        lng: Number(feature.geometry.coordinates[0]),
        count: properties.point_count ?? 0,
      },
    ]
  })
  const visiblePoints = clusterResults.flatMap((feature) => {
      const pointId = (feature.properties as { pointId?: string }).pointId
      return pointId ? [pointById.get(pointId)].filter(Boolean) as ActorMapPoint[] : []
    })

  return {
    mode: "clusters",
    totalMatching: points.length,
    resultBounds,
    clusters,
    points: visiblePoints,
  }
}
