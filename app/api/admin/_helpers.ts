import { NextResponse } from "next/server"
import { getOptionalUser } from "@/lib/auth"

export const requireAdminApi = async () => {
  const result = await getOptionalUser()
  if (!result) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  if (result.dbUser.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { user: result.dbUser }
}

const blockedFields = new Set(["id", "createdAt", "updatedAt"])

export const sanitizePayload = (payload: Record<string, unknown>) => {
  const data = { ...payload }
  for (const key of Object.keys(data)) {
    if (blockedFields.has(key)) {
      delete data[key]
    }
  }
  return data
}
