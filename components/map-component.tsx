"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
import type { Actor, ActorCategory } from "@/lib/data";
import { categoryConfig, categoryOrder } from "@/lib/categories";
import { formatTime, getOpeningStatus } from "@/lib/opening-hours";
import { recordAction } from "@/lib/profile-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Crosshair,
  ExternalLink,
  Layers,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
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
};

const buildMarkerIcon = (
  color: string,
  Icon: React.ComponentType<{
    color?: string;
    size?: number;
    strokeWidth?: number;
  }>
) => {
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

type SortKey = "default" | "distance" | "name_asc" | "name_desc" | "category";

type TagOption = {
  tag: string;
  count: number;
};

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "default", label: "Standard" },
  { value: "distance", label: "Naermest meg" },
  { value: "name_asc", label: "Navn A-Z" },
  { value: "name_desc", label: "Navn Z-A" },
  { value: "category", label: "Kategori" },
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function MapFocus({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 14);
    }
  }, [map, position]);

  return null;
}

interface MapComponentProps {
  actors: Actor[]
}

export function MapComponent({ actors }: MapComponentProps) {
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ActorCategory>("all");
  const [query, setQuery] = useState("");
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [routeStops, setRouteStops] = useState<string[]>([]);

  const categoryIndex = useMemo(
    () => new Map(categoryOrder.map((category, index) => [category, index])),
    []
  );

  const isActor = (actor: Actor | undefined): actor is Actor => Boolean(actor);

  const categoryFiltered = useMemo(
    () =>
      filter === "all"
        ? actors
        : actors.filter((actor) => actor.category === filter),
    [actors, filter]
  );

  const tagOptions = useMemo<TagOption[]>(() => {
    const counts = new Map<string, number>();
    categoryFiltered.forEach((actor) => {
      actor.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) =>
        a.tag.localeCompare(b.tag, "no", {
          sensitivity: "base",
          numeric: true,
        })
      );
  }, [categoryFiltered]);

  const filteredTagOptions = useMemo(() => {
    const normalized = normalizeText(tagQuery.trim());
    if (!normalized) return tagOptions;
    return tagOptions.filter((option) =>
      normalizeText(option.tag).includes(normalized)
    );
  }, [tagOptions, tagQuery]);

  const normalizedQuery = normalizeText(query.trim());

  const filteredActors = useMemo(() => {
    const list = categoryFiltered.filter((actor) => {
      if (tagFilters.length) {
        const actorTags = actor.tags ?? [];
        if (!tagFilters.some((tag) => actorTags.includes(tag))) {
          return false;
        }
      }

      if (!normalizedQuery) return true;

      const searchText = normalizeText(
        [
          actor.name,
          actor.description,
          actor.longDescription,
          actor.address,
          actor.tags.join(" "),
          mapCopy.categoryLabels[actor.category] ?? "",
        ].join(" ")
      );
      return searchText.includes(normalizedQuery);
    });

    const sorted = [...list];

    if (sortKey === "distance") {
      if (!userLocation) return sorted;
      return sorted.sort((a, b) => {
        const distA = getDistanceKm(userLocation, [a.lat, a.lng]);
        const distB = getDistanceKm(userLocation, [b.lat, b.lng]);
        return distA - distB;
      });
    }

    if (sortKey === "name_asc") {
      return sorted.sort((a, b) =>
        a.name.localeCompare(b.name, "no", { sensitivity: "base", numeric: true })
      );
    }

    if (sortKey === "name_desc") {
      return sorted.sort((a, b) =>
        b.name.localeCompare(a.name, "no", { sensitivity: "base", numeric: true })
      );
    }

    if (sortKey === "category") {
      return sorted.sort((a, b) => {
        const left = categoryIndex.get(a.category) ?? 999;
        const right = categoryIndex.get(b.category) ?? 999;
        if (left !== right) return left - right;
        return a.name.localeCompare(b.name, "no", {
          sensitivity: "base",
          numeric: true,
        });
      });
    }

    if (!userLocation) return sorted;
    return sorted.sort((a, b) => {
      const distA = getDistanceKm(userLocation, [a.lat, a.lng]);
      const distB = getDistanceKm(userLocation, [b.lat, b.lng]);
      return distA - distB;
    });
  }, [
    categoryFiltered,
    tagFilters,
    normalizedQuery,
    sortKey,
    userLocation,
    categoryIndex,
  ]);

  const activeFilterCount = (filter === "all" ? 0 : 1) + tagFilters.length;
  const hasAnyFilter = activeFilterCount > 0 || Boolean(query.trim());

  const selectedActor =
    filteredActors.find((actor) => actor.id === selectedActorId) ?? null;
  const routeActors = useMemo(
    () =>
      routeStops
        .map((id) => actors.find((actor) => actor.id === id))
        .filter(isActor),
    [actors, routeStops]
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

  const toggleTag = (tag: string) => {
    setTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setQuery("");
    setTagFilters([]);
    setTagQuery("");
    setFilter("all");
  };

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
      const meta = categoryConfig[category];
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
      <div className="relative z-49">
        <div className="absolute top-2.5 left-[52px] mr-10 z-[1000] flex gap-2 flex-wrap">
          <div className="flex flex-wrap gap-2 rounded-lg border bg-background/60 p-2 shadow-sm">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "secondary"}
              onClick={() => setFilter("all")}
              className="gap-2 cursor-pointer"
            >
              <Layers className="h-4 w-4" />
              {mapCopy.filterAll}
            </Button>
            {categoryOrder.map((category) => {
              const meta = categoryConfig[category];
              const Icon = meta.icon;
              const active = filter === category;
              return (
                <Button
                  key={category}
                  size="sm"
                  variant="outline"
                  onClick={() => setFilter(category)}
                  className="gap-2 cursor-pointer"
                  style={getFilterButtonStyle(active, meta.color)}
                >
                  <Icon className="h-4 w-4" />
                  {categoryFilterLabels[category]}
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
              className="gap-2 cursor-pointer"
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-lg">
            {mapCopy.listTitle} ({filteredActors.length})
          </h3>
          {hasAnyFilter && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Nullstill alt
            </Button>
          )}
        </div>

        <div className="grid gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Søk i kartlisten"
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

          <div className="flex flex-wrap items-center gap-2">
            <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
              <SelectTrigger className="w-full sm:w-[180px]">
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

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between gap-2 sm:w-auto">
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
              <PopoverContent className="w-[280px] p-4" align="end">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Filtre</span>
                  {tagFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTagFilters([]);
                        setTagQuery("");
                      }}
                    >
                      Nullstill
                    </Button>
                  )}
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Tagger</p>
                    <Input
                      value={tagQuery}
                      onChange={(event) => setTagQuery(event.target.value)}
                      placeholder="Søk tagger"
                      className="mt-2"
                    />
                    <ScrollArea className="mt-2 h-36 pr-3">
                      <div className="grid gap-2">
                        {filteredTagOptions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Ingen tagger.</p>
                        ) : (
                          filteredTagOptions.map((option) => {
                            const isChecked = tagFilters.includes(option.tag);
                            return (
                              <label
                                key={option.tag}
                                className={cn(
                                  "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition",
                                  isChecked && "border-primary/40 bg-primary/5"
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
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  {filter !== "all" && (
                    <>
                      <Separator />
                      <div className="text-xs text-muted-foreground">
                        Aktiv kategori:{" "}
                        <span className="text-foreground">
                          {mapCopy.categoryLabels[filter]}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <AnimatePresence>
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex flex-wrap gap-2"
            >
              {filter !== "all" && (
                <Badge variant="outline" className="gap-1">
                  {mapCopy.categoryLabels[filter]}
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Fjern kategori"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              )}
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
          {filteredActors.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              Ingen aktører matcher søket ditt.
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredActors.map((actor) => {
                const meta = categoryConfig[actor.category];
                const Icon = meta.icon;
                const distance =
                  userLocation &&
                  `${getDistanceKm(userLocation, [actor.lat, actor.lng]).toFixed(
                    1
                  )} ${mapCopy.distanceUnit}`;
                const openStatus = getOpeningStatus(actor.openingHoursOsm ?? undefined);
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
                  <motion.div
                    key={actor.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
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
                            {mapCopy.categoryLabels[actor.category]}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addRouteStop(actor.id)}
                            disabled={
                              routeStops.includes(actor.id) ||
                              routeStops.length >= 3
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
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
