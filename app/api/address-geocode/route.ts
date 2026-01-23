import { NextRequest, NextResponse } from "next/server"

type NominatimResult = {
  lat: string
  lon: string
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim()

  if (!query) {
    return NextResponse.json({ error: "Query is required." }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent": "circular-economy-hamar/1.0",
          Accept: "application/json",
        },
        cache: "no-store",
      },
    )

    if (!response.ok) {
      return NextResponse.json({ error: "Kunne ikke hente koordinater." }, { status: response.status })
    }

    const data = (await response.json()) as NominatimResult[]
    const first = data?.[0]
    if (!first) {
      return NextResponse.json({ error: "Ingen koordinater funnet." }, { status: 404 })
    }

    const lat = Number(first.lat)
    const lng = Number(first.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Ugyldige koordinater." }, { status: 422 })
    }

    return NextResponse.json({ lat, lng })
  } catch (error) {
    console.error("Geocode feilet", error)
    return NextResponse.json({ error: "Kunne ikke hente koordinater." }, { status: 500 })
  }
}
