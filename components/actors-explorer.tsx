"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Crosshair, Search, SlidersHorizontal, X } from "lucide-react"
import type { Actor, ActorCategory } from "@/lib/data"
import { ActorCard } from "@/components/actor-card"
import { authClient } from "@/lib/auth/client"
import { actorCopy, mapCopy } from "@/content/no"
import { categoryConfig, categoryOrder } from "@/lib/categories"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type SortKey = "default" | "favorite" | "distance" | "name_asc" | "name_desc" | "category"

type TagOption = {
  tag: string
  count: number
}

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "default", label: "Standard" },
  { value: "favorite", label: "Favoritter forst" },
  { value: "distance", label: "Naermest meg" },
  { value: "name_asc", label: "Navn A-Z" },
  { value: "name_desc", label: "Navn Z-A" },
  { value: "category", label: "Kategori" },
]

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

const formatCategoryLabel = (category: ActorCategory) =>
  actorCopy.categoryLabels[category] ?? category

type ActorsExplorerProps = {
  actors: Actor[]
}

export function ActorsExplorer({ actors }: ActorsExplorerProps) {
  const { data } = authClient.useSession()
  const isSignedIn = Boolean(data?.session)
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("default")
  const [categoryFilters, setCategoryFilters] = useState<ActorCategory[]>([])
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [tagQuery, setTagQuery] = useState("")
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [favoritesLoaded, setFavoritesLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  const categoryIndex = useMemo(() => {
    return new Map(categoryOrder.map((category, index) => [category, index]))
  }, [])

  const baseActors = useMemo(() => {
    if (!favoriteOnly) return actors
    return actors.filter((actor) => favoriteIds.has(actor.id))
  }, [actors, favoriteIds, favoriteOnly])

  const availableCategories = useMemo(() => {
    const set = new Set(baseActors.map((actor) => actor.category))
    return categoryOrder.filter((category) => set.has(category))
  }, [baseActors])

  const tagOptions = useMemo<TagOption[]>(() => {
    const counts = new Map<string, number>()
    baseActors.forEach((actor) => {
      actor.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      })
    })
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) =>
        a.tag.localeCompare(b.tag, "no", { sensitivity: "base", numeric: true }),
      )
  }, [baseActors])

  const filteredTagOptions = useMemo(() => {
    const normalized = normalizeText(tagQuery.trim())
    if (!normalized) return tagOptions
    return tagOptions.filter((option) =>
      normalizeText(option.tag).includes(normalized),
    )
  }, [tagOptions, tagQuery])

  const normalizedQuery = normalizeText(query.trim())

  const filteredActors = useMemo(() => {
    return baseActors.filter((actor) => {
      if (categoryFilters.length && !categoryFilters.includes(actor.category)) {
        return false
      }

      if (tagFilters.length) {
        const actorTags = actor.tags ?? []
        if (!tagFilters.some((tag) => actorTags.includes(tag))) {
          return false
        }
      }

      if (!normalizedQuery) return true

      const categoryLabel = formatCategoryLabel(actor.category)
      const searchText = normalizeText(
        [
          actor.name,
          actor.description,
          actor.longDescription,
          actor.address,
          actor.tags.join(" "),
          categoryLabel,
        ].join(" "),
      )
      return searchText.includes(normalizedQuery)
    })
  }, [baseActors, categoryFilters, tagFilters, normalizedQuery])

  const sortedActors = useMemo(() => {
    const sorted = [...filteredActors]
    if (sortKey === "favorite") {
      sorted.sort((a, b) => {
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
        const distA = getDistanceKm(userLocation, [a.lat, a.lng])
        const distB = getDistanceKm(userLocation, [b.lat, b.lng])
        return distA - distB
      })
    }

    if (sortKey === "name_asc") {
      sorted.sort((a, b) =>
        a.name.localeCompare(b.name, "no", { sensitivity: "base", numeric: true }),
      )
      return sorted
    }

    if (sortKey === "name_desc") {
      sorted.sort((a, b) =>
        b.name.localeCompare(a.name, "no", { sensitivity: "base", numeric: true }),
      )
      return sorted
    }

    if (sortKey === "category") {
      sorted.sort((a, b) => {
        const left = categoryIndex.get(a.category) ?? 999
        const right = categoryIndex.get(b.category) ?? 999
        if (left !== right) return left - right
        return a.name.localeCompare(b.name, "no", {
          sensitivity: "base",
          numeric: true,
        })
      })
      return sorted
    }

    if (!userLocation) return filteredActors
    return sorted.sort((a, b) => {
      const distA = getDistanceKm(userLocation, [a.lat, a.lng])
      const distB = getDistanceKm(userLocation, [b.lat, b.lng])
      return distA - distB
    })
  }, [categoryIndex, filteredActors, sortKey, favoriteIds, userLocation])

  const activeFilterCount = categoryFilters.length + tagFilters.length + (favoriteOnly ? 1 : 0)
  const hasAnyFilter = activeFilterCount > 0 || Boolean(query.trim())

  const toggleCategory = (category: ActorCategory) => {
    setCategoryFilters((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    )
  }

  const toggleTag = (tag: string) => {
    setTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    )
  }

  const clearFilterSelections = () => {
    setCategoryFilters([])
    setTagFilters([])
    setTagQuery("")
    setFavoriteOnly(false)
  }

  const clearAllFilters = () => {
    setQuery("")
    setFavoriteOnly(false)
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
        setLocationError(null)
      },
      () => {
        setLocationError(mapCopy.locationError)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

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
      if (isFavorite) {
        next.delete(actorId)
      } else {
        next.add(actorId)
      }
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
        if (isFavorite) {
          next.add(actorId)
        } else {
          next.delete(actorId)
        }
        return next
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Søk etter aktorer, tagger eller adresse"
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

        <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
          <SelectTrigger className="w-full lg:w-[180px]">
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

        <Button variant="outline" className="w-full gap-2 lg:w-auto" onClick={requestLocation}>
          <Crosshair className="size-4" />
          {mapCopy.nearMeLabel}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between gap-2 lg:w-auto">
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="size-4" />
                Filtre
              </span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-4" align="end">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filtre</span>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilterSelections}>
                  Nullstill
                </Button>
              )}
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
                {!isSignedIn && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Logg inn for a bruke favoritter.
                  </p>
                )}
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
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(next) => toggleCategory(category)}
                        />
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
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
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleTag(option.tag)}
                            />
                            <span className="truncate">{option.tag}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {option.count}
                            </span>
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

      {locationError && <p className="text-sm text-destructive">{locationError}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Viser {sortedActors.length} av {actors.length} aktorer
        </span>
        {hasAnyFilter && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Nullstill alt
          </Button>
        )}
      </div>

      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap gap-2"
          >
            {favoriteOnly && (
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
            )}
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
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {sortedActors.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground"
          >
            Ingen aktorer matcher valgene dine.
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {sortedActors.map((actor) => {
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
        )}
      </AnimatePresence>
    </div>
  )
}
