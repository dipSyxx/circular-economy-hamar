import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { getOptionalUser } from "@/lib/auth"

export async function POST() {
  try {
    const result = await getOptionalUser()
    if (!result) {
      return new NextResponse(null, { status: 204 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("user sync failed", error)
    const errorCode =
      error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "User sync failed", code: errorCode, message },
      { status: 500 },
    )
  }
}
