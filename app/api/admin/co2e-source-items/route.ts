import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

export async function GET(request: Request) {
  return listAdminResource("co2e-source-items")
}

export async function POST(request: Request) {
  return createAdminResource("co2e-source-items", request)
}