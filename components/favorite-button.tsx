"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"

type FavoriteButtonProps = {
  actorId: string
  className?: string
}

export function FavoriteButton({ actorId, className }: FavoriteButtonProps) {
  const { data } = authClient.useSession()
  const isSignedIn = Boolean(data?.session)
  const [favorite, setFavorite] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isSignedIn) {
      setFavorite(false)
      setLoaded(true)
      return
    }

    let active = true
    const load = async () => {
      try {
        const response = await fetch(`/api/public/favorites/${actorId}`)
        if (!response.ok) return
        const data = (await response.json()) as { favorite?: boolean }
        if (active) {
          setFavorite(Boolean(data.favorite))
        }
      } finally {
        if (active) setLoaded(true)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [actorId, isSignedIn])

  const toggle = async () => {
    if (!isSignedIn) return
    if (saving) return
    setSaving(true)
    const next = !favorite
    setFavorite(next)
    const response = next
      ? await fetch("/api/public/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actorId }),
        })
      : await fetch(`/api/public/favorites/${actorId}`, { method: "DELETE" })

    if (!response.ok) {
      setFavorite(!next)
    }
    setSaving(false)
  }

  if (!loaded) {
    return null
  }

  if (!isSignedIn) {
    return (
      <Button variant="outline" size="sm" asChild className={className}>
        <Link href="/auth/sign-in">Lagre som favoritt</Link>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant={favorite ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={saving}
      className={cn("gap-2", className)}
    >
      <Heart className={cn("h-4 w-4", favorite && "fill-white")} />
      {favorite ? "Favoritt" : "Lagre"}
    </Button>
  )
}
