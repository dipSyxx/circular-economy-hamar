import { NextResponse } from "next/server"
import { getOptionalUser } from "@/lib/auth"

export const getPublicUser = async (requireAuth: boolean) => {
  const result = await getOptionalUser()
  if (!result) {
    if (requireAuth) {
      return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
    }
    return { user: null }
  }
  return { user: result.dbUser }
}

export const jsonError = (message: string, status: number) => {
  return NextResponse.json({ error: message }, { status })
}
