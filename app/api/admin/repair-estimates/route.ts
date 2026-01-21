import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

export async function GET(request: Request) {
  return listAdminResource("repair-estimates")
}

export async function POST(request: Request) {
  return createAdminResource("repair-estimates", request)
}