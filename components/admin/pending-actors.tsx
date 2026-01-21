"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PendingActor = {
  id: string
  name: string
  category: string
  createdAt: string
  createdBy: {
    name?: string | null
    email?: string | null
  } | null
}

type PendingActorsPanelProps = {
  initialActors: PendingActor[]
  reviewerId: string
}

const formatDate = (value: string, formatter: Intl.DateTimeFormat) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return formatter.format(parsed)
}

const formatOwner = (actor: PendingActor) => {
  if (!actor.createdBy) return "Ukjent bruker"
  return actor.createdBy.name || actor.createdBy.email || "Ukjent bruker"
}

const formatCategory = (value: string) => value.replace(/_/g, " ")

export function PendingActorsPanel({ initialActors, reviewerId }: PendingActorsPanelProps) {
  const [items, setItems] = useState<PendingActor[]>(initialActors)
  const [error, setError] = useState<string | null>(null)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const formatter = useMemo(
    () => new Intl.DateTimeFormat("no-NO", { dateStyle: "medium" }),
    [],
  )

  const setLoading = (id: string, isLoading: boolean) => {
    setLoadingIds((prev) => {
      const next = new Set(prev)
      if (isLoading) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const handleDecision = async (id: string, status: "approved" | "rejected") => {
    setError(null)
    setLoading(id, true)
    try {
      const response = await fetch(`/api/admin/actors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewedById: reviewerId,
          reviewedAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Oppdatering feilet")
      }

      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil")
    } finally {
      setLoading(id, false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventende aktorer</CardTitle>
        <CardDescription>Godkjenn eller avvis aktorer som venter pa gjennomgang.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen aktorer venter pa gjennomgang.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aktor</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Opprettet av</TableHead>
                <TableHead>Dato</TableHead>
                <TableHead className="text-right">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((actor) => {
                const isLoading = loadingIds.has(actor.id)
                return (
                  <TableRow key={actor.id}>
                    <TableCell className="font-medium">{actor.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{formatCategory(actor.category)}</Badge>
                    </TableCell>
                    <TableCell>{formatOwner(actor)}</TableCell>
                    <TableCell>{formatDate(actor.createdAt, formatter)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDecision(actor.id, "rejected")}
                          disabled={isLoading}
                        >
                          Avvis
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleDecision(actor.id, "approved")}
                          disabled={isLoading}
                        >
                          Godkjenn
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
