import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

export async function GET(request: Request) {
  return listAdminResource("challenge-completions")
}

export async function POST(request: Request) {
  return createAdminResource("challenge-completions", request)
}
