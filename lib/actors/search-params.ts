import { categoryOrder } from "@/lib/categories"
import type { ActorBrowseFilters, ActorSortKey, MapBounds } from "@/lib/actors/types"
import type { ActorCategory } from "@/lib/data"

const sortKeys: ActorSortKey[] = ["default", "favorite", "distance", "name_asc", "name_desc", "category"]

const toSingle = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] ?? ""
  return value ?? ""
}

const parseStringList = (searchParams: URLSearchParams, key: string) =>
  Array.from(new Set(searchParams.getAll(key).map((value) => value.trim()).filter(Boolean)))

const parseCategoryList = (searchParams: URLSearchParams) => {
  const values = Array.from(
    new Set([...parseStringList(searchParams, "category"), ...parseStringList(searchParams, "categories")]),
  )
  return values.filter((value): value is ActorCategory =>
    categoryOrder.includes(value as ActorCategory),
  )
}

const parseNumber = (value: string | null) => {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseBounds = (searchParams: URLSearchParams): MapBounds | null => {
  const north = parseNumber(searchParams.get("north"))
  const south = parseNumber(searchParams.get("south"))
  const east = parseNumber(searchParams.get("east"))
  const west = parseNumber(searchParams.get("west"))

  if ([north, south, east, west].some((value) => value === null)) {
    return null
  }

  if (north === null || south === null || east === null || west === null) {
    return null
  }

  return { north, south, east, west }
}

const clampPositiveInt = (value: string | null, fallback: number, max: number) => {
  if (value === null || value.trim() === "") return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(Math.floor(parsed), 1), max)
}

export const parseActorBrowseFilters = (
  searchParams: URLSearchParams,
  defaults: Partial<Pick<ActorBrowseFilters, "pageSize" | "sort">> = {},
): ActorBrowseFilters => {
  const sortCandidate = searchParams.get("sort") ?? defaults.sort ?? "default"
  const county = searchParams.get("county")?.trim() ?? ""
  const municipality = searchParams.get("municipality")?.trim() ?? ""

  return {
    q: searchParams.get("q")?.trim() ?? "",
    categories: parseCategoryList(searchParams),
    county: county || null,
    municipality: county ? municipality || null : null,
    tags: parseStringList(searchParams, "tag"),
    favoriteOnly: ["1", "true", "yes"].includes((searchParams.get("favoriteOnly") ?? "").toLowerCase()),
    sort: sortKeys.includes(sortCandidate as ActorSortKey) ? (sortCandidate as ActorSortKey) : "default",
    page: clampPositiveInt(searchParams.get("page"), 1, 9999),
    pageSize: clampPositiveInt(searchParams.get("pageSize"), defaults.pageSize ?? 24, 48),
    lat: parseNumber(searchParams.get("lat")),
    lng: parseNumber(searchParams.get("lng")),
    zoom: parseNumber(searchParams.get("zoom")),
    bounds: parseBounds(searchParams),
  }
}

export const buildActorBrowseSearchParams = (filters: ActorBrowseFilters) => {
  const params = new URLSearchParams()

  if (filters.q) params.set("q", filters.q)
  for (const category of filters.categories) params.append("category", category)
  if (filters.county) params.set("county", filters.county)
  if (filters.municipality) params.set("municipality", filters.municipality)
  for (const tag of filters.tags) params.append("tag", tag)
  if (filters.favoriteOnly) params.set("favoriteOnly", "true")
  if (filters.sort !== "default") params.set("sort", filters.sort)
  if (filters.page > 1) params.set("page", String(filters.page))
  if (filters.pageSize !== 24) params.set("pageSize", String(filters.pageSize))
  if (typeof filters.lat === "number" && typeof filters.lng === "number") {
    params.set("lat", String(filters.lat))
    params.set("lng", String(filters.lng))
  }
  if (typeof filters.zoom === "number") params.set("zoom", String(filters.zoom))
  if (filters.bounds) {
    params.set("north", String(filters.bounds.north))
    params.set("south", String(filters.bounds.south))
    params.set("east", String(filters.bounds.east))
    params.set("west", String(filters.bounds.west))
  }

  return params
}

export const searchParamsFromObject = (value: Record<string, string | string[] | undefined>) => {
  const params = new URLSearchParams()

  for (const [key, rawValue] of Object.entries(value)) {
    if (typeof rawValue === "undefined") continue
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (item) params.append(key, item)
      }
      continue
    }
    const item = toSingle(rawValue)
    if (item) params.set(key, item)
  }

  return params
}
