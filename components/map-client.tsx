"use client"

import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("@/components/map-component").then((mod) => mod.MapComponent), {
  ssr: false,
})

export function MapClient() {
  return <MapComponent />
}
