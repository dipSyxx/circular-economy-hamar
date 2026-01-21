import { listPublicResource, createPublicResource } from "@/app/api/public/_resource"

export async function GET(request: Request) {
  return listPublicResource("quiz-attempts", request)
}

export async function POST(request: Request) {
  return createPublicResource("quiz-attempts", request)
}