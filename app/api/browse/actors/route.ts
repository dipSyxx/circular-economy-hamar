import { NextResponse } from "next/server"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"
import { getBrowseResponse } from "@/lib/actors/browse-query"
import { parseActorBrowseFilters } from "@/lib/actors/search-params"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const filters = parseActorBrowseFilters(url.searchParams, { pageSize: 24 })
  const { user, error } = await getPublicUser(filters.favoriteOnly)
  if (error) return error

  if (filters.favoriteOnly && !user) {
    return jsonError("Unauthorized", 401)
  }

  const response = await getBrowseResponse(filters, user?.id ?? null)
  return NextResponse.json(response)
}
