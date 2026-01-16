"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import { actors, type ActorCategory } from "@/lib/data";
import { formatTime, getOpeningStatus } from "@/lib/opening-hours";
import { recordAction } from "@/lib/profile-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Armchair,
  Bike,
  Crosshair,
  ExternalLink,
  Hammer,
  Inbox,
  KeyRound,
  Laptop,
  Layers,
  Leaf,
  MapPin,
  Recycle,
  Scissors,
  ShoppingBag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { mapCopy } from "@/content/no";
import { renderToStaticMarkup } from "react-dom/server";

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const getDistanceKm = (from: [number, number], to: [number, number]) => {
  const [lat1, lon1] = from;
  const [lat2, lon2] = to;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
};

const categoryOrder: ActorCategory[] = [
  "brukt",
  "utleie",
  "reparasjon",
  "reparasjon_sko_klar",
  "mobelreparasjon",
  "sykkelverksted",
  "ombruksverksted",
  "mottak_ombruk",
  "baerekraftig_mat",
  "gjenvinning",
];

const categoryMeta: Record<
  ActorCategory,
  { label: string; color: string; icon: LucideIcon }
> = {
  brukt: {
    label: mapCopy.filterBrukt,
    color: "#22c55e",
    icon: ShoppingBag,
  },
  utleie: {
    label: mapCopy.filterUtleie,
    color: "#8b5cf6",
    icon: KeyRound,
  },
  reparasjon: {
    label: mapCopy.filterReparasjon,
    color: "#f59e0b",
    icon: Laptop,
  },
  reparasjon_sko_klar: {
    label: mapCopy.filterReparasjonSkoKlar,
    color: "#ec4899",
    icon: Scissors,
  },
  mobelreparasjon: {
    label: mapCopy.filterMobelreparasjon,
    color: "#a16207",
    icon: Armchair,
  },
  sykkelverksted: {
    label: mapCopy.filterSykkelverksted,
    color: "#06b6d4",
    icon: Bike,
  },
  ombruksverksted: {
    label: mapCopy.filterOmbruksverksted,
    color: "#14b8a6",
    icon: Hammer,
  },
  mottak_ombruk: {
    label: mapCopy.filterMottakOmbruk,
    color: "#0ea5e9",
    icon: Inbox,
  },
  baerekraftig_mat: {
    label: mapCopy.filterBaerekraftigMat,
    color: "#65a30d",
    icon: Leaf,
  },
  gjenvinning: {
    label: mapCopy.filterGjenvinning,
    color: "#3b82f6",
    icon: Recycle,
  },
};

const buildMarkerIcon = (color: string, Icon: LucideIcon) => {
  const svg = renderToStaticMarkup(
    <Icon color="white" size={16} strokeWidth={2} />
  );
  return L.divIcon({
    className: "",
    html: `<div style="background-color:${color}; width: 30px; height: 30px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">${svg}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

const getFilterButtonStyle = (active: boolean, color: string) => ({
  backgroundColor: active ? color : `${color}1A`,
  color: active ? "#fff" : color,
  borderColor: color,
});

function MapFocus({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 14);
    }
  }, [map, position]);

  return null;
}

export function MapComponent() {
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ActorCategory>("all");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routeStops, setRouteStops] = useState<string[]>([]);

  const isActor = (
    actor: (typeof actors)[number] | undefined
  ): actor is (typeof actors)[number] => Boolean(actor);

  const filteredActors = useMemo(() => {
    const list =
      filter === "all"
        ? actors
        : actors.filter((actor) => actor.category === filter);
    if (!userLocation) return list;
    return [...list].sort((a, b) => {
      const distA = getDistanceKm(userLocation, [a.lat, a.lng]);
      const distB = getDistanceKm(userLocation, [b.lat, b.lng]);
      return distA - distB;
    });
  }, [filter, userLocation]);

  const selectedActor =
    filteredActors.find((actor) => actor.id === selectedActorId) ?? null;
  const routeActors = useMemo(
    () =>
      routeStops
        .map((id) => actors.find((actor) => actor.id === id))
        .filter(isActor),
    [routeStops]
  );
  const routePoints = useMemo(
    () =>
      routeActors.map((actor) => [actor.lat, actor.lng] as [number, number]),
    [routeActors]
  );

  const routeDistance = useMemo(() => {
    if (routePoints.length < 2) return null;
    const points = userLocation ? [userLocation, ...routePoints] : routePoints;
    let total = 0;
    for (let index = 0; index < points.length - 1; index += 1) {
      total += getDistanceKm(points[index], points[index + 1]);
    }
    return total;
  }, [routePoints, userLocation]);

  const routeLink = useMemo(() => {
    if (routeActors.length < 2) return null;
    const formatCoords = (lat: number, lng: number) => `${lat},${lng}`;
    const origin = userLocation
      ? formatCoords(userLocation[0], userLocation[1])
      : formatCoords(routeActors[0].lat, routeActors[0].lng);
    const destination = formatCoords(
      routeActors[routeActors.length - 1].lat,
      routeActors[routeActors.length - 1].lng
    );
    const waypoints = userLocation
      ? routeActors.slice(0, -1)
      : routeActors.slice(1, -1);
    const waypointParam =
      waypoints.length > 0
        ? `&waypoints=${encodeURIComponent(
            waypoints
              .map((actor) => formatCoords(actor.lat, actor.lng))
              .join("|")
          )}`
        : "";
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}${waypointParam}`;
  }, [routeActors, userLocation]);

  useEffect(() => {
    if (
      selectedActorId &&
      !filteredActors.some((actor) => actor.id === selectedActorId)
    ) {
      setSelectedActorId(null);
    }
  }, [filteredActors, selectedActorId]);

  const addRouteStop = (actorId: string) => {
    setRouteStops((prev) => {
      if (prev.includes(actorId) || prev.length >= 3) return prev;
      return [...prev, actorId];
    });
  };

  const removeRouteStop = (actorId: string) => {
    setRouteStops((prev) => prev.filter((id) => id !== actorId));
  };

  const clearRoute = () => {
    setRouteStops([]);
  };

  const icons = useMemo(() => {
    const categoryIcons = categoryOrder.reduce((acc, category) => {
      const meta = categoryMeta[category];
      acc[category] = buildMarkerIcon(meta.color, meta.icon);
      return acc;
    }, {} as Record<ActorCategory, L.DivIcon>);

    return {
      ...categoryIcons,
      user: buildMarkerIcon("#0ea5e9", Crosshair),
    };
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(mapCopy.locationError);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationError(null);
      },
      () => {
        setLocationError(mapCopy.locationError);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
      <div className="relative">
        <div className="absolute top-4 left-[52px] z-[1000] flex gap-2 flex-wrap">
          <div className="flex flex-wrap gap-2 rounded-lg border bg-background/60 p-2 shadow-sm">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "secondary"}
              onClick={() => setFilter("all")}
              className="gap-2"
            >
              <Layers className="h-4 w-4" />
              {mapCopy.filterAll}
            </Button>
            {categoryOrder.map((category) => {
              const meta = categoryMeta[category];
              const Icon = meta.icon;
              const active = filter === category;
              return (
                <Button
                  key={category}
                  size="sm"
                  variant="outline"
                  onClick={() => setFilter(category)}
                  className="gap-2"
                  style={getFilterButtonStyle(active, meta.color)}
                >
                  <Icon className="h-4 w-4" />
                  {meta.label}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="relative">
          <MapContainer
            center={[60.7945, 11.068]}
            zoom={13}
            className="w-full h-[500px] lg:h-[600px] rounded-xl border"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredActors.map((actor) => (
              <Marker
                key={actor.id}
                position={[actor.lat, actor.lng]}
                icon={icons[actor.category] ?? icons.brukt}
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
            {routePoints.length > 1 && (
              <Polyline
                positions={routePoints}
                pathOptions={{ color: "#16a34a", weight: 4 }}
              />
            )}
            {selectedActor && (
              <MapFocus position={[selectedActor.lat, selectedActor.lng]} />
            )}
            {userLocation && !selectedActor && (
              <MapFocus position={userLocation} />
            )}
          </MapContainer>
          <div className="absolute bottom-4 left-4 z-[1000]">
            <Button
              size="sm"
              variant="outline"
              onClick={requestLocation}
              className="gap-2"
            >
              <Crosshair className="h-4 w-4" />
              {mapCopy.nearMeLabel}
            </Button>
          </div>
        </div>

        {locationError && (
          <p className="mt-2 text-sm text-destructive">{locationError}</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">
          {mapCopy.listTitle} ({filteredActors.length})
        </h3>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{mapCopy.routeTitle}</h4>
              <p className="text-xs text-muted-foreground">
                {mapCopy.routeDescription}
              </p>
            </div>
            {routeStops.length > 0 && (
              <Button size="sm" variant="ghost" onClick={clearRoute}>
                {mapCopy.routeClearLabel}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {routeActors.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {mapCopy.routeEmptyLabel}
              </p>
            )}
            {routeActors.map((actor, index) => (
              <div
                key={actor.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div className="text-sm">
                  <span className="font-semibold">{index + 1}.</span>{" "}
                  {actor.name}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeRouteStop(actor.id)}
                >
                  {mapCopy.routeRemoveLabel}
                </Button>
              </div>
            ))}
          </div>
          {routeDistance !== null && (
            <div className="text-xs text-muted-foreground">
              {mapCopy.routeDistanceLabel}: {routeDistance.toFixed(1)}{" "}
              {mapCopy.distanceUnit}
            </div>
          )}
          {routeLink && (
            <Button asChild size="sm" className="w-full">
              <a
                href={routeLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  recordAction("go_directions", { route: "multi" })
                }
              >
                {mapCopy.routeOpenLabel}
              </a>
            </Button>
          )}
        </Card>

        <div className="space-y-3 max-h-[550px] overflow-y-auto pt-0.5 pl-0.5 pr-2">
          {filteredActors.map((actor) => {
            const meta = categoryMeta[actor.category];
            const Icon = meta.icon;
            const distance =
              userLocation &&
              `${getDistanceKm(userLocation, [actor.lat, actor.lng]).toFixed(
                1
              )} ${mapCopy.distanceUnit}`;
            const openStatus = getOpeningStatus(actor.openingHoursOsm);
            const statusLabel =
              openStatus.state === "open"
                ? mapCopy.openNowLabel
                : openStatus.state === "closed"
                ? mapCopy.closedNowLabel
                : mapCopy.hoursFallbackLabel;
            const statusDetail =
              openStatus.state === "unknown" || !openStatus.nextChange
                ? null
                : `${
                    openStatus.state === "open"
                      ? mapCopy.closesAtLabel
                      : mapCopy.opensAtLabel
                  } ${formatTime(openStatus.nextChange)}`;

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
                    {distance && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {distance}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {statusLabel}
                      {statusDetail ? ` - ${statusDetail}` : ""}
                    </p>
                    <Badge
                      className="mt-2 flex items-center gap-1"
                      style={{ backgroundColor: meta.color, color: "#fff" }}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addRouteStop(actor.id)}
                      disabled={
                        routeStops.includes(actor.id) || routeStops.length >= 3
                      }
                    >
                      {routeStops.includes(actor.id)
                        ? mapCopy.routeAddedLabel
                        : mapCopy.routeAddLabel}
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link
                        href={`/aktorer/${actor.slug}`}
                        onClick={() =>
                          recordAction("open_actor", { actorId: actor.id })
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
