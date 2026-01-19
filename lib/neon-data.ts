"use client"

import { createClient } from "@neondatabase/neon-js"
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react/adapters"

const dataApiUrl = process.env.NEXT_PUBLIC_NEON_DATA_API_URL
if (!dataApiUrl) {
  throw new Error("NEXT_PUBLIC_NEON_DATA_API_URL is not set")
}

const authUrl =
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ??
  (typeof window !== "undefined" ? `${window.location.origin}/api/auth` : "")

if (!authUrl) {
  throw new Error("NEXT_PUBLIC_NEON_AUTH_URL is not set")
}

export const neonData = createClient({
  auth: {
    adapter: BetterAuthReactAdapter(),
    url: authUrl,
  },
  dataApi: {
    url: dataApiUrl,
  },
})
