"use client"

import { useEffect, useRef } from "react"
import { authClient } from "@/lib/auth/client"
import { loadProfile } from "@/lib/profile-store"

export function AuthSync() {
  const session = authClient.useSession()
  const lastSyncedUserId = useRef<string | null>(null)

  useEffect(() => {
    if (session.isPending) return

    const userId = session.data?.user?.id ?? null
    if (!userId || lastSyncedUserId.current === userId) return

    lastSyncedUserId.current = userId

    Promise.all([
      fetch("/api/user/sync", { method: "POST" }),
      fetch("/api/user/profile-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loadProfile()),
      }),
    ]).catch(() => {
      lastSyncedUserId.current = null
    })
  }, [session.isPending, session.data?.user?.id])

  return null
}
