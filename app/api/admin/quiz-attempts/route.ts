import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

export async function GET(request: Request) {
  return listAdminResource("quiz-attempts")
}

export async function POST(request: Request) {
  return createAdminResource("quiz-attempts", request)
}
