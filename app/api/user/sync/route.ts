import { NextResponse } from "next/server"
import { getOptionalUser } from "@/lib/auth"

export async function POST() {
  const result = await getOptionalUser()
  if (!result) {
    return new NextResponse(null, { status: 204 })
  }

  return NextResponse.json({ ok: true })
}
