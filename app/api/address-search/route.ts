import { NextRequest, NextResponse } from "next/server"

const ADDRESS_SEARCH_URL = "https://oda.com/tienda-web-api/v1/geodata/address-search/"

type ExternalAddressResponse = {
  address_id: string
  main_text: string
  secondary_text: string
  is_complete: boolean
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim()

  if (!query) {
    return NextResponse.json({ data: [] })
  }

  try {
    const response = await fetch(`${ADDRESS_SEARCH_URL}?query=${encodeURIComponent(query)}`, {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Klarte ikke å hente adresser." }, { status: response.status })
    }

    const data = (await response.json()) as ExternalAddressResponse[]
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Adresseoppslag feilet", error)
    return NextResponse.json({ error: "Kunne ikke hente adresser." }, { status: 500 })
  }
}
