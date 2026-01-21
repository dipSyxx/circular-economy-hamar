import { listPublicResource, createPublicResource } from "@/app/api/public/_resource"

export async function GET(request: Request) {
  return listPublicResource("detailed-facts", request)
}

export async function POST(request: Request) {
  return createPublicResource("detailed-facts", request)
}