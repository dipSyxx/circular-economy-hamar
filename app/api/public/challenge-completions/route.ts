import { listPublicResource, createPublicResource } from "@/app/api/public/_resource"

export async function GET(request: Request) {
  return listPublicResource("challenge-completions", request)
}

export async function POST(request: Request) {
  return createPublicResource("challenge-completions", request)
}