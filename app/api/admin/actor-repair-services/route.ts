import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

export async function GET(request: Request) {
  return listAdminResource("actor-repair-services")
}

export async function POST(request: Request) {
  return createAdminResource("actor-repair-services", request)
}