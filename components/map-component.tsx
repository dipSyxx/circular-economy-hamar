"use client"

import { useEffect, useRef, useState } from "react"
import { actors } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, ExternalLink } from "lucide-react"
import Link from "next/link"

declare global {
  interface Window {
    L: typeof import("leaflet")
  }
}

export function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [selectedActor, setSelectedActor] = useState<(typeof actors)[0] | null>(null)
  const [filter, setFilter] = useState<"all" | "brukt" | "reparasjon" | "gjenvinning">("all")

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Load Leaflet CSS
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(link)

    // Load Leaflet JS
    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.onload = () => {
      const L = window.L

      // Initialize map centered on Hamar
      const map = L.map(mapRef.current!).setView([60.7945, 11.068], 14)
      mapInstanceRef.current = map

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)

      // Custom icons
      const createIcon = (color: string) =>
        L.divIcon({
          className: "custom-marker",
          html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        })

      const icons = {
        brukt: createIcon("#22c55e"),
        reparasjon: createIcon("#eab308"),
        gjenvinning: createIcon("#3b82f6"),
      }

      // Add markers for each actor
      actors.forEach((actor) => {
        const marker = L.marker([actor.lat, actor.lng], { icon: icons[actor.category] })
          .addTo(map)
          .on("click", () => setSelectedActor(actor))

        marker.bindPopup(`<strong>${actor.name}</strong><br>${actor.address}`)
      })
    }
    document.head.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const filteredActors = filter === "all" ? actors : actors.filter((a) => a.category === filter)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
      <div className="relative">
        <div className="absolute top-4 left-4 z-[1000] flex gap-2 flex-wrap">
          <Button size="sm" variant={filter === "all" ? "default" : "secondary"} onClick={() => setFilter("all")}>
            Alle
          </Button>
          <Button size="sm" variant={filter === "brukt" ? "default" : "secondary"} onClick={() => setFilter("brukt")}>
            Brukt
          </Button>
          <Button
            size="sm"
            variant={filter === "reparasjon" ? "default" : "secondary"}
            onClick={() => setFilter("reparasjon")}
          >
            Reparasjon
          </Button>
        </div>

        <div ref={mapRef} className="w-full h-[500px] lg:h-[600px] rounded-xl overflow-hidden border" />
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Aktører ({filteredActors.length})</h3>

        <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
          {filteredActors.map((actor) => (
            <Card
              key={actor.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${selectedActor?.id === actor.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedActor(actor)}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold">{actor.name}</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {actor.address}
                  </p>
                  <Badge className="mt-2" variant="secondary">
                    {actor.category === "brukt"
                      ? "Brukt"
                      : actor.category === "reparasjon"
                        ? "Reparasjon"
                        : "Gjenvinning"}
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/aktorer/${actor.slug}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
