import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

export async function GET(request: Request) {
  return listAdminResource("detailed-fact-sources")
}

export async function POST(request: Request) {
  return createAdminResource("detailed-fact-sources", request)
}