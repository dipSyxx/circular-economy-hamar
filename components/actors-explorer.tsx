'use client'

import { ActorCard } from '@/components/actor-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { actorCopy } from '@/content/no'
import { buildActorBrowseSearchParams } from '@/lib/actors/search-params'
import type { ActorBrowseFilters, ActorBrowseResponse, ActorListItem, ActorSortKey } from '@/lib/actors/types'
import { authClient } from '@/lib/auth/client'
import type { ActorCategory } from '@/lib/data'
import { cn } from '@/lib/utils'
import { Crosshair, Search, SlidersHorizontal, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'

type ActorsExplorerProps = {
  initialData: ActorBrowseResponse
  initialFilters: ActorBrowseFilters
  syncToUrl?: boolean
  enableGeographyFilters?: boolean
  lockedCounty?: string | null
  lockedMunicipality?: string | null
  lockedCategories?: ActorCategory[]
}

const sortOptions: Array<{ value: ActorSortKey; label: string }> = [
  { value: 'default', label: 'Standard' },
  { value: 'favorite', label: 'Favoritter først' },
  { value: 'distance', label: 'Nærmest meg' },
  { value: 'name_asc', label: 'Navn A-Z' },
  { value: 'name_desc', label: 'Navn Z-A' },
  { value: 'category', label: 'Kategori' },
]

const ALL_COUNTIES = '__all_counties__'
const ALL_MUNICIPALITIES = '__all_municipalities__'

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

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

export function ActorsExplorer({
  initialData,
  initialFilters,
  syncToUrl = false,
  enableGeographyFilters = false,
  lockedCounty = null,
  lockedMunicipality = null,
  lockedCategories = [],
}: ActorsExplorerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data } = authClient.useSession()
  const isSignedIn = Boolean(data?.session)

  const [query, setQuery] = useState(initialFilters.q)
  const deferredQuery = useDeferredValue(query)
  const [sort, setSort] = useState<ActorSortKey>(initialFilters.sort)
  const [categories, setCategories] = useState<ActorCategory[]>(initialFilters.categories)
  const [county, setCounty] = useState(initialFilters.county ?? lockedCounty ?? null)
  const [municipality, setMunicipality] = useState(initialFilters.municipality ?? lockedMunicipality ?? null)
  const [tags, setTags] = useState<string[]>(initialFilters.tags)
  const [favoriteOnly, setFavoriteOnly] = useState(initialFilters.favoriteOnly)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    typeof initialFilters.lat === 'number' && typeof initialFilters.lng === 'number'
      ? [initialFilters.lat, initialFilters.lng]
      : null,
  )
  const [locationError, setLocationError] = useState<string | null>(null)
  const [tagQuery, setTagQuery] = useState('')
  const [items, setItems] = useState<ActorListItem[]>(initialData.items)
  const [total, setTotal] = useState(initialData.total)
  const [hasMore, setHasMore] = useState(initialData.hasMore)
  const [page, setPage] = useState(initialData.page)
  const [facets, setFacets] = useState(initialData.facets)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastRequestKeyRef = useRef<string>(buildActorBrowseSearchParams(initialFilters).toString())

  useEffect(() => {
    if (!isSignedIn && favoriteOnly) {
      setFavoriteOnly(false)
      setPage(1)
    }
  }, [favoriteOnly, isSignedIn])

  const effectiveFilters = useMemo<ActorBrowseFilters>(() => {
    const nextCounty = lockedCounty ?? county
    const nextMunicipality = lockedMunicipality ?? municipality
    const nextCategories = lockedCategories.length > 0 ? lockedCategories : categories
    return {
      q: deferredQuery.trim(),
      categories: nextCategories,
      county: nextCounty,
      municipality: nextCounty ? nextMunicipality : null,
      tags,
      favoriteOnly,
      sort,
      page,
      pageSize: 24,
      lat: userLocation?.[0] ?? null,
      lng: userLocation?.[1] ?? null,
      zoom: null,
      bounds: null,
    }
  }, [
    categories,
    county,
    deferredQuery,
    favoriteOnly,
    lockedCategories,
    lockedCounty,
    lockedMunicipality,
    municipality,
    page,
    sort,
    tags,
    userLocation,
  ])

  const requestKey = useMemo(() => buildActorBrowseSearchParams(effectiveFilters).toString(), [effectiveFilters])

  useEffect(() => {
    if (!syncToUrl) return
    const params = buildActorBrowseSearchParams({
      ...effectiveFilters,
      categories: lockedCategories.length > 0 ? [] : effectiveFilters.categories,
      county: lockedCounty ? null : effectiveFilters.county,
      municipality: lockedMunicipality ? null : effectiveFilters.municipality,
      page: 1,
    })
    const nextUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname
    startTransition(() => {
      router.replace(nextUrl, { scroll: false })
    })
  }, [
    effectiveFilters.categories,
    effectiveFilters.county,
    effectiveFilters.favoriteOnly,
    effectiveFilters.municipality,
    effectiveFilters.q,
    effectiveFilters.sort,
    effectiveFilters.tags,
    lockedCategories.length,
    lockedCounty,
    lockedMunicipality,
    pathname,
    router,
    syncToUrl,
  ])

  useEffect(() => {
    if (requestKey === lastRequestKeyRef.current) return
    lastRequestKeyRef.current = requestKey

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)

    const load = async () => {
      try {
        const response = await fetch(`/api/browse/actors?${requestKey}`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(payload?.error ?? 'Kunne ikke hente aktører.')
        }

        const payload = (await response.json()) as ActorBrowseResponse
        setItems((current) => (effectiveFilters.page > 1 ? [...current, ...payload.items] : payload.items))
        setTotal(payload.total)
        setHasMore(payload.hasMore)
        setPage(payload.page)
        setFacets(payload.facets)
      } catch (fetchError) {
        if (controller.signal.aborted) return
        setError(fetchError instanceof Error ? fetchError.message : 'Kunne ikke hente aktører.')
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [effectiveFilters.page, requestKey])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const filteredTagOptions = useMemo(() => {
    const normalizedQuery = normalizeText(tagQuery.trim())
    if (!normalizedQuery) return facets.tags
    return facets.tags.filter((option) => normalizeText(option.tag).includes(normalizedQuery))
  }, [facets.tags, tagQuery])

  const activeFilterCount =
    categories.length + tags.length + (favoriteOnly ? 1 : 0) + (county ? 1 : 0) + (municipality ? 1 : 0)

  const hasAnyFilter = activeFilterCount > 0 || Boolean(query.trim())
  const canSelectCounty = enableGeographyFilters && !lockedCounty
  const canSelectMunicipality = enableGeographyFilters && !lockedMunicipality && Boolean(lockedCounty ?? county)
  const canSelectCategories = lockedCategories.length === 0

  const setFiltersAndResetPage = (updater: () => void) => {
    updater()
    setPage(1)
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolokasjon er ikke tilgjengelig.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationError(null)
        setFiltersAndResetPage(() => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        })
      },
      () => {
        setLocationError('Kunne ikke hente posisjon.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const toggleCategory = (category: ActorCategory) => {
    setFiltersAndResetPage(() => {
      setCategories((current) =>
        current.includes(category) ? current.filter((entry) => entry !== category) : [...current, category],
      )
    })
  }

  const toggleTag = (tag: string) => {
    setFiltersAndResetPage(() => {
      setTags((current) => (current.includes(tag) ? current.filter((entry) => entry !== tag) : [...current, tag]))
    })
  }

  const clearFilters = () => {
    setQuery('')
    setSort('default')
    setCategories(lockedCategories.length > 0 ? lockedCategories : [])
    setCounty(lockedCounty)
    setMunicipality(lockedMunicipality)
    setTags([])
    setFavoriteOnly(false)
    setPage(1)
  }

  const toggleFavorite = async (actorId: string) => {
    const actor = items.find((item) => item.id === actorId)
    if (!actor || !isSignedIn) return

    const nextFavorite = !actor.isFavorite
    setItems((current) =>
      current
        .map((item) => (item.id === actorId ? { ...item, isFavorite: nextFavorite } : item))
        .filter((item) => !(favoriteOnly && item.id === actorId && !nextFavorite)),
    )
    if (favoriteOnly && !nextFavorite) {
      setTotal((current) => Math.max(0, current - 1))
    }

    try {
      const response = await fetch(
        nextFavorite ? '/api/public/favorites' : `/api/public/favorites/${actorId}`,
        nextFavorite
          ? {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ actorId }),
            }
          : {
              method: 'DELETE',
            },
      )

      if (!response.ok) {
        throw new Error('Kunne ikke oppdatere favoritt.')
      }
    } catch {
      setItems((current) =>
        current.map((item) => (item.id === actorId ? { ...item, isFavorite: !nextFavorite } : item)),
      )
    }
  }

  const displayedItems = useMemo(() => {
    if (!userLocation || effectiveFilters.sort !== 'distance') return items
    return [...items].sort(
      (left, right) =>
        getDistanceKm(userLocation, [left.lat, left.lng]) - getDistanceKm(userLocation, [right.lat, right.lng]),
    )
  }, [effectiveFilters.sort, items, userLocation])

  return (
    <div className='grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start'>
      <aside className='space-y-4 rounded-2xl border border-border/60 bg-card/40 p-4 lg:sticky lg:top-20 lg:self-start'>
        <div className='space-y-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder='Søk etter navn, sted eller kategori'
              className='pl-9'
            />
          </div>
          <Select
            value={sort}
            onValueChange={(value) =>
              setFiltersAndResetPage(() => {
                setSort(value as ActorSortKey)
              })
            }
          >
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='Sorter' />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sort === 'distance' && !userLocation ? (
            <Button type='button' variant='outline' className='w-full justify-start gap-2' onClick={requestLocation}>
              <Crosshair className='h-4 w-4' />
              Bruk posisjonen min
            </Button>
          ) : null}
          {locationError ? <p className='text-xs text-destructive'>{locationError}</p> : null}
        </div>

        <Separator />

        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-sm font-semibold'>Filtre</h2>
            {hasAnyFilter ? (
              <Button type='button' variant='ghost' size='sm' onClick={clearFilters}>
                Nullstill
              </Button>
            ) : null}
          </div>

          {canSelectCounty ? (
            <Select
              value={county ?? ALL_COUNTIES}
              onValueChange={(value) =>
                setFiltersAndResetPage(() => {
                  setCounty(value === ALL_COUNTIES ? null : value)
                  setMunicipality(null)
                })
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Hele Norge' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_COUNTIES}>Hele Norge</SelectItem>
                {facets.counties.map((option) => (
                  <SelectItem key={option.slug} value={option.slug}>
                    {option.name} ({option.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {canSelectMunicipality ? (
            <Select
              value={municipality ?? ALL_MUNICIPALITIES}
              onValueChange={(value) =>
                setFiltersAndResetPage(() => {
                  setMunicipality(value === ALL_MUNICIPALITIES ? null : value)
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Alle kommuner/byer' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MUNICIPALITIES}>Alle kommuner/byer</SelectItem>
                {facets.municipalities.map((option) => (
                  <SelectItem key={option.slug} value={option.slug}>
                    {option.name} ({option.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {canSelectCategories ? (
            <div className='space-y-2'>
              <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                <SlidersHorizontal className='h-3.5 w-3.5' />
                Kategorier
              </div>
              <div className='flex flex-wrap gap-2'>
                {facets.categories.map((entry) => {
                  const active = categories.includes(entry.category)
                  return (
                    <Button
                      key={entry.category}
                      type='button'
                      variant={active ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => toggleCategory(entry.category)}
                    >
                      {actorCopy.categoryLabels[entry.category]} ({entry.count})
                    </Button>
                  )
                })}
              </div>
            </div>
          ) : null}

          <div className='space-y-2'>
            <div className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>Tagger</div>
            <Input value={tagQuery} onChange={(event) => setTagQuery(event.target.value)} placeholder='Søk tagger' />
            <ScrollArea className='h-48 pr-4'>
              <div className='grid gap-2'>
                {filteredTagOptions.length === 0 ? (
                  <p className='text-sm text-muted-foreground'>Ingen tagger.</p>
                ) : (
                  filteredTagOptions.map((option) => {
                    const checked = tags.includes(option.tag)
                    return (
                      <label
                        key={option.tag}
                        className={cn(
                          'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition',
                          checked && 'border-primary/40 bg-primary/5',
                        )}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleTag(option.tag)} />
                        <span className='truncate'>{option.tag}</span>
                        <span className='ml-auto text-xs text-muted-foreground'>{option.count}</span>
                      </label>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <label
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition',
              favoriteOnly && 'border-primary/40 bg-primary/5',
              !isSignedIn && 'opacity-60',
            )}
          >
            <Checkbox
              checked={favoriteOnly}
              onCheckedChange={(next) =>
                setFiltersAndResetPage(() => {
                  setFavoriteOnly(Boolean(next))
                })
              }
              disabled={!isSignedIn}
            />
            <span>Vis bare favoritter</span>
          </label>
          {!isSignedIn ? <p className='text-xs text-muted-foreground'>Logg inn for å bruke favoritter.</p> : null}
        </div>
      </aside>

      <section className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h2 className='text-xl font-semibold'>Aktører</h2>
            <p className='text-sm text-muted-foreground'>
              {loading && page === 1 ? 'Oppdaterer resultatene...' : `${total} treff`}
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            {county ? <Badge variant='outline'>{county}</Badge> : null}
            {municipality ? <Badge variant='outline'>{municipality}</Badge> : null}
            {favoriteOnly ? <Badge variant='outline'>Favoritter</Badge> : null}
            {tags.map((tag) => (
              <Badge key={tag} variant='outline' className='gap-1'>
                {tag}
                <button type='button' onClick={() => toggleTag(tag)} aria-label={`Fjern ${tag}`}>
                  <X className='h-3 w-3' />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {error ? (
          <div className='rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
            {error}
          </div>
        ) : null}

        {displayedItems.length === 0 && !loading ? (
          <div className='rounded-2xl border border-dashed border-border/60 bg-muted/20 p-8 text-center text-sm text-muted-foreground'>
            Ingen aktører matcher søket ditt.
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3 [content-visibility:auto]'>
            {displayedItems.map((actor) => {
              const distanceLabel =
                userLocation && sort === 'distance'
                  ? `${getDistanceKm(userLocation, [actor.lat, actor.lng]).toFixed(1)} km`
                  : undefined

              return (
                <ActorCard
                  key={actor.id}
                  actor={actor}
                  showFavorite={isSignedIn}
                  isFavorite={actor.isFavorite}
                  onToggleFavorite={toggleFavorite}
                  distanceLabel={distanceLabel}
                />
              )
            })}
          </div>
        )}

        {hasMore ? (
          <div className='flex justify-center pt-2'>
            <Button type='button' size='lg' onClick={() => setPage((current) => current + 1)} disabled={loading}>
              {loading && page > 1 ? 'Laster flere...' : 'Vis til'}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  )
}
