import "server-only"

import type { Actor } from "@/lib/data"
import type { TransportMode, TravelEstimateSource } from "@/lib/decision-match-types"

type Coordinates = {
  lat: number
  lng: number
}

export interface TravelEstimate {
  distanceKm: number | null
  travelMinutes: number | null
  source: TravelEstimateSource
}

const MAX_DESTINATIONS_PER_REQUEST = 24
const APPROXIMATE_SPEEDS_KMH: Record<TransportMode, number> = {
  driving: 50,
  cycling: 15,
  walking: 5,
}

const roundDistanceKm = (value: number) => Math.round(value * 10) / 10

const hasCoordinates = (input?: Coordinates | null) =>
  Boolean(
    input &&
      Number.isFinite(input.lat) &&
      Number.isFinite(input.lng) &&
      !(input.lat === 0 && input.lng === 0),
  )

const toRad = (value: number) => (value * Math.PI) / 180

const haversineKm = (from: Coordinates, to: Coordinates) => {
  const dLat = toRad(to.lat - from.lat)
  const dLon = toRad(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return 6371 * c
}

const approximateEstimate = (origin: Coordinates, target: Coordinates, mode: TransportMode): TravelEstimate => {
  const distanceKm = roundDistanceKm(haversineKm(origin, target))
  const speed = APPROXIMATE_SPEEDS_KMH[mode]
  const travelMinutes = distanceKm > 0 ? Math.max(1, Math.round((distanceKm / speed) * 60)) : 0
  return {
    distanceKm,
    travelMinutes,
    source: "approximate",
  }
}

const createNoneEstimate = (): TravelEstimate => ({
  distanceKm: null,
  travelMinutes: null,
  source: "none",
})

const chunk = <T,>(items: T[], size: number) => {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }
  return result
}

type MatrixResponse = {
  distances?: Array<Array<number | null>>
  durations?: Array<Array<number | null>>
}

const fetchMapboxEstimates = async (
  origin: Coordinates,
  actors: Actor[],
  mode: TransportMode,
  token: string,
) => {
  const estimates = new Map<string, TravelEstimate>()

  for (const group of chunk(actors, MAX_DESTINATIONS_PER_REQUEST)) {
    const coordinateList = [
      `${origin.lng},${origin.lat}`,
      ...group.map((actor) => `${actor.lng},${actor.lat}`),
    ].join(";")
    const destinations = group.map((_, index) => String(index + 1)).join(";")
    const url = new URL(
      `https://api.mapbox.com/directions-matrix/v1/mapbox/${mode}/${coordinateList}`,
    )
    url.searchParams.set("annotations", "distance,duration")
    url.searchParams.set("sources", "0")
    url.searchParams.set("destinations", destinations)
    url.searchParams.set("access_token", token)

    const response = await fetch(url, { cache: "no-store" })
    if (!response.ok) {
      throw new Error(`Mapbox matrix request failed with ${response.status}.`)
    }

    const data = (await response.json()) as MatrixResponse
    const distanceRow = data.distances?.[0] ?? []
    const durationRow = data.durations?.[0] ?? []

    group.forEach((actor, index) => {
      const distanceMeters = distanceRow[index]
      const durationSeconds = durationRow[index]

      if (typeof distanceMeters !== "number" || typeof durationSeconds !== "number") {
        return
      }

      estimates.set(actor.id, {
        distanceKm: roundDistanceKm(distanceMeters / 1000),
        travelMinutes: durationSeconds > 0 ? Math.max(1, Math.round(durationSeconds / 60)) : 0,
        source: "mapbox",
      })
    })
  }

  return estimates
}

export const estimateActorTravel = async (
  actors: Actor[],
  origin?: Coordinates | null,
  mode: TransportMode = "driving",
) => {
  const estimates = new Map<string, TravelEstimate>()

  if (!hasCoordinates(origin)) {
    actors.forEach((actor) => {
      estimates.set(actor.id, createNoneEstimate())
    })
    return estimates
  }

  const safeOrigin = origin as Coordinates

  const actorsWithCoordinates = actors.filter((actor) => hasCoordinates(actor))
  const actorsWithoutCoordinates = actors.filter((actor) => !hasCoordinates(actor))

  actorsWithoutCoordinates.forEach((actor) => {
    estimates.set(actor.id, createNoneEstimate())
  })

  if (actorsWithCoordinates.length === 0) {
    return estimates
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN?.trim()

  if (token) {
    try {
      const mapboxEstimates = await fetchMapboxEstimates(safeOrigin, actorsWithCoordinates, mode, token)
      actorsWithCoordinates.forEach((actor) => {
        const estimate = mapboxEstimates.get(actor.id)
        if (estimate) {
          estimates.set(actor.id, estimate)
          return
        }

        estimates.set(
          actor.id,
          approximateEstimate(safeOrigin, { lat: actor.lat, lng: actor.lng }, mode),
        )
      })
      return estimates
    } catch {
      // Fallback to approximate travel below.
    }
  }

  actorsWithCoordinates.forEach((actor) => {
    estimates.set(
      actor.id,
      approximateEstimate(safeOrigin, { lat: actor.lat, lng: actor.lng }, mode),
    )
  })

  return estimates
}
