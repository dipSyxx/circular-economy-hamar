import { listPublicResource, createPublicResource } from "@/app/api/public/_resource"

export async function GET(request: Request) {
  return listPublicResource("co2e-sources", request)
}

export async function POST(request: Request) {
  return createPublicResource("co2e-sources", request)
}