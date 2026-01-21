import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

export async function GET(request: Request) {
  return listAdminResource("facts")
}

export async function POST(request: Request) {
  return createAdminResource("facts", request)
}