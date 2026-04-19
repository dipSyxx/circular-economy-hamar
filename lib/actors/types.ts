import type { ActorCategory, ActorVerificationStatus, FreshnessStatus } from "@/lib/data"

export type ActorSortKey = "default" | "favorite" | "distance" | "name_asc" | "name_desc" | "category"

export type MapBounds = {
  north: number
  south: number
  east: number
  west: number
}

export type ActorBrowseFilters = {
  q: string
  categories: ActorCategory[]
  county: string | null
  municipality: string | null
  tags: string[]
  favoriteOnly: boolean
  sort: ActorSortKey
  page: number
  pageSize: number
  lat: number | null
  lng: number | null
  zoom: number | null
  bounds: MapBounds | null
}

export type ActorListItem = {
  id: string
  slug: string
  name: string
  category: ActorCategory
  description: string
  address: string
  county?: string | null
  countySlug?: string | null
  municipality?: string | null
  municipalitySlug?: string | null
  city?: string | null
  nationwide?: boolean
  image?: string | null
  tagsPreview: string[]
  lat: number
  lng: number
  website?: string | null
  verificationStatus?: ActorVerificationStatus
  verifiedAt?: string | null
  freshnessStatus?: FreshnessStatus
  isTrusted?: boolean
  sourceCount?: number
  isFavorite?: boolean
}

export type ActorMapPoint = {
  id: string
  slug: string
  name: string
  category: ActorCategory
  lat: number
  lng: number
  address: string
  image?: string | null
}

export type ActorMapCluster = {
  id: string
  lat: number
  lng: number
  count: number
}

export type ActorBoundsSummary = {
  north: number
  south: number
  east: number
  west: number
}

export type ActorMapSummary = {
  plottedCount: number
  globalBounds: ActorBoundsSummary | null
}

export type ActorBrowseFacets = {
  counties: Array<{ slug: string; name: string; count: number }>
  municipalities: Array<{ slug: string; name: string; count: number }>
  categories: Array<{ category: ActorCategory; count: number }>
  tags: Array<{ tag: string; count: number }>
}

export type ActorBrowseResponse = {
  items: ActorListItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
  facets: ActorBrowseFacets
}

export type ActorMapResponse = {
  mode: "clusters" | "points"
  totalMatching: number
  resultBounds: ActorBoundsSummary | null
  clusters: ActorMapCluster[]
  points: ActorMapPoint[]
}
