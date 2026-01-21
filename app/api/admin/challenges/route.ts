import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

export async function GET(request: Request) {
  return listAdminResource("challenges")
}

export async function POST(request: Request) {
  return createAdminResource("challenges", request)
}