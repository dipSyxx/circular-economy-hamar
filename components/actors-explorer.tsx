"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { Crosshair, Search, SlidersHorizontal, X } from "lucide-react"
import type { Actor, ActorCategory } from "@/lib/data"
import { ActorCard } from "@/components/actor-card"
import { authClient } from "@/lib/auth/client"
import { actorCopy, mapCopy } from "@/content/no"
import {
  getActorGeographyMatchPriority,
  getAvailableCountyOptions,
  getAvailableMunicipalityOptions,
} from "@/lib/actor-scope"
import { categoryConfig, categoryOrder } from "@/lib/categories"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type SortKey = "default" | "favorite" | "distance" | "name_asc" | "name_desc" | "category"
type TagOption = { tag: string; count: number }
type ActorsExplorerProps = {
  actors: Actor[]
  enableGeographyFilters?: boolean
  syncToUrl?: boolean
  initialQuery?: string
  initialCategory?: ActorCategory | null
  initialCounty?: string | null
  initialMunicipality?: string | null
}

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: "default", label: "Standard" },
  { value: "favorite", label: "Favoritter først" },
  { value: "distance", label: "Nærmest meg" },
  { value: "name_asc", label: "Navn A-Z" },
  { value: "name_desc", label: "Navn Z-A" },
  { value: "category", label: "Kategori" },
]

const STORAGE_KEY = "actors-explorer-state"
const LOCATION_TTL_MS = 1000 * 60 * 60 * 24
const ALL_COUNTIES = "__all_counties__"
const ALL_MUNICIPALITIES = "__all_municipalities__"

const normalizeText = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

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

const formatCategoryLabel = (category: ActorCategory) => actorCopy.categoryLabels[category] ?? category

export function ActorsExplorer({
  actors,
  enableGeographyFilters = false,
  syncToUrl = false,
  initialQuery = "",
  initialCategory = null,
  initialCounty = null,
  initialMunicipality = null,
}: ActorsExplorerProps) {
  const { data } = authClient.useSession()
  const router = useRouter()
  const pathname = usePathname()
  const isSignedIn = Boolean(data?.session)
  const [query, setQuery] = useState(initialQuery)
  const [sortKey, setSortKey] = useState<SortKey>("default")
  const [categoryFilters, setCategoryFilters] = useState<ActorCategory[]>(initialCategory ? [initialCategory] : [])
  const [countyFilter, setCountyFilter] = useState(enableGeographyFilters ? (initialCounty ?? "") : "")
  const [municipalityFilter, setMunicipalityFilter] = useState(
    enableGeographyFilters ? (initialMunicipality ?? "") : "",
  )
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [tagQuery, setTagQuery] = useState("")
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [favoritesLoaded, setFavoritesLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<number | null>(null)
  const [hasRestoredState, setHasRestoredState] = useState(false)
  const [visibleCount, setVisibleCount] = useState(24)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const categoryIndex = useMemo(() => new Map(categoryOrder.map((category, index) => [category, index])), [])

  const countyOptions = useMemo(() => getAvailableCountyOptions(actors), [actors])

  const safeCountyFilter = useMemo(() => {
    if (!enableGeographyFilters || !countyFilter) return ""
    return countyOptions.some((option) => option.slug === countyFilter) ? countyFilter : ""
  }, [countyFilter, countyOptions, enableGeographyFilters])

  const municipalityOptions = useMemo(
    () => (enableGeographyFilters && safeCountyFilter ? getAvailableMunicipalityOptions(actors, safeCountyFilter) : []),
    [actors, enableGeographyFilters, safeCountyFilter],
  )

  const safeMunicipalityFilter = useMemo(() => {
    if (!enableGeographyFilters || !safeCountyFilter || !municipalityFilter) return ""
    return municipalityOptions.some((option) => option.slug === municipalityFilter) ? municipalityFilter : ""
  }, [enableGeographyFilters, municipalityFilter, municipalityOptions, safeCountyFilter])

  const baseActors = useMemo(() => {
    if (!favoriteOnly) return actors
    return actors.filter((actor) => favoriteIds.has(actor.id))
  }, [actors, favoriteIds, favoriteOnly])

  const geographyScopedActors = useMemo(() => {
    if (!enableGeographyFilters || !safeCountyFilter) return baseActors
    return baseActors.filter(
      (actor) => getActorGeographyMatchPriority(actor, safeCountyFilter, safeMunicipalityFilter) !== null,
    )
  }, [baseActors, enableGeographyFilters, safeCountyFilter, safeMunicipalityFilter])

  const availableCategories = useMemo(() => {
    const set = new Set(geographyScopedActors.map((actor) => actor.category))
    return categoryOrder.filter((category) => set.has(category))
  }, [geographyScopedActors])

  const tagOptions = useMemo<TagOption[]>(() => {
    const counts = new Map<string, number>()
    geographyScopedActors.forEach((actor) => {
      actor.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1))
    })
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => a.tag.localeCompare(b.tag, "no", { sensitivity: "base", numeric: true }))
  }, [geographyScopedActors])

  const filteredTagOptions = useMemo(() => {
    const normalized = normalizeText(tagQuery.trim())
    if (!normalized) return tagOptions
    return tagOptions.filter((option) => normalizeText(option.tag).includes(normalized))
  }, [tagOptions, tagQuery])

  const normalizedQuery = normalizeText(query.trim())

  const filteredActors = useMemo(() => {
    return geographyScopedActors.filter((actor) => {
      if (categoryFilters.length > 0 && !categoryFilters.includes(actor.category)) return false
      if (tagFilters.length > 0 && !tagFilters.some((tag) => (actor.tags ?? []).includes(tag))) return false
      if (!normalizedQuery) return true
      const searchText = normalizeText(
        [
          actor.name,
          actor.description,
          actor.longDescription,
          actor.address,
          actor.county,
          actor.municipality,
          actor.city,
          actor.tags.join(" "),
          formatCategoryLabel(actor.category),
        ]
          .filter(Boolean)
          .join(" "),
      )
      return searchText.includes(normalizedQuery)
    })
  }, [categoryFilters, geographyScopedActors, normalizedQuery, tagFilters])

  const sortedActors = useMemo(() => {
    const sorted = [...filteredActors]
    const geographyPriority = (actor: Actor) =>
      safeCountyFilter
        ? (getActorGeographyMatchPriority(actor, safeCountyFilter, safeMunicipalityFilter) ?? 99)
        : 0
    if (sortKey === "favorite") {
      sorted.sort((a, b) => {
        const geographyDelta = geographyPriority(a) - geographyPriority(b)
        if (geographyDelta !== 0) return geographyDelta
        const left = favoriteIds.has(a.id) ? 1 : 0
        const right = favoriteIds.has(b.id) ? 1 : 0
        if (left !== right) return right - left
        return a.name.localeCompare(b.name, "no", { sensitivity: "base", numeric: true })
      })
      return sorted
    }
    if (sortKey === "distance") {
      if (!userLocation) return sorted
      return sorted.sort((a, b) => {
        const geographyDelta = geographyPriority(a) - geographyPriority(b)
        if (geographyDelta !== 0) return geographyDelta
        return getDistanceKm(userLocation, [a.lat, a.lng]) - getDistanceKm(userLocation, [b.lat, b.lng])
      })
    }
    if (sortKey === "name_asc") {
      sorted.sort((a, b) => {
        const geographyDelta = geographyPriority(a) - geographyPriority(b)
        if (geographyDelta !== 0) return geographyDelta
        return a.name.localeCompare(b.name, "no", { sensitivity: "base", numeric: true })
      })
      return sorted
    }
    if (sortKey === "name_desc") {
      sorted.sort((a, b) => {
        const geographyDelta = geographyPriority(a) - geographyPriority(b)
        if (geographyDelta !== 0) return geographyDelta
        return b.name.localeCompare(a.name, "no", { sensitivity: "base", numeric: true })
      })
      return sorted
    }
    if (sortKey === "category") {
      sorted.sort((a, b) => {
        const geographyDelta = geographyPriority(a) - geographyPriority(b)
        if (geographyDelta !== 0) return geographyDelta
        const left = categoryIndex.get(a.category) ?? 999
        const right = categoryIndex.get(b.category) ?? 999
        if (left !== right) return left - right
        return a.name.localeCompare(b.name, "no", { sensitivity: "base", numeric: true })
      })
      return sorted
    }
    if (!userLocation) return sorted
    return sorted.sort((a, b) => {
      const geographyDelta = geographyPriority(a) - geographyPriority(b)
      if (geographyDelta !== 0) return geographyDelta
      return getDistanceKm(userLocation, [a.lat, a.lng]) - getDistanceKm(userLocation, [b.lat, b.lng])
    })
  }, [categoryIndex, favoriteIds, filteredActors, safeCountyFilter, safeMunicipalityFilter, sortKey, userLocation])

  useEffect(() => {
    setVisibleCount(24)
  }, [sortedActors.length, query, categoryFilters, tagFilters, safeCountyFilter, safeMunicipalityFilter, favoriteOnly])

  const visibleActors = sortedActors.slice(0, visibleCount)
  const hiddenCount = sortedActors.length - visibleCount

  const activeFilterCount =
    categoryFilters.length +
    tagFilters.length +
    (favoriteOnly ? 1 : 0) +
    (safeCountyFilter ? 1 : 0) +
    (safeMunicipalityFilter ? 1 : 0)
  const hasAnyFilter = activeFilterCount > 0 || Boolean(query.trim())

  const toggleCategory = (category: ActorCategory) => {
    setCategoryFilters((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
    )
  }

  const toggleTag = (tag: string) => {
    setTagFilters((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]))
  }

  const clearFilterSelections = () => {
    setCategoryFilters([])
    setTagFilters([])
    setTagQuery("")
    setFavoriteOnly(false)
    setCountyFilter("")
    setMunicipalityFilter("")
  }

  const clearAllFilters = () => {
    setQuery("")
    clearFilterSelections()
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(mapCopy.locationError)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude])
        setLocationUpdatedAt(Date.now())
        setLocationError(null)
      },
      () => setLocationError(mapCopy.locationError),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  useEffect(() => {
    if (safeCountyFilter !== countyFilter) setCountyFilter(safeCountyFilter)
  }, [countyFilter, safeCountyFilter])

  useEffect(() => {
    if (!enableGeographyFilters) return
    if (!safeCountyFilter && municipalityFilter) {
      setMunicipalityFilter("")
      return
    }
    if (safeMunicipalityFilter !== municipalityFilter) setMunicipalityFilter(safeMunicipalityFilter)
  }, [enableGeographyFilters, municipalityFilter, safeCountyFilter, safeMunicipalityFilter])

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const stored = JSON.parse(raw) as {
          query?: string
          sortKey?: SortKey
          categoryFilters?: ActorCategory[]
          countyFilter?: string
          municipalityFilter?: string
          tagFilters?: string[]
          tagQuery?: string
          favoriteOnly?: boolean
          userLocation?: [number, number]
          locationUpdatedAt?: number
        }
        if (!syncToUrl && typeof stored.query === "string") setQuery(stored.query)
        if (sortOptions.some((option) => option.value === stored.sortKey)) setSortKey(stored.sortKey as SortKey)
        if (!syncToUrl && Array.isArray(stored.categoryFilters)) {
          setCategoryFilters(stored.categoryFilters.filter((category) => categoryOrder.includes(category)))
        }
        if (!syncToUrl && enableGeographyFilters) {
          if (typeof stored.countyFilter === "string") setCountyFilter(stored.countyFilter)
          if (typeof stored.municipalityFilter === "string") setMunicipalityFilter(stored.municipalityFilter)
        }
        if (Array.isArray(stored.tagFilters)) setTagFilters(stored.tagFilters.filter((tag) => typeof tag === "string"))
        if (typeof stored.tagQuery === "string") setTagQuery(stored.tagQuery)
        if (typeof stored.favoriteOnly === "boolean") setFavoriteOnly(stored.favoriteOnly)
        if (
          Array.isArray(stored.userLocation) &&
          stored.userLocation.length === 2 &&
          typeof stored.userLocation[0] === "number" &&
          typeof stored.userLocation[1] === "number" &&
          Number.isFinite(stored.locationUpdatedAt) &&
          Date.now() - (stored.locationUpdatedAt as number) < LOCATION_TTL_MS
        ) {
          setUserLocation([stored.userLocation[0], stored.userLocation[1]])
          setLocationUpdatedAt(stored.locationUpdatedAt as number)
        }
      } catch {
        // ignore storage errors
      }
    }
    setHasRestoredState(true)
  }, [enableGeographyFilters, syncToUrl])

  useEffect(() => {
    if (typeof window === "undefined" || !hasRestoredState) return
    const payload = {
      query,
      sortKey,
      categoryFilters,
      countyFilter: safeCountyFilter,
      municipalityFilter: safeMunicipalityFilter,
      tagFilters,
      tagQuery,
      favoriteOnly,
      userLocation,
      locationUpdatedAt,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [
    categoryFilters,
    favoriteOnly,
    hasRestoredState,
    locationUpdatedAt,
    query,
    safeCountyFilter,
    safeMunicipalityFilter,
    sortKey,
    tagFilters,
    tagQuery,
    userLocation,
  ])

  useEffect(() => {
    if (!syncToUrl || !hasRestoredState) return
    const params = new URLSearchParams()
    const trimmedQuery = query.trim()
    if (trimmedQuery) params.set("q", trimmedQuery)
    if (categoryFilters.length === 1) params.set("category", categoryFilters[0])
    if (safeCountyFilter) params.set("county", safeCountyFilter)
    if (safeCountyFilter && safeMunicipalityFilter) params.set("municipality", safeMunicipalityFilter)
    if (typeof window === "undefined") return
    const nextQuery = params.toString()
    const currentQuery = window.location.search.startsWith("?")
      ? window.location.search.slice(1)
      : window.location.search
    if (currentQuery === nextQuery) return
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname
    startTransition(() => {
      router.replace(nextUrl, { scroll: false })
    })
  }, [
    categoryFilters,
    hasRestoredState,
    pathname,
    query,
    router,
    safeCountyFilter,
    safeMunicipalityFilter,
    syncToUrl,
  ])

  useEffect(() => {
    if (!isSignedIn) {
      setFavoriteIds(new Set())
      setFavoritesLoaded(true)
      return
    }
    let active = true
    const loadFavorites = async () => {
      try {
        const response = await fetch("/api/public/favorites")
        if (!response.ok) return
        const data = (await response.json()) as Array<{ actorId: string }>
        if (!active) return
        setFavoriteIds(new Set(data.map((item) => item.actorId)))
      } finally {
        if (active) setFavoritesLoaded(true)
      }
    }
    void loadFavorites()
    return () => {
      active = false
    }
  }, [isSignedIn])

  const toggleFavorite = async (actorId: string) => {
    if (!isSignedIn) {
      window.location.href = "/auth/sign-in"
      return
    }
    const isFavorite = favoriteIds.has(actorId)
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (isFavorite) next.delete(actorId)
      else next.add(actorId)
      return next
    })
    const response = isFavorite
      ? await fetch(`/api/public/favorites/${actorId}`, { method: "DELETE" })
      : await fetch("/api/public/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actorId }),
        })
    if (!response.ok) {
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (isFavorite) next.add(actorId)
        else next.delete(actorId)
        return next
      })
    }
  }

  const desktopGridClassName = enableGeographyFilters
    ? "hidden gap-3 md:grid xl:grid-cols-[minmax(0,1fr)_180px_180px_180px_auto_auto] xl:items-center"
    : "hidden gap-3 md:grid lg:grid-cols-[minmax(0,1fr)_180px_auto_auto] lg:items-center"

  const searchField = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Søk etter aktører, tagger eller adresse"
        className="h-10 rounded-[18px] border-border/70 bg-background pl-9 pr-10 shadow-none md:h-11 md:rounded-xl"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:text-foreground"
          aria-label="Fjern søk"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )

  const filterSections = (showGeographyInPanel: boolean) => (
    <div className="space-y-4">
      {showGeographyInPanel && enableGeographyFilters ? (
        <>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Geografi</p>
              <Select
                value={safeCountyFilter || ALL_COUNTIES}
                onValueChange={(value) => {
                  setCountyFilter(value === ALL_COUNTIES ? "" : value)
                  setMunicipalityFilter("")
                }}
              >
                <SelectTrigger className="mt-2 h-11 w-full rounded-xl">
                  <SelectValue placeholder="Fylke" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_COUNTIES}>Alle fylker</SelectItem>
                  {countyOptions.map((option) => (
                    <SelectItem key={option.slug} value={option.slug}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={safeMunicipalityFilter || ALL_MUNICIPALITIES}
                onValueChange={(value) => setMunicipalityFilter(value === ALL_MUNICIPALITIES ? "" : value)}
                disabled={!safeCountyFilter || municipalityOptions.length === 0}
              >
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue placeholder="Kommune/by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_MUNICIPALITIES}>Alle kommuner/byer</SelectItem>
                  {municipalityOptions.map((option) => (
                    <SelectItem key={option.slug} value={option.slug}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
        </>
      ) : null}

      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Favoritter</p>
        <label
          className={cn(
            "mt-2 flex items-center gap-2 rounded-xl border px-3 py-3 text-sm transition",
            favoriteOnly && "border-primary/40 bg-primary/5",
            !isSignedIn && "opacity-60",
          )}
        >
          <Checkbox
            checked={favoriteOnly}
            onCheckedChange={(next) => setFavoriteOnly(Boolean(next))}
            disabled={!isSignedIn}
          />
          <span>Vis bare favoritter</span>
        </label>
        {!isSignedIn ? (
          <p className="mt-2 text-xs text-muted-foreground">Logg inn for å bruke favoritter.</p>
        ) : null}
      </div>

      <Separator />

      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Kategori</p>
        <div className="mt-2 grid gap-2">
          {availableCategories.map((category) => {
            const isChecked = categoryFilters.includes(category)
            const color = categoryConfig[category]?.color ?? "#64748b"
            return (
              <label
                key={category}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-3 text-sm transition",
                  isChecked && "border-primary/40 bg-primary/5",
                )}
              >
                <Checkbox checked={isChecked} onCheckedChange={() => toggleCategory(category)} />
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate">{formatCategoryLabel(category)}</span>
              </label>
            )
          })}
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Tagger</p>
        <Input
          value={tagQuery}
          onChange={(event) => setTagQuery(event.target.value)}
          placeholder="Søk tagger"
          className="mt-2 h-11 rounded-xl"
        />
        <ScrollArea className="mt-2 h-48 pr-3">
          <div className="grid gap-2">
            {filteredTagOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ingen tagger.</p>
            ) : (
              filteredTagOptions.map((option) => {
                const isChecked = tagFilters.includes(option.tag)
                return (
                  <label
                    key={option.tag}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-3 text-sm transition",
                      isChecked && "border-primary/40 bg-primary/5",
                    )}
                  >
                    <Checkbox checked={isChecked} onCheckedChange={() => toggleTag(option.tag)} />
                    <span className="truncate">{option.tag}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{option.count}</span>
                  </label>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="rounded-[26px] border border-border/60 bg-card/80 p-2.5 shadow-sm md:hidden">
        <div className="space-y-2.5">
          {searchField}
          <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
            <SelectTrigger className="h-10 w-full rounded-[18px]">
              <SelectValue placeholder="Sorter" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-10 gap-2 rounded-[18px] text-sm" onClick={requestLocation}>
              <Crosshair className="size-4" />
              {mapCopy.nearMeLabel}
            </Button>

            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="h-10 justify-between gap-2 rounded-[18px] text-sm">
                  <span className="inline-flex items-center gap-2">
                    <SlidersHorizontal className="size-4" />
                    Filtre
                  </span>
                  {activeFilterCount > 0 ? (
                    <Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">
                      {activeFilterCount}
                    </Badge>
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[86dvh] rounded-t-[28px] border-x-0 border-b-0 p-0">
                <SheetHeader className="border-b px-5 pb-4 pt-5 text-left">
                  <SheetTitle>Filtrer aktører</SheetTitle>
                  <SheetDescription>
                    Bruk geografi, kategorier, tagger og favoritter for å snevre inn resultatene.
                  </SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.75rem+env(safe-area-inset-bottom,0px))] pt-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{activeFilterCount} aktive filtre</span>
                    {activeFilterCount > 0 ? (
                      <Button variant="ghost" size="sm" onClick={clearFilterSelections}>
                        Nullstill
                      </Button>
                    ) : null}
                  </div>
                  {filterSections(true)}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className={desktopGridClassName}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Søk etter aktører, tagger eller adresse"
            className="pl-9 pr-10"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:text-foreground"
              aria-label="Fjern søk"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        {enableGeographyFilters ? (
          <Select
            value={safeCountyFilter || ALL_COUNTIES}
            onValueChange={(value) => {
              setCountyFilter(value === ALL_COUNTIES ? "" : value)
              setMunicipalityFilter("")
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Fylke" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_COUNTIES}>Alle fylker</SelectItem>
              {countyOptions.map((option) => (
                <SelectItem key={option.slug} value={option.slug}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {enableGeographyFilters ? (
          <Select
            value={safeMunicipalityFilter || ALL_MUNICIPALITIES}
            onValueChange={(value) => setMunicipalityFilter(value === ALL_MUNICIPALITIES ? "" : value)}
            disabled={!safeCountyFilter || municipalityOptions.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Kommune/by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MUNICIPALITIES}>Alle kommuner/byer</SelectItem>
              {municipalityOptions.map((option) => (
                <SelectItem key={option.slug} value={option.slug}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sorter" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" className="w-full gap-2 xl:w-auto" onClick={requestLocation}>
          <Crosshair className="size-4" />
          {mapCopy.nearMeLabel}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between gap-2 xl:w-auto">
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                Filtre
              </span>
              {activeFilterCount > 0 ? (
                <Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-4" align="end">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filtre</span>
              {activeFilterCount > 0 ? (
                <Button variant="ghost" size="sm" onClick={clearFilterSelections}>
                  Nullstill
                </Button>
              ) : null}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Favoritter</p>
                <label
                  className={cn(
                    "mt-2 flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
                    favoriteOnly && "border-primary/40 bg-primary/5",
                    !isSignedIn && "opacity-60",
                  )}
                >
                  <Checkbox
                    checked={favoriteOnly}
                    onCheckedChange={(next) => setFavoriteOnly(Boolean(next))}
                    disabled={!isSignedIn}
                  />
                  <span>Vis bare favoritter</span>
                </label>
                {!isSignedIn ? (
                  <p className="mt-2 text-xs text-muted-foreground">Logg inn for å bruke favoritter.</p>
                ) : null}
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground">Kategori</p>
                <div className="mt-2 grid gap-2">
                  {availableCategories.map((category) => {
                    const isChecked = categoryFilters.includes(category)
                    const color = categoryConfig[category]?.color ?? "#64748b"
                    return (
                      <label
                        key={category}
                        className={cn(
                          "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
                          isChecked && "border-primary/40 bg-primary/5",
                        )}
                      >
                        <Checkbox checked={isChecked} onCheckedChange={() => toggleCategory(category)} />
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="truncate">{formatCategoryLabel(category)}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground">Tagger</p>
                <Input
                  value={tagQuery}
                  onChange={(event) => setTagQuery(event.target.value)}
                  placeholder="Søk tagger"
                  className="mt-2"
                />
                <ScrollArea className="mt-2 h-40 pr-3">
                  <div className="grid gap-2">
                    {filteredTagOptions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Ingen tagger.</p>
                    ) : (
                      filteredTagOptions.map((option) => {
                        const isChecked = tagFilters.includes(option.tag)
                        return (
                          <label
                            key={option.tag}
                            className={cn(
                              "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
                              isChecked && "border-primary/40 bg-primary/5",
                            )}
                          >
                            <Checkbox checked={isChecked} onCheckedChange={() => toggleTag(option.tag)} />
                            <span className="truncate">{option.tag}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{option.count}</span>
                          </label>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {locationError ? <p className="text-sm text-destructive">{locationError}</p> : null}
      {sortKey === "distance" && !userLocation && !locationError ? (
        <p className="text-sm text-muted-foreground">Aktivér posisjon i nettleseren for å sortere etter avstand.</p>
      ) : null}

      <div className="flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-muted/20 px-3.5 py-2.5 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-3 sm:text-sm">
        <span>
          Viser {Math.min(visibleCount, sortedActors.length)} av {sortedActors.length} aktører
          {hasAnyFilter ? ` (filtrert fra ${actors.length})` : ""}
        </span>
        {hasAnyFilter ? (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Nullstill alt
          </Button>
        ) : null}
      </div>

      <AnimatePresence>
        {activeFilterCount > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap gap-1.5"
          >
            {favoriteOnly ? (
              <Badge variant="outline" className="gap-1">
                Favoritter
                <button
                  type="button"
                  onClick={() => setFavoriteOnly(false)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Fjern favoritter"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ) : null}
            {safeCountyFilter ? (
              <Badge variant="outline" className="gap-1">
                {countyOptions.find((option) => option.slug === safeCountyFilter)?.name ?? safeCountyFilter}
                <button
                  type="button"
                  onClick={() => {
                    setCountyFilter("")
                    setMunicipalityFilter("")
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Fjern fylke"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ) : null}
            {safeMunicipalityFilter ? (
              <Badge variant="outline" className="gap-1">
                {municipalityOptions.find((option) => option.slug === safeMunicipalityFilter)?.name ??
                  safeMunicipalityFilter}
                <button
                  type="button"
                  onClick={() => setMunicipalityFilter("")}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Fjern kommune"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ) : null}
            {categoryFilters.map((category) => (
              <Badge key={category} variant="outline" className="gap-1">
                {formatCategoryLabel(category)}
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Fjern ${formatCategoryLabel(category)}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {tagFilters.map((tag) => (
              <Badge key={tag} variant="outline" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Fjern ${tag}`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {sortedActors.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground"
          >
            Ingen aktører matcher valgene dine.
          </motion.div>
        ) : (
          <div className="space-y-5 md:space-y-6">
            <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {visibleActors.map((actor) => {
                  const distanceLabel =
                    userLocation &&
                    `${getDistanceKm(userLocation, [actor.lat, actor.lng]).toFixed(1)} ${mapCopy.distanceUnit}`
                  return (
                    <motion.div
                      key={actor.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ActorCard
                        actor={actor}
                        showFavorite={favoritesLoaded}
                        isFavorite={favoriteIds.has(actor.id)}
                        onToggleFavorite={toggleFavorite}
                        distanceLabel={distanceLabel || undefined}
                      />
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
            {hiddenCount > 0 ? (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setVisibleCount((prev) => prev + 24)}
                >
                  Vis {Math.min(24, hiddenCount)} til
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
