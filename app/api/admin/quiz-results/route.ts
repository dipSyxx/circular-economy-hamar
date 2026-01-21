import { listAdminResource, createAdminResource } from "@/app/api/admin/_resource"

export async function GET(request: Request) {
  return listAdminResource("quiz-results")
}

export async function POST(request: Request) {
  return createAdminResource("quiz-results", request)
}