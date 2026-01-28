"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Actor } from "@/lib/data"
import { authClient } from "@/lib/auth/client"
import { ActorCard } from "@/components/actor-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type FavoriteRecord = {
  actorId: string
  createdAt: string
}

export function MyFavoritesPanel() {
  const { data } = authClient.useSession()
  const isSignedIn = Boolean(data?.session)
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([])
  const [actors, setActors] = useState<Actor[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFavorites = async () => {
    if (!isSignedIn) {
      setFavorites([])
      setActors([])
      setFavoriteIds(new Set())
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/public/favorites", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Kunne ikke hente favoritter.")
      }
      const favoritesData = (await response.json()) as FavoriteRecord[]
      setFavorites(favoritesData)

      const ids = favoritesData.map((favorite) => favorite.actorId)
      setFavoriteIds(new Set(ids))
      if (ids.length === 0) {
        setActors([])
        return
      }

      const actorsResponse = await fetch(`/api/public/actors?ids=${ids.join(",")}`, {
        cache: "no-store",
      })
      if (!actorsResponse.ok) {
        throw new Error("Kunne ikke hente favorittaktorer.")
      }
      const actorsData = (await actorsResponse.json()) as Actor[]
      const actorMap = new Map(actorsData.map((actor) => [actor.id, actor]))
      const orderedActors = ids
        .map((id) => actorMap.get(id))
        .filter(Boolean) as Actor[]
      setActors(orderedActors)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFavorites()
  }, [isSignedIn])

  const toggleFavorite = async (actorId: string) => {
    if (!isSignedIn) return
    const isFavorite = favoriteIds.has(actorId)

    if (!isFavorite) {
      const response = await fetch("/api/public/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId }),
      })
      if (!response.ok) {
        await loadFavorites()
        return
      }
      await loadFavorites()
      return
    }

    const response = await fetch(`/api/public/favorites/${actorId}`, { method: "DELETE" })
    if (!response.ok) {
      await loadFavorites()
      return
    }

    setFavorites((prev) => prev.filter((favorite) => favorite.actorId !== actorId))
    setActors((prev) => prev.filter((actor) => actor.id !== actorId))
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      next.delete(actorId)
      return next
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mine favoritter</CardTitle>
        <CardDescription>Aktorer du har lagret som favoritt.</CardDescription>
      </CardHeader>
      <CardContent>
        {!isSignedIn ? (
          <p className="text-sm text-muted-foreground">
            <Link href="/auth/sign-in" className="text-primary hover:underline">
              Logg inn
            </Link>{" "}
            for a se favorittene dine.
          </p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Laster...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : actors.length === 0 ? (
          <p className="text-sm text-muted-foreground">Du har ingen favoritter ennå.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {actors.map((actor) => (
              <ActorCard
                key={actor.id}
                actor={actor}
                showFavorite
                isFavorite={favoriteIds.has(actor.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
