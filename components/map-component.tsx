'use client'

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Crosshair, Expand, ExternalLink, Heart, Layers, List, MapPin, Route, Search, SlidersHorizontal, X } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
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
import type {
  ActorBrowseFilters,
  ActorBrowseResponse,
  ActorListItem,
  ActorMapPoint,
  ActorMapResponse,
  ActorMapSummary,
  ActorSortKey,
  MapBounds,
} from '@/lib/actors/types'
import { buildMarkerIconHtml, getActorMarkerVisualStyle } from '@/lib/actors/map-marker-icon'
import { categoryConfig, categoryOrder } from '@/lib/categories'
import type { ActorCategory } from '@/lib/data'
import { recordAction } from '@/lib/profile-store'
import { cn } from '@/lib/utils'

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

const sortOptionKeys: ActorSortKey[] = ['default', 'favorite', 'distance', 'name_asc', 'name_desc', 'category']

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

const toBounds = (value: L.LatLngBounds): MapBounds => ({
  north: value.getNorth(),
  south: value.getSouth(),
  east: value.getEast(),
  west: value.getWest(),
})

const areBoundsEqual = (left: MapBounds | null, right: MapBounds | null) => {
  if (!left || !right) return left === right
  return (
    left.north === right.north &&
    left.south === right.south &&
    left.east === right.east &&
    left.west === right.west
  )
}

const buildMarkerIcon = (color: string, Icon: LucideIcon) => {
  const svg = renderToStaticMarkup(<Icon color='white' size={16} strokeWidth={2} />)
  return svg
}

const buildClusterIcon = (label: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:42px;height:42px;border-radius:9999px;background:#0f172a;color:#fff;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.25);font-size:12px;font-weight:700;">${label}</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
  })

const getFilterButtonStyle = (active: boolean, color: string) => ({
  backgroundColor: active ? color : `${color}1A`,
  color: active ? '#fff' : color,
  borderColor: color,
})

const getSortLabel = (key: ActorSortKey) => {
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

const toMapPoint = (
  actor: Pick<ActorListItem, 'id' | 'slug' | 'name' | 'category' | 'lat' | 'lng' | 'address' | 'image'>,
): ActorMapPoint => ({
  id: actor.id,
  slug: actor.slug,
  name: actor.name,
  category: actor.category,
  lat: actor.lat,
  lng: actor.lng,
  address: actor.address,
  image: actor.image,
})

function ViewportTracker({
  initialBounds,
  onReady,
  onChange,
}: {
  initialBounds: ActorMapSummary['globalBounds']
  onReady: (map: L.Map) => void
  onChange: (viewport: { bounds: MapBounds; zoom: number }) => void
}) {
  const map = useMapEvents({
    moveend() {
      onChange({ bounds: toBounds(map.getBounds()), zoom: map.getZoom() })
    },
    zoomend() {
      onChange({ bounds: toBounds(map.getBounds()), zoom: map.getZoom() })
    },
  })

  useEffect(() => {
    onReady(map)
    if (initialBounds) {
      map.fitBounds(
        [
          [initialBounds.south, initialBounds.west],
          [initialBounds.north, initialBounds.east],
        ],
        { padding: [40, 40], maxZoom: 7 },
      )
    }
    onChange({ bounds: toBounds(map.getBounds()), zoom: map.getZoom() })
  }, [initialBounds, map, onChange, onReady])

  return null
}

function FocusActor({ actor }: { actor: Pick<ActorMapPoint, 'lat' | 'lng'> | null }) {
  const map = useMap()

  useEffect(() => {
    if (!actor) return
    map.flyTo([actor.lat, actor.lng], Math.max(map.getZoom(), 13), { duration: 0.6 })
  }, [actor, map])

  return null
}

type Props = {
  initialSummary: ActorMapSummary
  initialFilters: ActorBrowseFilters
}

export function MapComponent({ initialSummary, initialFilters }: Props) {
  const { data } = authClient.useSession()
  const isSignedIn = Boolean(data?.session)
  const mapRef = useRef<L.Map | null>(null)
  const overlayAbortRef = useRef<AbortController | null>(null)
  const listAbortRef = useRef<AbortController | null>(null)
  const listSheetContentRef = useRef<HTMLDivElement | null>(null)

  const [query, setQuery] = useState(initialFilters.q)
  const deferredQuery = useDeferredValue(query)
  const [categories, setCategories] = useState<ActorCategory[]>(initialFilters.categories)
  const [tags, setTags] = useState<string[]>(initialFilters.tags)
  const [tagQuery, setTagQuery] = useState('')
  const [favoriteOnly, setFavoriteOnly] = useState(initialFilters.favoriteOnly)
  const [sort, setSort] = useState<ActorSortKey>(initialFilters.sort)
  const [page, setPage] = useState(1)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [viewport, setViewport] = useState<{ bounds: MapBounds; zoom: number } | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [listSheetOpen, setListSheetOpen] = useState(false)
  const [listSheetContentNode, setListSheetContentNode] = useState<HTMLDivElement | null>(null)
  const [mapCategorySheetOpen, setMapCategorySheetOpen] = useState(false)
  const [overlay, setOverlay] = useState<ActorMapResponse>({
    mode: 'clusters',
    totalMatching: 0,
    resultBounds: null,
    clusters: [],
    points: [],
  })
  const [list, setList] = useState<ActorBrowseResponse>({
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
    facets: { counties: [], municipalities: [], categories: [], tags: [] },
  })
  const [selected, setSelected] = useState<ActorMapPoint | null>(null)
  const [routeStops, setRouteStops] = useState<ActorMapPoint[]>([])

  const handleListSheetContentRef = useCallback((node: HTMLDivElement | null) => {
    listSheetContentRef.current = node
    setListSheetContentNode(node)
  }, [])

  const handleViewportChange = useCallback((next: { bounds: MapBounds; zoom: number }) => {
    setViewport((current) => {
      if (current && current.zoom === next.zoom && areBoundsEqual(current.bounds, next.bounds)) {
        return current
      }
      return next
    })
  }, [])

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map
  }, [])

  useEffect(() => {
    if (!isSignedIn && favoriteOnly) {
      setFavoriteOnly(false)
      setPage(1)
    }
  }, [favoriteOnly, isSignedIn])

  useEffect(() => {
    if (!isSignedIn) {
      setFavoriteIds(new Set())
      return
    }

    let active = true

    void fetch('/api/public/favorites', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to fetch favorites')
        return (await response.json()) as Array<{ actorId: string }>
      })
      .then((favorites) => {
        if (!active) return
        setFavoriteIds(new Set(favorites.map((favorite) => favorite.actorId)))
      })
      .catch(() => {
        if (!active) return
        setFavoriteIds(new Set())
      })

    return () => {
      active = false
    }
  }, [isSignedIn])

  const filterParams = useMemo(() => {
    const params = new URLSearchParams()
    if (deferredQuery.trim()) params.set('q', deferredQuery.trim())
    for (const category of categories) params.append('category', category)
    for (const tag of tags) params.append('tag', tag)
    if (favoriteOnly) params.set('favoriteOnly', 'true')
    if (typeof userLocation?.[0] === 'number' && typeof userLocation?.[1] === 'number') {
      params.set('lat', String(userLocation[0]))
      params.set('lng', String(userLocation[1]))
    }
    return params
  }, [categories, deferredQuery, favoriteOnly, tags, userLocation])

  useEffect(() => {
    setPage((current) => (current === 1 ? current : 1))
  }, [
    categories,
    deferredQuery,
    favoriteOnly,
    sort,
    tags,
    viewport?.bounds?.east,
    viewport?.bounds?.north,
    viewport?.bounds?.south,
    viewport?.bounds?.west,
  ])

  useEffect(() => {
    if (!viewport) return

    overlayAbortRef.current?.abort()
    const controller = new AbortController()
    overlayAbortRef.current = controller
    const params = new URLSearchParams(filterParams)
    params.set('north', String(viewport.bounds.north))
    params.set('south', String(viewport.bounds.south))
    params.set('east', String(viewport.bounds.east))
    params.set('west', String(viewport.bounds.west))
    params.set('zoom', String(viewport.zoom))

    void fetch(`/api/map/actors?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to fetch map actors')
        return (await response.json()) as ActorMapResponse
      })
      .then((payload) => setOverlay(payload))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
      })

    return () => controller.abort()
  }, [filterParams, viewport])

  useEffect(() => {
    if (!viewport) return

    listAbortRef.current?.abort()
    const controller = new AbortController()
    listAbortRef.current = controller
    const params = new URLSearchParams(filterParams)
    params.set('north', String(viewport.bounds.north))
    params.set('south', String(viewport.bounds.south))
    params.set('east', String(viewport.bounds.east))
    params.set('west', String(viewport.bounds.west))
    params.set('sort', sort)
    params.set('page', String(page))
    params.set('pageSize', '20')

    void fetch(`/api/browse/actors?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          setFavoriteOnly(false)
          return null
        }
        if (!response.ok) throw new Error('Failed to fetch browse actors')
        return (await response.json()) as ActorBrowseResponse
      })
      .then((payload) => {
        if (!payload) return
        setList((current) => ({
          ...payload,
          items: page > 1 ? [...current.items, ...payload.items] : payload.items,
        }))
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
      })

    return () => controller.abort()
  }, [filterParams, page, sort, viewport])

  useEffect(() => {
    return () => {
      overlayAbortRef.current?.abort()
      listAbortRef.current?.abort()
    }
  }, [])

  const heartSvg = useMemo(() => renderToStaticMarkup(<Heart className='fill-rose-500 text-rose-500' size={10} strokeWidth={2.2} />), [])

  const icons = useMemo(() => {
    return categoryOrder.reduce(
      (acc, category) => {
        const meta = categoryConfig[category]
        acc[category] = buildMarkerIcon(meta.color, meta.icon)
        return acc
      },
      {} as Record<ActorCategory, string>,
    )
  }, [])

  const userMarkerIcon = useMemo(
    () =>
      {
        const visualStyle = getActorMarkerVisualStyle(false, '#0ea5e9')
        return L.divIcon({
          className: '',
          html: buildMarkerIconHtml({
            color: '#0ea5e9',
            iconSvg: buildMarkerIcon('#0ea5e9', Crosshair),
            size: visualStyle.size,
            borderWidth: visualStyle.borderWidth,
            shadow: visualStyle.shadow,
          }),
          iconSize: [visualStyle.size, visualStyle.size],
          iconAnchor: [visualStyle.size / 2, visualStyle.size / 2],
          popupAnchor: [0, -visualStyle.size / 2],
        })
      },
    [],
  )

  const getActorMarkerIcon = useCallback(
    (actor: ActorMapPoint, isSelected: boolean) => {
      const visualStyle = getActorMarkerVisualStyle(isSelected, categoryConfig[actor.category].color)
      const iconSvg = icons[actor.category] ?? icons.brukt

      return L.divIcon({
        className: '',
        html: buildMarkerIconHtml({
          color: categoryConfig[actor.category].color,
          iconSvg,
          size: visualStyle.size,
          borderWidth: visualStyle.borderWidth,
          shadow: visualStyle.shadow,
          isFavorite: favoriteIds.has(actor.id),
          favoriteSvg: heartSvg,
        }),
        iconSize: [visualStyle.size, visualStyle.size],
        iconAnchor: [visualStyle.size / 2, visualStyle.size / 2],
        popupAnchor: [0, -visualStyle.size / 2],
      })
    },
    [favoriteIds, heartSvg, icons],
  )

  const visibleTags = useMemo(() => {
    const normalized = tagQuery.trim().toLowerCase()
    if (!normalized) return list.facets.tags
    return list.facets.tags.filter((entry) => entry.tag.toLowerCase().includes(normalized))
  }, [list.facets.tags, tagQuery])

  const activeFilterCount = categories.length + tags.length + (favoriteOnly ? 1 : 0)
  const hasAnyFilter = activeFilterCount > 0 || Boolean(query.trim())
  const selectedActorId = selected?.id ?? null
  const routePoints = useMemo(
    () => routeStops.map((item) => [item.lat, item.lng] as [number, number]),
    [routeStops],
  )

  const routeDistance = useMemo(() => {
    if (routePoints.length < 2) return null
    let total = 0
    for (let index = 0; index < routePoints.length - 1; index += 1) {
      total += getDistanceKm(routePoints[index], routePoints[index + 1])
    }
    return total
  }, [routePoints])

  const routeLink = useMemo(() => {
    if (routeStops.length < 2) return null

    const formatCoords = (lat: number, lng: number) => `${lat},${lng}`
    const origin = userLocation
      ? formatCoords(userLocation[0], userLocation[1])
      : formatCoords(routeStops[0].lat, routeStops[0].lng)
    const destination = formatCoords(routeStops[routeStops.length - 1].lat, routeStops[routeStops.length - 1].lng)
    const waypoints = userLocation ? routeStops.slice(0, -1) : routeStops.slice(1, -1)
    const waypointParam =
      waypoints.length > 0
        ? `&waypoints=${encodeURIComponent(waypoints.map((actor) => formatCoords(actor.lat, actor.lng)).join('|'))}`
        : ''

    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypointParam}`
  }, [routeStops, userLocation])

  const activeCategorySummary = useMemo(() => {
    if (categories.length === 0) return null
    if (categories.length === 1) return categoryFilterLabels[categories[0]]
    return `${categories.length} kategorier`
  }, [categories])

  const toggleCategory = (category: ActorCategory) => {
    setCategories((current) =>
      current.includes(category) ? current.filter((entry) => entry !== category) : [...current, category],
    )
  }

  const toggleTag = (tag: string) => {
    setTags((current) => (current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]))
  }

  const clearAllFilters = () => {
    setQuery('')
    setCategories([])
    setTags([])
    setTagQuery('')
    setFavoriteOnly(false)
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(mapCopy.locationError)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation: [number, number] = [position.coords.latitude, position.coords.longitude]
        setUserLocation(nextLocation)
        setLocationError(null)
        mapRef.current?.flyTo(nextLocation, Math.max(mapRef.current.getZoom(), 13), { duration: 0.6 })
      },
      () => {
        setLocationError(mapCopy.locationError)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const fitToResults = () => {
    const targetBounds = overlay.resultBounds ?? initialSummary.globalBounds
    if (!mapRef.current || !targetBounds) return

    mapRef.current.fitBounds(
      [
        [targetBounds.south, targetBounds.west],
        [targetBounds.north, targetBounds.east],
      ],
      { padding: [40, 40], maxZoom: 13 },
    )
  }

  const selectActor = (actor: ActorMapPoint) => {
    setSelected((current) => (current?.id === actor.id ? current : actor))
    setListSheetOpen(false)
  }

  const addRouteStop = (actor: ActorMapPoint) => {
    setRouteStops((current) =>
      current.some((item) => item.id === actor.id) || current.length >= 3 ? current : [...current, actor],
    )
  }

  const removeRouteStop = (actorId: string) => {
    setRouteStops((current) => current.filter((item) => item.id !== actorId))
  }

  const renderSidebarControls = (includeListHeading: boolean, popoverContainer?: HTMLElement | null) => (
    <>
      {includeListHeading ? (
        <div className='flex flex-wrap items-start justify-between gap-2'>
          <div>
            <h3 className='text-lg font-semibold' aria-live='polite' aria-atomic='true'>
              {mapCopy.listTitle} ({list.total})
            </h3>
            <p className='text-sm text-muted-foreground'>Viser aktører i gjeldende kartutsnitt.</p>
          </div>
          {hasAnyFilter ? (
            <Button variant='ghost' size='sm' onClick={clearAllFilters}>
              Nullstill alt
            </Button>
          ) : null}
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
          {query ? (
            <button
              type='button'
              onClick={() => setQuery('')}
              className='absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:text-foreground'
              aria-label='Fjern søk'
            >
              <X className='size-3' />
            </button>
          ) : null}
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Select value={sort} onValueChange={(value) => setSort(value as ActorSortKey)}>
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
                {activeFilterCount > 0 ? (
                  <Badge variant='secondary' className='rounded-full px-2 py-0 text-xs'>
                    {activeFilterCount}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[280px] p-4' align='end' container={popoverContainer}>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>{mapCopy.filtersPopoverTitle}</span>
                {activeFilterCount > 0 ? (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setTags([])
                      setTagQuery('')
                      setFavoriteOnly(false)
                    }}
                  >
                    Nullstill
                  </Button>
                ) : null}
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
                  {!isSignedIn ? <p className='mt-2 text-xs text-muted-foreground'>{mapCopy.favoritesSignInHint}</p> : null}
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
                      {visibleTags.length === 0 ? (
                        <p className='text-sm text-muted-foreground'>{mapCopy.noTagsLabel}</p>
                      ) : (
                        visibleTags.map((option) => {
                          const isChecked = tags.includes(option.tag)
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
                {categories.length > 0 ? (
                  <>
                    <Separator />
                    <div className='text-xs text-muted-foreground'>
                      {mapCopy.activeCategoryLabel}:{' '}
                      <span className='text-foreground'>
                        {categories.map((category) => mapCopy.categoryLabels[category]).join(', ')}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {sort === 'distance' && !userLocation && !locationError ? (
        <p className='text-sm text-muted-foreground'>{mapCopy.distanceSortHint}</p>
      ) : null}

      <AnimatePresence initial={false}>
        {activeFilterCount > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className='flex flex-wrap gap-2'
          >
            {favoriteOnly ? (
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
            ) : null}
            {categories.map((category) => (
              <Badge key={category} variant='outline' className='gap-1'>
                {mapCopy.categoryLabels[category]}
                <button
                  type='button'
                  onClick={() => toggleCategory(category)}
                  className='text-muted-foreground hover:text-foreground'
                  aria-label={mapCopy.removeCategoryChipAria}
                >
                  <X className='size-3' />
                </button>
              </Badge>
            ))}
            {tags.map((tag) => (
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
        ) : null}
      </AnimatePresence>

      <Card className='space-y-3 p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h4 className='font-semibold'>{mapCopy.routeTitle}</h4>
            <p className='text-xs text-muted-foreground'>{mapCopy.routeDescription}</p>
          </div>
          {routeStops.length > 0 ? (
            <Button size='sm' variant='ghost' onClick={() => setRouteStops([])}>
              {mapCopy.routeClearLabel}
            </Button>
          ) : null}
        </div>
        <div className='space-y-2'>
          {routeStops.length === 0 ? <p className='text-sm text-muted-foreground'>{mapCopy.routeEmptyLabel}</p> : null}
          {routeStops.map((actor, index) => (
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
        {routeDistance !== null ? (
          <div className='text-xs text-muted-foreground'>
            {mapCopy.routeDistanceLabel}: {routeDistance.toFixed(1)} {mapCopy.distanceUnit}
          </div>
        ) : null}
        {routeLink ? (
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
        ) : null}
      </Card>
    </>
  )

  const renderActorList = (listClassName: string) => (
    <div className={cn('space-y-3', listClassName)}>
      {list.items.length === 0 ? (
        <div className='rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground'>
          {mapCopy.emptyFilteredList}
        </div>
      ) : (
        <AnimatePresence initial={false} mode='popLayout'>
          {list.items.map((actor) => {
            const meta = categoryConfig[actor.category]
            const Icon = meta.icon
            const distance = userLocation ? `${getDistanceKm(userLocation, [actor.lat, actor.lng]).toFixed(1)} ${mapCopy.distanceUnit}` : null
            const actorPoint = toMapPoint(actor)

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
                  className={cn(
                    'cursor-pointer p-4 transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selectedActorId === actor.id && 'ring-2 ring-primary',
                  )}
                  onClick={() => selectActor(actorPoint)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectActor(actorPoint)
                    }
                  }}
                >
                  <div className='flex items-start justify-between gap-4'>
                    <div className='min-w-0'>
                      <h4 className='font-semibold'>{actor.name}</h4>
                      <p className='mt-1 flex items-center gap-1 text-sm text-muted-foreground'>
                        <MapPin className='h-3 w-3 shrink-0' />
                        <span className='truncate'>{actor.address}</span>
                      </p>
                      {distance ? <p className='mt-1 text-xs text-muted-foreground'>{distance}</p> : null}
                      <Badge
                        className='mt-2 flex w-fit items-center gap-1'
                        style={{
                          backgroundColor: meta.color,
                          color: '#fff',
                        }}
                      >
                        <Icon className='h-3 w-3' />
                        {mapCopy.categoryLabels[actor.category]}
                      </Badge>
                    </div>
                    <div className='flex shrink-0 flex-col gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={(event) => {
                          event.stopPropagation()
                          addRouteStop(actorPoint)
                        }}
                        disabled={routeStops.some((item) => item.id === actor.id) || routeStops.length >= 3}
                      >
                        {routeStops.some((item) => item.id === actor.id) ? mapCopy.routeAddedLabel : mapCopy.routeAddLabel}
                      </Button>
                      <Button size='sm' variant='ghost' asChild>
                        <Link
                          href={`/aktorer/${actor.slug}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            recordAction('open_actor', { actorId: actor.id })
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
      {list.hasMore ? (
        <Button type='button' className='w-full' onClick={() => setPage((current) => current + 1)}>
          Vis til
        </Button>
      ) : null}
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

    const buttons = (
      <>
        <Button
          size={isSheet ? 'default' : 'sm'}
          variant={categories.length === 0 ? 'default' : 'secondary'}
          onClick={() => setCategories([])}
          className={cn('cursor-pointer', isSheet && 'col-span-2 w-full justify-start gap-2', !isSheet && 'gap-2')}
        >
          <Layers className='h-4 w-4 shrink-0' />
          {mapCopy.filterAll}
        </Button>
        {categoryOrder.map((category) => {
          const meta = categoryConfig[category]
          const Icon = meta.icon
          const active = categories.includes(category)

          return (
            <Button
              key={category}
              size={isSheet ? 'default' : 'sm'}
              variant='outline'
              onClick={() => toggleCategory(category)}
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
                {categories.length > 0 ? (
                  <span
                    className='ring-background absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2'
                    aria-hidden
                  />
                ) : null}
              </Button>
              {activeCategorySummary ? (
                <span className='max-w-[11rem] truncate rounded-md border border-border/60 bg-background/95 px-2 py-1 text-center text-[11px] font-medium leading-tight text-foreground shadow-sm backdrop-blur-sm'>
                  {activeCategorySummary}
                </span>
              ) : null}
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
                {filtersOpen ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className='w-full max-w-full overflow-hidden lg:w-auto lg:max-w-none'
                  >
                    {renderMapCategoryPicker('overlay')}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className='relative overflow-hidden rounded-xl border shadow-sm'>
          <MapContainer
            center={[60.7945, 11.068]}
            zoom={6}
            className='z-0 h-[min(55dvh,520px)] min-h-[280px] w-full lg:h-[min(600px,calc(100dvh-14rem))] lg:min-h-[480px]'
          >
            <TileLayer attribution='&copy; OpenStreetMap contributors' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
            <ViewportTracker initialBounds={initialSummary.globalBounds} onReady={handleMapReady} onChange={handleViewportChange} />
            <FocusActor actor={selected} />

            {overlay.points.map((actor) => (
              <Marker
                key={actor.id}
                position={[actor.lat, actor.lng]}
                icon={getActorMarkerIcon(actor, selectedActorId === actor.id)}
                eventHandlers={{
                  click: () => selectActor(actor),
                }}
              >
                <Popup className='[&_.leaflet-popup-content-wrapper]:rounded-xl [&_.leaflet-popup-content-wrapper]:shadow-lg [&_.leaflet-popup-content]:m-3'>
                  <div className='w-56 space-y-2'>
                    {actor.image ? (
                      <Link
                        href={`/aktorer/${actor.slug}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='group block overflow-hidden rounded-lg border shadow-sm'
                        onClick={() => recordAction('open_actor', { actorId: actor.id })}
                      >
                        <div className='relative'>
                          <img src={actor.image} alt={actor.name} className='h-28 w-full object-cover' />
                          <div className='absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
                            <span className='text-xs font-semibold uppercase tracking-wide text-white'>
                              {mapCopy.popupHoverCta}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ) : null}
                    <div className='flex flex-col gap-1'>
                      <p className='text-sm font-semibold !my-0'>{actor.name}</p>
                      <p className='text-xs text-muted-foreground !my-0'>{actor.address}</p>
                      <div className='mt-1 flex gap-2'>
                        <Button asChild size='sm' variant='outline' className='h-7 px-2 text-xs'>
                          <Link
                            href={`/aktorer/${actor.slug}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            onClick={() => recordAction('open_actor', { actorId: actor.id })}
                          >
                            Åpne
                          </Link>
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='h-7 px-2 text-xs'
                          onClick={() => addRouteStop(actor)}
                          disabled={routeStops.some((item) => item.id === actor.id) || routeStops.length >= 3}
                        >
                          {routeStops.some((item) => item.id === actor.id) ? mapCopy.routeAddedLabel : mapCopy.routeAddLabel}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {overlay.clusters.map((cluster) => (
              <Marker
                key={cluster.id}
                position={[cluster.lat, cluster.lng]}
                icon={buildClusterIcon(String(cluster.count))}
                eventHandlers={{
                  click: () => mapRef.current?.setView([cluster.lat, cluster.lng], Math.min((viewport?.zoom ?? 6) + 2, 14)),
                }}
              />
            ))}

            {userLocation ? (
              <Marker position={userLocation} icon={userMarkerIcon}>
                <Popup>{mapCopy.nearMeLabel}</Popup>
              </Marker>
            ) : null}

            {routeStops.length > 1 ? (
              <Polyline positions={routeStops.map((item) => [item.lat, item.lng] as [number, number])} pathOptions={{ color: '#16a34a', weight: 4 }} />
            ) : null}
          </MapContainer>

          <div className='pointer-events-none absolute inset-0'>
            <div className='pointer-events-auto absolute bottom-4 left-4 z-[1000] flex flex-col gap-2'>
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
                onClick={requestLocation}
                className='cursor-pointer gap-2 bg-background/95 shadow-md'
              >
                <Crosshair className='h-4 w-4' />
                {mapCopy.nearMeLabel}
              </Button>
            </div>
          </div>
        </div>

        <Button
          type='button'
          size='lg'
          className='fixed right-4 z-[1001] gap-2 rounded-full shadow-lg max-md:bottom-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom,0px)+0.875rem)] md:bottom-5 lg:hidden'
          onClick={() => setListSheetOpen(true)}
          aria-label={`${mapCopy.openListFab} (${list.total})`}
        >
          <List className='h-5 w-5' />
          <span className='font-medium'>{mapCopy.openListFabWithCount.replace('{count}', String(list.total))}</span>
        </Button>

        {locationError ? <p className='mt-2 text-sm text-destructive'>{locationError}</p> : null}
      </div>

      <div className='hidden min-h-0 lg:block'>{renderSidebar()}</div>

      <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
        <SheetContent
          ref={handleListSheetContentRef}
          side='bottom'
          tabIndex={-1}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            listSheetContentRef.current?.focus()
          }}
          className='flex h-[88dvh] max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-t-2xl border-t p-0 focus:outline-none lg:hidden'
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
            <SheetDescription className='text-left text-pretty'>{mapCopy.mapCategorySheetDescription}</SheetDescription>
          </SheetHeader>
          <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain !px-5 !pb-8 !pt-5'>
            {renderMapCategoryPicker('sheet')}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
