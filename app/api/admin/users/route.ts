import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

export async function GET(request: Request) {
  return listAdminResource("users")
}

export async function POST(request: Request) {
  return createAdminResource("users", request)
}
