'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { mapCopy } from '@/content/no'
import { authClient } from '@/lib/auth/client'
import { categoryConfig, categoryOrder } from '@/lib/categories'
import type { Actor, ActorCategory } from '@/lib/data'
import { formatTime, getOpeningStatus } from '@/lib/opening-hours'
import { recordAction } from '@/lib/profile-store'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import L from 'leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { Crosshair, Expand, ExternalLink, Layers, List, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
})

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

const categoryFilterLabels: Record<ActorCategory, string> = {
  brukt: mapCopy.filterBrukt,
  utleie: mapCopy.filterUtleie,
  reparasjon: mapCopy.filterReparasjon,
  reparasjon_sko_klar: mapCopy.filterReparasjonSkoKlar,
  mobelreparasjon: mapCopy.filterMobelreparasjon,
  sykkelverksted: mapCopy.filterSykkelverksted,
  ombruksverksted: mapCopy.filterOmbruksverksted,
  mottak_ombruk: mapCopy.filterMottakOmbruk,
  baerekraftig_mat: mapCopy.filterBaerekraftigMat,
  gjenvinning: mapCopy.filterGjenvinning,
}

const buildMarkerIcon = (
  color: string,
  Icon: React.ComponentType<{
    color?: string
    size?: number
    strokeWidth?: number
  }>,
) => {
  const svg = renderToStaticMarkup(<Icon color='white' size={16} strokeWidth={2} />)
  return L.divIcon({
    className: '',
    html: `<div style="background-color:${color}; width: 30px; height: 30px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${svg}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })
}

const buildSelectedMarkerIcon = (
  color: string,
  Icon: React.ComponentType<{
    color?: string
    size?: number
    strokeWidth?: number
  }>,
) => {
  const svg = renderToStaticMarkup(<Icon color='white' size={18} strokeWidth={2} />)
  return L.divIcon({
    className: '',
    html: `<div style="background-color:${color}; width: 40px; height: 40px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 3px solid #fff; box-shadow: 0 0 0 3px ${color}, 0 4px 14px rgba(0,0,0,0.35);">${svg}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  })
}

const getFilterButtonStyle = (active: boolean, color: string) => ({
  backgroundColor: active ? color : `${color}1A`,
  color: active ? '#fff' : color,
  borderColor: color,
})

type SortKey = 'default' | 'favorite' | 'distance' | 'name_asc' | 'name_desc' | 'category'

type TagOption = {
  tag: string
  count: number
}

const sortOptionKeys: SortKey[] = ['default', 'favorite', 'distance', 'name_asc', 'name_desc', 'category']

const getSortLabel = (key: SortKey): string => {
  switch (key) {
    case 'default':
      return mapCopy.sortDefault
    case 'favorite':
      return mapCopy.sortFavoriteFirst
    case 'distance':
      return mapCopy.sortDistance
    case 'name_asc':
      return mapCopy.sortNameAsc
    case 'name_desc':
      return mapCopy.sortNameDesc
    case 'category':
      return mapCopy.sortCategory
    default:
      return mapCopy.sortDefault
  }
}

const STORAGE_KEY = 'map-component-state'
const LOCATION_TTL_MS = 1000 * 60 * 60 * 24

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

function MapFocus({ position }: { position: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, 14)
    }
  }, [map, position])

  return null
}

function MapInitialFit({
  hasRestoredState,
  actorsRef,
}: {
  hasRestoredState: boolean
  actorsRef: React.MutableRefObject<Actor[]>
}) {
  const map = useMap()
  const doneRef = useRef(false)
  useEffect(() => {
    if (!hasRestoredState) return
    if (doneRef.current) return
    const list = actorsRef.current
    const positions = list.map((a) => [a.lat, a.lng] as [number, number])
    if (positions.length === 0) return
    doneRef.current = true
    if (positions.length === 1) {
      map.setView(positions[0], 12)
      return
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [48, 48], maxZoom: 13 })
  }, [hasRestoredState, map])
  return null
}

function MapBottomControls({
  onNearMe,
  actorsRef,
}: {
  onNearMe: () => void
  actorsRef: React.MutableRefObject<Actor[]>
}) {
  const map = useMap()
  const fitToResults = () => {
    const list = actorsRef.current
    const positions = list.map((a) => [a.lat, a.lng] as [number, number])
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 12)
      return
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [40, 40], maxZoom: 14 })
  }
  return (
    <div className='absolute bottom-4 left-4 z-[1000] flex flex-col gap-2'>
      <Button
        type='button'
        size='sm'
        variant='secondary'
        onClick={fitToResults}
        className='gap-2 shadow-md'
        aria-label={mapCopy.fitBoundsLabel}
      >
        <Expand className='h-4 w-4' />
        <span className='hidden sm:inline'>{mapCopy.fitBoundsShort}</span>
      </Button>
      <Button
        type='button'
        size='sm'
        variant='outline'
        onClick={onNearMe}
        className='gap-2 cursor-pointer bg-background/95 shadow-md'
      >
        <Crosshair className='h-4 w-4' />
        {mapCopy.nearMeLabel}
      </Button>
    </div>
  )
}

interface MapComponentProps {
  actors: Actor[]
}

export function MapComponent({ actors }: MapComponentProps) {
  const { data } = authClient.useSession()
  const isSignedIn = Boolean(data?.session)
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null)
  /** Større markør kun mens kartboble (Leaflet Popup) er åpen — ikke ved valg fra listen. */
  const [popupOpenActorId, setPopupOpenActorId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | ActorCategory>('all')
  const [query, setQuery] = useState('')
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [tagQuery, setTagQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationUpdatedAt, setLocationUpdatedAt] = useState<number | null>(null)
  const [hasRestoredState, setHasRestoredState] = useState(false)
  const [routeStops, setRouteStops] = useState<string[]>([])
  const [listSheetOpen, setListSheetOpen] = useState(false)
  const [listSheetContentNode, setListSheetContentNode] = useState<HTMLDivElement | null>(null)
  const [mapCategorySheetOpen, setMapCategorySheetOpen] = useState(false)
  const filteredActorsRef = useRef<Actor[]>([])

  const categoryIndex = useMemo(() => new Map(categoryOrder.map((category, index) => [category, index])), [])

  const isActor = (actor: Actor | undefined): actor is Actor => Boolean(actor)

  useEffect(() => {
    if (!isSignedIn) {
      setFavoriteIds(new Set())
      return
    }

    let active = true
    const loadFavorites = async () => {
      try {
        const response = await fetch('/api/public/favorites')
        if (!response.ok) return
        const data = (await response.json()) as Array<{ actorId: string }>
        if (!active) return
        setFavoriteIds(new Set(data.map((item) => item.actorId)))
      } catch {
        // ignore errors for optional favorites
      }
    }

    void loadFavorites()
    return () => {
      active = false
    }
  }, [isSignedIn])

  const baseActors = useMemo(() => {
    if (!favoriteOnly) return actors
    return actors.filter((actor) => favoriteIds.has(actor.id))
  }, [actors, favoriteIds, favoriteOnly])

  const categoryFiltered = useMemo(
    () => (filter === 'all' ? baseActors : baseActors.filter((actor) => actor.category === filter)),
    [baseActors, filter],
  )

  const tagOptions = useMemo<TagOption[]>(() => {
    const counts = new Map<string, number>()
    categoryFiltered.forEach((actor) => {
      actor.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      })
    })
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) =>
        a.tag.localeCompare(b.tag, 'no', {
          sensitivity: 'base',
          numeric: true,
        }),
      )
  }, [categoryFiltered])

  const filteredTagOptions = useMemo(() => {
    const normalized = normalizeText(tagQuery.trim())
    if (!normalized) return tagOptions
    return tagOptions.filter((option) => normalizeText(option.tag).includes(normalized))
  }, [tagOptions, tagQuery])

  const normalizedQuery = normalizeText(query.trim())

  const filteredActors = useMemo(() => {
    const list = categoryFiltered.filter((actor) => {
      if (tagFilters.length) {
        const actorTags = actor.tags ?? []
        if (!tagFilters.some((tag) => actorTags.includes(tag))) {
          return false
        }
      }

      if (!normalizedQuery) return true

      const searchText = normalizeText(
        [
          actor.name,
          actor.description,
          actor.longDescription,
          actor.address,
          actor.tags.join(' '),
          mapCopy.categoryLabels[actor.category] ?? '',
        ].join(' '),
      )
      return searchText.includes(normalizedQuery)
    })

    const sorted = [...list]

    if (sortKey === 'favorite') {
      return sorted.sort((a, b) => {
        const left = favoriteIds.has(a.id) ? 1 : 0
        const right = favoriteIds.has(b.id) ? 1 : 0
        if (left !== right) return right - left
        return a.name.localeCompare(b.name, 'no', {
          sensitivity: 'base',
          numeric: true,
        })
      })
    }

    if (sortKey === 'distance') {
      if (!userLocation) return sorted
      return sorted.sort((a, b) => {
        const distA = getDistanceKm(userLocation, [a.lat, a.lng])
        const distB = getDistanceKm(userLocation, [b.lat, b.lng])
        return distA - distB
      })
    }

    if (sortKey === 'name_asc') {
      return sorted.sort((a, b) =>
        a.name.localeCompare(b.name, 'no', {
          sensitivity: 'base',
          numeric: true,
        }),
      )
    }

    if (sortKey === 'name_desc') {
      return sorted.sort((a, b) =>
        b.name.localeCompare(a.name, 'no', {
          sensitivity: 'base',
          numeric: true,
        }),
      )
    }

    if (sortKey === 'category') {
      return sorted.sort((a, b) => {
        const left = categoryIndex.get(a.category) ?? 999
        const right = categoryIndex.get(b.category) ?? 999
        if (left !== right) return left - right
        return a.name.localeCompare(b.name, 'no', {
          sensitivity: 'base',
          numeric: true,
        })
      })
    }

    if (!userLocation) return sorted
    return sorted.sort((a, b) => {
      const distA = getDistanceKm(userLocation, [a.lat, a.lng])
      const distB = getDistanceKm(userLocation, [b.lat, b.lng])
      return distA - distB
    })
  }, [categoryFiltered, tagFilters, normalizedQuery, sortKey, userLocation, categoryIndex, favoriteIds])

  filteredActorsRef.current = filteredActors

  const activeFilterCount = (filter === 'all' ? 0 : 1) + tagFilters.length + (favoriteOnly ? 1 : 0)
  const hasAnyFilter = activeFilterCount > 0 || Boolean(query.trim())

  const selectedActor = filteredActors.find((actor) => actor.id === selectedActorId) ?? null
  const routeActors = useMemo(
    () => routeStops.map((id) => actors.find((actor) => actor.id === id)).filter(isActor),
    [actors, routeStops],
  )
  const routePoints = useMemo(
    () => routeActors.map((actor) => [actor.lat, actor.lng] as [number, number]),
    [routeActors],
  )

  const routeDistance = useMemo(() => {
    if (routePoints.length < 2) return null
    const points = userLocation ? [userLocation, ...routePoints] : routePoints
    let total = 0
    for (let index = 0; index < points.length - 1; index += 1) {
      total += getDistanceKm(points[index], points[index + 1])
    }
    return total
  }, [routePoints, userLocation])

  const routeLink = useMemo(() => {
    if (routeActors.length < 2) return null
    const formatCoords = (lat: number, lng: number) => `${lat},${lng}`
    const origin = userLocation
      ? formatCoords(userLocation[0], userLocation[1])
      : formatCoords(routeActors[0].lat, routeActors[0].lng)
    const destination = formatCoords(routeActors[routeActors.length - 1].lat, routeActors[routeActors.length - 1].lng)
    const waypoints = userLocation ? routeActors.slice(0, -1) : routeActors.slice(1, -1)
    const waypointParam =
      waypoints.length > 0
        ? `&waypoints=${encodeURIComponent(waypoints.map((actor) => formatCoords(actor.lat, actor.lng)).join('|'))}`
        : ''
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin,
    )}&destination=${encodeURIComponent(destination)}${waypointParam}`
  }, [routeActors, userLocation])

  useEffect(() => {
    if (selectedActorId && !filteredActors.some((actor) => actor.id === selectedActorId)) {
      setSelectedActorId(null)
    }
  }, [filteredActors, selectedActorId])

  const toggleTag = (tag: string) => {
    setTagFilters((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]))
  }

  const clearAllFilters = () => {
    setQuery('')
    setTagFilters([])
    setTagQuery('')
    setFilter('all')
    setFavoriteOnly(false)
  }

  const addRouteStop = (actorId: string) => {
    setRouteStops((prev) => {
      if (prev.includes(actorId) || prev.length >= 3) return prev
      return [...prev, actorId]
    })
  }

  const removeRouteStop = (actorId: string) => {
    setRouteStops((prev) => prev.filter((id) => id !== actorId))
  }

  const clearRoute = () => {
    setRouteStops([])
  }

  const icons = useMemo(() => {
    const categoryIcons = categoryOrder.reduce(
      (acc, category) => {
        const meta = categoryConfig[category]
        acc[category] = buildMarkerIcon(meta.color, meta.icon)
        return acc
      },
      {} as Record<ActorCategory, L.DivIcon>,
    )

    return {
      ...categoryIcons,
      user: buildMarkerIcon('#0ea5e9', Crosshair),
    }
  }, [])

  const selectedIcons = useMemo(() => {
    const categoryIcons = categoryOrder.reduce(
      (acc, category) => {
        const meta = categoryConfig[category]
        acc[category] = buildSelectedMarkerIcon(meta.color, meta.icon)
        return acc
      },
      {} as Record<ActorCategory, L.DivIcon>,
    )

    return {
      ...categoryIcons,
      user: buildSelectedMarkerIcon('#0ea5e9', Crosshair),
    }
  }, [])

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
      () => {
        setLocationError(mapCopy.locationError)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (raw) {
      try {
        const stored = JSON.parse(raw) as {
          filter?: 'all' | ActorCategory
          query?: string
          tagFilters?: string[]
          tagQuery?: string
          sortKey?: SortKey
          favoriteOnly?: boolean
          userLocation?: [number, number]
          locationUpdatedAt?: number
        }

        if (stored.filter && (stored.filter === 'all' || categoryOrder.includes(stored.filter))) {
          setFilter(stored.filter)
        }
        if (typeof stored.query === 'string') setQuery(stored.query)
        if (Array.isArray(stored.tagFilters)) {
          setTagFilters(stored.tagFilters.filter((tag) => typeof tag === 'string'))
        }
        if (typeof stored.tagQuery === 'string') setTagQuery(stored.tagQuery)
        if (sortOptionKeys.includes(stored.sortKey as SortKey)) {
          setSortKey(stored.sortKey as SortKey)
        }
        if (typeof stored.favoriteOnly === 'boolean') setFavoriteOnly(stored.favoriteOnly)

        if (
          Array.isArray(stored.userLocation) &&
          stored.userLocation.length === 2 &&
          typeof stored.userLocation[0] === 'number' &&
          typeof stored.userLocation[1] === 'number' &&
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
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hasRestoredState) return
    const payload = {
      filter,
      query,
      tagFilters,
      tagQuery,
      sortKey,
      favoriteOnly,
      userLocation,
      locationUpdatedAt,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [hasRestoredState, filter, query, tagFilters, tagQuery, sortKey, favoriteOnly, userLocation, locationUpdatedAt])

  const renderSidebarControls = (includeListHeading: boolean, popoverContainer?: HTMLElement | null) => (
    <>
      {includeListHeading ? (
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <h3 className='font-semibold text-lg' aria-live='polite' aria-atomic='true'>
            {mapCopy.listTitle} ({filteredActors.length})
          </h3>
          {hasAnyFilter && (
            <Button variant='ghost' size='sm' onClick={clearAllFilters}>
              Nullstill alt
            </Button>
          )}
        </div>
      ) : null}

      <div className='grid gap-3'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={mapCopy.searchListPlaceholder}
            className='pl-9 pr-10'
          />
          {query && (
            <button
              type='button'
              onClick={() => setQuery('')}
              className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:text-foreground'
              aria-label='Fjern søk'
            >
              <X className='size-3' />
            </button>
          )}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
            <SelectTrigger className='w-full sm:w-[180px]'>
              <SelectValue placeholder={mapCopy.sortPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {sortOptionKeys.map((key) => (
                <SelectItem key={key} value={key}>
                  {getSortLabel(key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline' className='w-full justify-between gap-2 sm:w-auto'>
                <span className='inline-flex items-center gap-2'>
                  <SlidersHorizontal className='size-4' />
                  {mapCopy.filtersPopoverTitle}
                </span>
                {activeFilterCount > 0 && (
                  <Badge variant='secondary' className='rounded-full px-2 py-0 text-xs'>
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[280px] p-4' align='end' container={popoverContainer}>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>{mapCopy.filtersPopoverTitle}</span>
                {activeFilterCount > 0 && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setTagFilters([])
                      setTagQuery('')
                      setFavoriteOnly(false)
                    }}
                  >
                    Nullstill
                  </Button>
                )}
              </div>
              <div className='mt-4 space-y-4'>
                <div>
                  <p className='text-xs font-medium text-muted-foreground'>Favoritter</p>
                  <label
                    className={cn(
                      'mt-2 flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition',
                      favoriteOnly && 'border-primary/40 bg-primary/5',
                      !isSignedIn && 'opacity-60',
                    )}
                  >
                    <Checkbox
                      checked={favoriteOnly}
                      onCheckedChange={(next) => setFavoriteOnly(Boolean(next))}
                      disabled={!isSignedIn}
                    />
                    <span>{mapCopy.favoritesOnlyLabel}</span>
                  </label>
                  {!isSignedIn && <p className='mt-2 text-xs text-muted-foreground'>{mapCopy.favoritesSignInHint}</p>}
                </div>

                <Separator />

                <div>
                  <p className='text-xs font-medium text-muted-foreground'>{mapCopy.tagsSectionLabel}</p>
                  <Input
                    value={tagQuery}
                    onChange={(event) => setTagQuery(event.target.value)}
                    placeholder={mapCopy.tagsSearchPlaceholder}
                    className='mt-2'
                  />
                  <ScrollArea className='mt-2 h-36 pr-3'>
                    <div className='grid gap-2'>
                      {filteredTagOptions.length === 0 ? (
                        <p className='text-sm text-muted-foreground'>{mapCopy.noTagsLabel}</p>
                      ) : (
                        filteredTagOptions.map((option) => {
                          const isChecked = tagFilters.includes(option.tag)
                          return (
                            <label
                              key={option.tag}
                              className={cn(
                                'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition',
                                isChecked && 'border-primary/40 bg-primary/5',
                              )}
                            >
                              <Checkbox checked={isChecked} onCheckedChange={() => toggleTag(option.tag)} />
                              <span className='truncate'>{option.tag}</span>
                              <span className='ml-auto text-xs text-muted-foreground'>{option.count}</span>
                            </label>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>
                {filter !== 'all' && (
                  <>
                    <Separator />
                    <div className='text-xs text-muted-foreground'>
                      {mapCopy.activeCategoryLabel}:{' '}
                      <span className='text-foreground'>{mapCopy.categoryLabels[filter]}</span>
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {sortKey === 'distance' && !userLocation && !locationError ? (
        <p className='text-sm text-muted-foreground'>{mapCopy.distanceSortHint}</p>
      ) : null}

      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className='flex flex-wrap gap-2'
          >
            {favoriteOnly && (
              <Badge variant='outline' className='gap-1'>
                Favoritter
                <button
                  type='button'
                  onClick={() => setFavoriteOnly(false)}
                  className='text-muted-foreground hover:text-foreground'
                  aria-label={mapCopy.removeFavoritesChipAria}
                >
                  <X className='size-3' />
                </button>
              </Badge>
            )}
            {filter !== 'all' && (
              <Badge variant='outline' className='gap-1'>
                {mapCopy.categoryLabels[filter]}
                <button
                  type='button'
                  onClick={() => setFilter('all')}
                  className='text-muted-foreground hover:text-foreground'
                  aria-label={mapCopy.removeCategoryChipAria}
                >
                  <X className='size-3' />
                </button>
              </Badge>
            )}
            {tagFilters.map((tag) => (
              <Badge key={tag} variant='outline' className='gap-1'>
                {tag}
                <button
                  type='button'
                  onClick={() => toggleTag(tag)}
                  className='text-muted-foreground hover:text-foreground'
                  aria-label={`Fjern ${tag}`}
                >
                  <X className='size-3' />
                </button>
              </Badge>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <Card className='space-y-3 p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h4 className='font-semibold'>{mapCopy.routeTitle}</h4>
            <p className='text-xs text-muted-foreground'>{mapCopy.routeDescription}</p>
          </div>
          {routeStops.length > 0 && (
            <Button size='sm' variant='ghost' onClick={clearRoute}>
              {mapCopy.routeClearLabel}
            </Button>
          )}
        </div>
        <div className='space-y-2'>
          {routeActors.length === 0 && <p className='text-sm text-muted-foreground'>{mapCopy.routeEmptyLabel}</p>}
          {routeActors.map((actor, index) => (
            <div key={actor.id} className='flex items-center justify-between gap-2 rounded-md border px-3 py-2'>
              <div className='text-sm'>
                <span className='font-semibold'>{index + 1}.</span> {actor.name}
              </div>
              <Button size='sm' variant='outline' onClick={() => removeRouteStop(actor.id)}>
                {mapCopy.routeRemoveLabel}
              </Button>
            </div>
          ))}
        </div>
        {routeDistance !== null && (
          <div className='text-xs text-muted-foreground'>
            {mapCopy.routeDistanceLabel}: {routeDistance.toFixed(1)} {mapCopy.distanceUnit}
          </div>
        )}
        {routeLink && (
          <Button asChild size='sm' className='w-full'>
            <a
              href={routeLink}
              target='_blank'
              rel='noopener noreferrer'
              onClick={() => recordAction('go_directions', { route: 'multi' })}
            >
              {mapCopy.routeOpenLabel}
            </a>
          </Button>
        )}
      </Card>
    </>
  )

  const renderActorList = (listClassName: string) => (
    <div className={cn('space-y-3', listClassName)}>
      {filteredActors.length === 0 ? (
        <div className='rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground'>
          {mapCopy.emptyFilteredList}
        </div>
      ) : (
        <AnimatePresence mode='popLayout'>
          {filteredActors.map((actor) => {
            const meta = categoryConfig[actor.category]
            const Icon = meta.icon
            const distance =
              userLocation &&
              `${getDistanceKm(userLocation, [actor.lat, actor.lng]).toFixed(1)} ${mapCopy.distanceUnit}`
            const openStatus = getOpeningStatus(actor.openingHoursOsm ?? undefined)
            const statusLabel =
              openStatus.state === 'open'
                ? mapCopy.openNowLabel
                : openStatus.state === 'closed'
                  ? mapCopy.closedNowLabel
                  : mapCopy.hoursFallbackLabel
            const statusDetail =
              openStatus.state === 'unknown' || !openStatus.nextChange
                ? null
                : `${
                    openStatus.state === 'open' ? mapCopy.closesAtLabel : mapCopy.opensAtLabel
                  } ${formatTime(openStatus.nextChange)}`

            return (
              <motion.div
                key={actor.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  role='button'
                  tabIndex={0}
                  aria-pressed={selectedActorId === actor.id}
                  aria-current={selectedActorId === actor.id ? 'true' : undefined}
                  className={`cursor-pointer p-4 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selectedActorId === actor.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => {
                    setSelectedActorId(actor.id)
                    setListSheetOpen(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSelectedActorId(actor.id)
                      setListSheetOpen(false)
                    }
                  }}
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <h4 className='font-semibold'>{actor.name}</h4>
                      <p className='text-muted-foreground mt-1 flex items-center gap-1 text-sm'>
                        <MapPin className='h-3 w-3' />
                        {actor.address}
                      </p>
                      {distance && <p className='text-muted-foreground mt-1 text-xs'>{distance}</p>}
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {statusLabel}
                        {statusDetail ? ` - ${statusDetail}` : ''}
                      </p>
                      <Badge
                        className='mt-2 flex items-center gap-1'
                        style={{
                          backgroundColor: meta.color,
                          color: '#fff',
                        }}
                      >
                        <Icon className='h-3 w-3' />
                        {mapCopy.categoryLabels[actor.category]}
                      </Badge>
                    </div>
                    <div className='flex flex-col gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={(ev) => {
                          ev.stopPropagation()
                          addRouteStop(actor.id)
                        }}
                        disabled={routeStops.includes(actor.id) || routeStops.length >= 3}
                      >
                        {routeStops.includes(actor.id) ? mapCopy.routeAddedLabel : mapCopy.routeAddLabel}
                      </Button>
                      <Button size='sm' variant='ghost' asChild>
                        <Link
                          href={`/aktorer/${actor.slug}`}
                          onClick={(ev) => {
                            ev.stopPropagation()
                            recordAction('open_actor', {
                              actorId: actor.id,
                            })
                          }}
                        >
                          <ExternalLink className='h-4 w-4' />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      )}
    </div>
  )

  const renderSidebar = () => (
    <div className='space-y-4'>
      {renderSidebarControls(true)}
      {renderActorList('max-h-[min(55vh,520px)] overflow-y-auto pt-0.5 pl-0.5 pr-2 lg:max-h-[550px]')}
    </div>
  )

  const renderMapCategoryPicker = (variant: 'overlay' | 'sheet') => {
    const isSheet = variant === 'sheet'
    const pick = (next: 'all' | ActorCategory) => {
      setFilter(next)
      if (isSheet) setMapCategorySheetOpen(false)
    }

    const buttons = (
      <>
        <Button
          size={isSheet ? 'default' : 'sm'}
          variant={filter === 'all' ? 'default' : 'secondary'}
          onClick={() => pick('all')}
          className={cn('cursor-pointer', isSheet && 'col-span-2 w-full justify-start gap-2', !isSheet && 'gap-2')}
        >
          <Layers className='h-4 w-4 shrink-0' />
          {mapCopy.filterAll}
        </Button>
        {categoryOrder.map((category) => {
          const meta = categoryConfig[category]
          const Icon = meta.icon
          const active = filter === category
          return (
            <Button
              key={category}
              size={isSheet ? 'default' : 'sm'}
              variant='outline'
              onClick={() => pick(category)}
              className={cn(
                'cursor-pointer',
                isSheet && 'h-auto min-h-11 w-full justify-start gap-2 whitespace-normal py-2.5 text-left',
                !isSheet && 'gap-2',
              )}
              style={getFilterButtonStyle(active, meta.color)}
            >
              <Icon className='h-4 w-4 shrink-0' />
              <span className='min-w-0 leading-snug'>{categoryFilterLabels[category]}</span>
            </Button>
          )
        })}
      </>
    )

    if (isSheet) {
      return <div className='grid grid-cols-2 gap-2'>{buttons}</div>
    }
    return (
      <div className='flex max-h-[40vh] flex-wrap justify-end gap-2 overflow-y-auto rounded-lg border bg-background/90 p-2 shadow-md backdrop-blur-sm lg:justify-start'>
        {buttons}
      </div>
    )
  }

  return (
    <>
      <div className='flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_minmax(320px,380px)] lg:items-stretch lg:gap-6 lg:rounded-2xl lg:border lg:border-border/60 lg:bg-card/20 lg:p-4 lg:shadow-sm'>
        <div className='relative z-[49] min-h-0'>
          <div className='absolute right-3 top-3 z-[1000] flex max-w-[calc(100%-5.5rem)] flex-col items-end gap-2 lg:left-[52px] lg:right-auto lg:top-2.5 lg:mr-10 lg:max-w-[calc(100%-4rem)] lg:items-start'>
            <div className='flex w-full max-w-full flex-col items-end gap-2 lg:items-start'>
              <div className='flex flex-col items-end gap-1.5 lg:hidden'>
                <Button
                  type='button'
                  size='icon'
                  variant='secondary'
                  onClick={() => setMapCategorySheetOpen(true)}
                  className='relative h-11 w-11 shrink-0 rounded-full shadow-md'
                  aria-label={mapCopy.openMapCategorySheetAria}
                >
                  <SlidersHorizontal className='h-5 w-5' />
                  {filter !== 'all' && (
                    <span
                      className='ring-background absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2'
                      aria-hidden
                    />
                  )}
                </Button>
                {filter !== 'all' && (
                  <span className='max-w-[11rem] truncate rounded-md border border-border/60 bg-background/95 px-2 py-1 text-center text-[11px] font-medium leading-tight text-foreground shadow-sm backdrop-blur-sm'>
                    {mapCopy.categoryLabels[filter]}
                  </span>
                )}
              </div>

              <div className='hidden w-full flex-col items-end gap-2 lg:flex lg:items-start'>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => setFiltersOpen((prev) => !prev)}
                  className='w-fit gap-2 shadow-sm'
                >
                  <SlidersHorizontal className='h-4 w-4' />
                  {filtersOpen ? mapCopy.hideFiltersLabel : mapCopy.showFiltersLabel}
                </Button>
                <AnimatePresence initial={false}>
                  {filtersOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className='w-full max-w-full overflow-hidden lg:w-auto lg:max-w-none'
                    >
                      {renderMapCategoryPicker('overlay')}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className='relative overflow-hidden rounded-xl border shadow-sm'>
            <MapContainer
              center={[60.7945, 11.068]}
              zoom={13}
              className='z-0 h-[min(55dvh,520px)] min-h-[280px] w-full lg:h-[min(600px,calc(100dvh-14rem))] lg:min-h-[480px]'
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              />
              <MapInitialFit hasRestoredState={hasRestoredState} actorsRef={filteredActorsRef} />
              {filteredActors.map((actor) => (
                <Marker
                  key={actor.id}
                  position={[actor.lat, actor.lng]}
                  icon={
                    popupOpenActorId === actor.id
                      ? (selectedIcons[actor.category] ?? selectedIcons.brukt)
                      : (icons[actor.category] ?? icons.brukt)
                  }
                  eventHandlers={{
                    click: () => setSelectedActorId(actor.id),
                    popupopen: () => setPopupOpenActorId(actor.id),
                    popupclose: () => setPopupOpenActorId((prev) => (prev === actor.id ? null : prev)),
                  }}
                >
                  <Popup className='[&_.leaflet-popup-content-wrapper]:rounded-xl [&_.leaflet-popup-content-wrapper]:shadow-lg [&_.leaflet-popup-content]:m-3'>
                    <div className='w-56 space-y-2'>
                      <Link
                        href={`/aktorer/${actor.slug}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='group block overflow-hidden rounded-lg border shadow-sm'
                        onClick={() => recordAction('open_actor', { actorId: actor.id })}
                      >
                        <div className='relative'>
                          <img
                            src={actor.image || '/placeholder.svg'}
                            alt={actor.name}
                            className='h-28 w-full object-cover'
                          />
                          <div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
                            <span className='text-xs font-semibold uppercase tracking-wide text-white'>
                              {mapCopy.popupHoverCta}
                            </span>
                          </div>
                        </div>
                      </Link>
                      <div className='flex flex-col gap-1'>
                        <p className='text-sm font-semibold !my-0'>{actor.name}</p>
                        <p className='text-xs text-muted-foreground !my-0'>{actor.address}</p>
                        <Button asChild size='sm' variant='outline' className='h-7 px-2 text-xs'>
                          <Link
                            href={`/aktorer/${actor.slug}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            onClick={() => recordAction('open_actor', { actorId: actor.id })}
                          >
                            Åpne aktørside
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {userLocation && (
                <Marker position={userLocation} icon={icons.user}>
                  <Popup>{mapCopy.nearMeLabel}</Popup>
                </Marker>
              )}
              {routePoints.length > 1 && (
                <Polyline positions={routePoints} pathOptions={{ color: '#16a34a', weight: 4 }} />
              )}
              {selectedActor && <MapFocus position={[selectedActor.lat, selectedActor.lng]} />}
              {userLocation && !selectedActor && <MapFocus position={userLocation} />}
              <MapBottomControls onNearMe={requestLocation} actorsRef={filteredActorsRef} />
            </MapContainer>
          </div>

          <Button
            type='button'
            size='lg'
            className='fixed right-4 z-[1001] gap-2 rounded-full shadow-lg max-md:bottom-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom,0px)+0.875rem)] md:bottom-5 lg:hidden'
            onClick={() => setListSheetOpen(true)}
            aria-label={`${mapCopy.openListFab} (${filteredActors.length})`}
          >
            <List className='h-5 w-5' />
            <span className='font-medium'>
              {mapCopy.openListFabWithCount.replace('{count}', String(filteredActors.length))}
            </span>
          </Button>

          {locationError && <p className='mt-2 text-sm text-destructive'>{locationError}</p>}
        </div>

        <div className='hidden min-h-0 lg:block'>{renderSidebar()}</div>

        <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
          <SheetContent
            ref={setListSheetContentNode}
            side='bottom'
            className='flex h-[88dvh] max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-t-2xl border-t p-0 lg:hidden'
          >
            <SheetHeader className='shrink-0 border-b px-5 pb-4 pt-5 text-left'>
              <SheetTitle className='text-left'>{mapCopy.sheetListTitle}</SheetTitle>
              <SheetDescription className='text-left text-pretty'>{mapCopy.sheetListDescription}</SheetDescription>
            </SheetHeader>
            <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
              <div className='shrink-0 space-y-4 px-5 pb-4 pt-2'>{renderSidebarControls(false, listSheetContentNode)}</div>
              {renderActorList('min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-1')}
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={mapCategorySheetOpen} onOpenChange={setMapCategorySheetOpen}>
          <SheetContent
            side='bottom'
            className='flex max-h-[min(72dvh,560px)] flex-col gap-0 overflow-hidden rounded-t-2xl border-t p-0 lg:hidden'
          >
            <SheetHeader className='shrink-0 border-b px-5 pb-3 pt-5 text-left'>
              <SheetTitle className='text-left'>{mapCopy.mapCategorySheetTitle}</SheetTitle>
              <SheetDescription className='text-left text-pretty'>
                {mapCopy.mapCategorySheetDescription}
              </SheetDescription>
            </SheetHeader>
            <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain !px-5 !pb-8 !pt-5'>
              {renderMapCategoryPicker('sheet')}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
