"use client"

import { useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
import iconUrl from "leaflet/dist/images/marker-icon.png"
import shadowUrl from "leaflet/dist/images/marker-shadow.png"
import { actors } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ExternalLink, Crosshair } from "lucide-react"
import Link from "next/link"
import { mapCopy } from "@/content/no"

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

function MapFocus({ position }: { position: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, 14)
    }
  }, [map, position])

  return null
}

export function MapComponent() {
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "brukt" | "reparasjon" | "gjenvinning">("all")
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [routeStops, setRouteStops] = useState<string[]>([])

  const isActor = (actor: (typeof actors)[number] | undefined): actor is (typeof actors)[number] => Boolean(actor)

  const filteredActors = useMemo(() => {
    const list = filter === "all" ? actors : actors.filter((actor) => actor.category === filter)
    if (!userLocation) return list
    return [...list].sort((a, b) => {
      const distA = getDistanceKm(userLocation, [a.lat, a.lng])
      const distB = getDistanceKm(userLocation, [b.lat, b.lng])
      return distA - distB
    })
  }, [filter, userLocation])

  const selectedActor = filteredActors.find((actor) => actor.id === selectedActorId) ?? null
  const routeActors = useMemo(
    () => routeStops.map((id) => actors.find((actor) => actor.id === id)).filter(isActor),
    [routeStops],
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
    const origin = userLocation ? `${userLocation[0]},${userLocation[1]}` : routeActors[0].address
    const destination = routeActors[routeActors.length - 1].address
    const waypoints = userLocation ? routeActors.slice(0, -1) : routeActors.slice(1, -1)
    const waypointParam =
      waypoints.length > 0 ? `&waypoints=${encodeURIComponent(waypoints.map((actor) => actor.address).join("|"))}` : ""
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(
      destination,
    )}${waypointParam}`
  }, [routeActors, userLocation])

  useEffect(() => {
    if (selectedActorId && !filteredActors.some((actor) => actor.id === selectedActorId)) {
      setSelectedActorId(null)
    }
  }, [filteredActors, selectedActorId])

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
    const createIcon = (color: string) =>
      L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color:${color}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      })

    return {
      brukt: createIcon("#22c55e"),
      reparasjon: createIcon("#eab308"),
      gjenvinning: createIcon("#3b82f6"),
      user: createIcon("#0ea5e9"),
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
        setLocationError(null)
      },
      () => {
        setLocationError(mapCopy.locationError)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
      <div className="relative">
        <div className="absolute top-4 left-4 z-[1000] flex gap-2 flex-wrap">
          <Button size="sm" variant={filter === "all" ? "default" : "secondary"} onClick={() => setFilter("all")}>
            {mapCopy.filterAll}
          </Button>
          <Button size="sm" variant={filter === "brukt" ? "default" : "secondary"} onClick={() => setFilter("brukt")}>
            {mapCopy.filterBrukt}
          </Button>
          <Button
            size="sm"
            variant={filter === "reparasjon" ? "default" : "secondary"}
            onClick={() => setFilter("reparasjon")}
          >
            {mapCopy.filterReparasjon}
          </Button>
          <Button
            size="sm"
            variant={filter === "gjenvinning" ? "default" : "secondary"}
            onClick={() => setFilter("gjenvinning")}
          >
            {mapCopy.filterGjenvinning}
          </Button>
          <Button size="sm" variant="outline" onClick={requestLocation} className="gap-2">
            <Crosshair className="h-4 w-4" />
            {mapCopy.nearMeLabel}
          </Button>
        </div>

        <MapContainer center={[60.7945, 11.068]} zoom={13} className="w-full h-[500px] lg:h-[600px] rounded-xl border">
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filteredActors.map((actor) => (
            <Marker
              key={actor.id}
              position={[actor.lat, actor.lng]}
              icon={icons[actor.category]}
              eventHandlers={{
                click: () => setSelectedActorId(actor.id),
              }}
            >
              <Popup>
                <strong>{actor.name}</strong>
                <br />
                {actor.address}
              </Popup>
            </Marker>
          ))}
          {userLocation && (
            <Marker position={userLocation} icon={icons.user}>
              <Popup>{mapCopy.nearMeLabel}</Popup>
            </Marker>
          )}
          {routePoints.length > 1 && <Polyline positions={routePoints} pathOptions={{ color: "#16a34a", weight: 4 }} />}
          {selectedActor && <MapFocus position={[selectedActor.lat, selectedActor.lng]} />}
          {userLocation && !selectedActor && <MapFocus position={userLocation} />}
        </MapContainer>

        {locationError && <p className="mt-2 text-sm text-destructive">{locationError}</p>}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          {mapCopy.listTitle} ({filteredActors.length})
        </h3>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Route mode</h4>
              <p className="text-xs text-muted-foreground">Pick up to 3 stops for a quick itinerary.</p>
            </div>
            {routeStops.length > 0 && (
              <Button size="sm" variant="ghost" onClick={clearRoute}>
                Clear
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {routeActors.length === 0 && <p className="text-sm text-muted-foreground">No stops selected yet.</p>}
            {routeActors.map((actor, index) => (
              <div key={actor.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <div className="text-sm">
                  <span className="font-semibold">{index + 1}.</span> {actor.name}
                </div>
                <Button size="sm" variant="outline" onClick={() => removeRouteStop(actor.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
          {routeDistance !== null && (
            <div className="text-xs text-muted-foreground">
              Estimated distance: {routeDistance.toFixed(1)} {mapCopy.distanceUnit}
            </div>
          )}
          {routeLink && (
            <Button asChild size="sm" className="w-full">
              <a href={routeLink} target="_blank" rel="noopener noreferrer">
                Open route in Maps
              </a>
            </Button>
          )}
        </Card>

        <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
          {filteredActors.map((actor) => {
            const distance =
              userLocation &&
              `${getDistanceKm(userLocation, [actor.lat, actor.lng]).toFixed(1)} ${mapCopy.distanceUnit}`

            return (
              <Card
                key={actor.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedActorId === actor.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedActorId(actor.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold">{actor.name}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {actor.address}
                    </p>
                    {distance && <p className="text-xs text-muted-foreground mt-1">{distance}</p>}
                    <Badge className="mt-2" variant="secondary">
                      {mapCopy.categoryLabels[actor.category]}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" onClick={() => addRouteStop(actor.id)} disabled={routeStops.includes(actor.id) || routeStops.length >= 3}>
                      {routeStops.includes(actor.id) ? "Added" : "Add"}
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/aktorer/${actor.slug}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
