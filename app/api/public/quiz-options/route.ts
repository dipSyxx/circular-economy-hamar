import { listPublicResource, createPublicResource } from "@/app/api/public/_resource"

export async function GET(request: Request) {
  return listPublicResource("quiz-options", request)
}

export async function POST(request: Request) {
  return createPublicResource("quiz-options", request)
}