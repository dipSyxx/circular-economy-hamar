"use client"

import dynamic from "next/dynamic"
import type { Actor } from "@/lib/data"

const MapComponent = dynamic(() => import("@/components/map-component").then((mod) => mod.MapComponent), {
  ssr: false,
})

interface MapClientProps {
  actors: Actor[]
}

export function MapClient({ actors }: MapClientProps) {
  return <MapComponent actors={actors} />
}
