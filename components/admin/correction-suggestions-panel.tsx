"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { AdminActorCorrectionSuggestion } from "@/lib/data"

type CorrectionsPanelProps = {
  initialSuggestions: AdminActorCorrectionSuggestion[]
}

type FilterStatus = "all" | "pending" | "accepted" | "rejected"

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-"
  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "number") return value.toString()
  return String(value)
}

export function CorrectionSuggestionsPanel({ initialSuggestions }: CorrectionsPanelProps) {
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [filter, setFilter] = useState<FilterStatus>("pending")
  const [selectedId, setSelectedId] = useState<string | null>(initialSuggestions[0]?.id ?? null)
  const [reviewNote, setReviewNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredSuggestions =
    filter === "all" ? suggestions : suggestions.filter((suggestion) => suggestion.status === filter)

  const selectedSuggestion =
    filteredSuggestions.find((suggestion) => suggestion.id === selectedId) ?? filteredSuggestions[0] ?? null

  useEffect(() => {
    if (!selectedSuggestion) return
    setSelectedId(selectedSuggestion.id)
    setReviewNote(selectedSuggestion.reviewNote ?? "")
  }, [selectedSuggestion?.id, selectedSuggestion?.reviewNote])

  const reviewSuggestion = async (status: "accepted" | "rejected") => {
    if (!selectedSuggestion) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/correction-suggestions/${selectedSuggestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewNote,
        }),
      })

      const payload = (await response.json()) as { error?: string; suggestion?: AdminActorCorrectionSuggestion }
      if (!response.ok || !payload.suggestion) {
        throw new Error(payload.error ?? "Kunne ikke behandle forslaget.")
      }

      setSuggestions((current) =>
        current.map((suggestion) => (suggestion.id === payload.suggestion?.id ? payload.suggestion : suggestion)),
      )
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Kunne ikke behandle forslaget.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Korrekturforslag</CardTitle>
          <CardDescription>Moderering av brukersendte korrigeringer.</CardDescription>
          <div className="flex flex-wrap gap-2">
            {(["pending", "accepted", "rejected", "all"] as const).map((status) => (
              <Button key={status} size="sm" variant={filter === status ? "default" : "outline"} onClick={() => setFilter(status)}>
                {status}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredSuggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen forslag i dette filteret.</p>
          ) : (
            filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selectedSuggestion?.id === suggestion.id ? "border-primary bg-primary/5" : "hover:border-primary/40"
                }`}
                onClick={() => setSelectedId(suggestion.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{suggestion.actor?.name ?? "Ukjent aktor"}</p>
                  <Badge variant={suggestion.status === "pending" ? "secondary" : "outline"}>{suggestion.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{suggestion.note}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {suggestion.submittedBy?.name || suggestion.submittedBy?.email || suggestion.submittedById}
                </p>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedSuggestion?.actor?.name ?? "Velg et forslag"}</CardTitle>
          <CardDescription>
            Sammenlign eksisterende data mot foreslått patch, og velg om endringen skal aksepteres eller avvises.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedSuggestion ? (
            <p className="text-sm text-muted-foreground">Velg et forslag fra listen til venstre.</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{selectedSuggestion.status}</Badge>
                <Badge variant="outline">
                  {selectedSuggestion.actor?.county || selectedSuggestion.actor?.municipality || "Ukjent område"}
                </Badge>
                {selectedSuggestion.actor ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/aktorer/${selectedSuggestion.actor.slug}`} target="_blank">
                      Åpne aktørside
                    </Link>
                  </Button>
                ) : null}
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Brukernotat</p>
                <p className="mt-2 text-sm text-muted-foreground">{selectedSuggestion.note}</p>
                {selectedSuggestion.sourceUrl ? (
                  <a
                    href={selectedSuggestion.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm text-primary hover:underline"
                  >
                    Kilde: {selectedSuggestion.sourceUrl}
                  </a>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Forskjeller</p>
                {selectedSuggestion.diff.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Ingen feltendringer. Forslaget bestar bare av notat eller kilde.</p>
                ) : (
                  selectedSuggestion.diff.map((entry) => (
                    <div key={entry.field} className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Felt</p>
                        <p className="text-sm font-medium">{entry.field}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Na verdi</p>
                        <p className="text-sm">{formatValue(entry.currentValue)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Forslag</p>
                        <p className="text-sm">{formatValue(entry.proposedValue)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="correction-review-note">
                  Review note
                </label>
                <Textarea
                  id="correction-review-note"
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder="Valgfri intern eller brukerrettet merknad."
                  rows={4}
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => reviewSuggestion("accepted")} disabled={loading || selectedSuggestion.status !== "pending"}>
                  Aksepter forslag
                </Button>
                <Button
                  variant="outline"
                  onClick={() => reviewSuggestion("rejected")}
                  disabled={loading || selectedSuggestion.status !== "pending"}
                >
                  Avvis forslag
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
