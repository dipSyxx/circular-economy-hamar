"use client"

import { useEffect, useRef } from "react"
import { authClient } from "@/lib/auth/client"

export function AuthSync() {
  const session = authClient.useSession()
  const lastSyncedUserId = useRef<string | null>(null)

  useEffect(() => {
    if (session.isPending) return

    const userId = session.data?.user?.id ?? null
    if (!userId || lastSyncedUserId.current === userId) return

    lastSyncedUserId.current = userId

    fetch("/api/user/sync", { method: "POST" }).catch(() => {
      lastSyncedUserId.current = null
    })
  }, [session.isPending, session.data?.user?.id])

  return null
}
