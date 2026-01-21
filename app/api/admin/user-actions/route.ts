import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

export async function GET(request: Request) {
  return listAdminResource("user-actions")
}

export async function POST(request: Request) {
  return createAdminResource("user-actions", request)
}
