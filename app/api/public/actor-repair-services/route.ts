import { listPublicResource, createPublicResource } from "@/app/api/public/_resource"

export async function GET(request: Request) {
  return listPublicResource("actor-repair-services", request)
}

export async function POST(request: Request) {
  return createPublicResource("actor-repair-services", request)
}