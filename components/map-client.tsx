"use client"

import dynamic from "next/dynamic"
import type { ActorBrowseFilters, ActorMapSummary } from "@/lib/actors/types"

const MapComponent = dynamic(() => import("@/components/map-component").then((mod) => mod.MapComponent), {
  ssr: false,
})

interface MapClientProps {
  initialSummary: ActorMapSummary
  initialFilters: ActorBrowseFilters
}

export function MapClient({ initialSummary, initialFilters }: MapClientProps) {
  return <MapComponent initialSummary={initialSummary} initialFilters={initialFilters} />
}
