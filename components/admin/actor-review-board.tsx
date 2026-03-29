"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ActorTrustBadges } from "@/components/actor-trust-badges"
import type { AdminActorReviewItem, VerificationDueState } from "@/lib/data"
import { getCountyCoverageSummaries, getMunicipalityCoverageSummaries } from "@/lib/pilot-coverage"

type ActorReviewBoardProps = {
  initialActors: AdminActorReviewItem[]
}

const dueStateLabel = (state: VerificationDueState) => {
  if (state === "healthy") return "Frisk"
  if (state === "due_soon") return "Snart forfall"
  if (state === "due") return "Bor reverifiseres"
  if (state === "overdue") return "Over forfall"
  return "Blokkert"
}

export function ActorReviewBoard({ initialActors }: ActorReviewBoardProps) {
  const [actors, setActors] = useState(initialActors)
  const [pilotOnly, setPilotOnly] = useState(false)
  const [pendingOnly, setPendingOnly] = useState(false)
  const [unverifiedOnly, setUnverifiedOnly] = useState(false)
  const [agingOnly, setAgingOnly] = useState(false)
  const [staleOnly, setStaleOnly] = useState(false)
  const [missingSourcesOnly, setMissingSourcesOnly] = useState(false)
  const [dueStateFilter, setDueStateFilter] = useState<VerificationDueState | null>(null)
  const [reverifyingActorId, setReverifyingActorId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const countySummaries = useMemo(() => getCountyCoverageSummaries(actors), [actors])
  const municipalitySummaries = useMemo(() => getMunicipalityCoverageSummaries(actors), [actors])
  const categorySummaries = useMemo(
    () =>
      Object.entries(
        actors
          .filter((actor) => actor.status === "approved")
          .reduce<Record<string, number>>((acc, actor) => {
            acc[actor.category] = (acc[actor.category] ?? 0) + 1
            return acc
          }, {}),
      )
        .map(([category, count]) => ({ category, count }))
        .sort((left, right) => right.count - left.count || left.category.localeCompare(right.category, "no")),
    [actors],
  )

  const filteredActors = actors.filter((actor) => {
    if (pilotOnly && !actor.isPilotCounty) return false
    if (pendingOnly && actor.status !== "pending") return false
    if (unverifiedOnly && actor.verificationStatus !== "unverified") return false
    if (agingOnly && actor.freshnessStatus !== "aging") return false
    if (staleOnly && actor.freshnessStatus !== "stale") return false
    if (missingSourcesOnly && actor.sourceCount > 0) return false
    if (dueStateFilter && actor.dueState !== dueStateFilter) return false
    return true
  })

  const stats = {
    total: actors.length,
    pending: actors.filter((actor) => actor.status === "pending").length,
    stale: actors.filter((actor) => actor.freshnessStatus === "stale").length,
    missingSources: actors.filter((actor) => actor.sourceCount === 0).length,
    pilot: actors.filter((actor) => actor.isPilotCounty).length,
    dueSoon: actors.filter((actor) => actor.dueState === "due_soon").length,
    due: actors.filter((actor) => actor.dueState === "due").length,
    overdue: actors.filter((actor) => actor.dueState === "overdue").length,
    blocked: actors.filter((actor) => actor.dueState === "blocked").length,
  }

  const pilotCoverage = useMemo(
    () => countySummaries.filter((summary) => summary.isPilotCounty),
    [countySummaries],
  )

  const handleReverify = async (actorId: string) => {
    setActionError(null)
    setReverifyingActorId(actorId)

    try {
      const response = await fetch(`/api/admin/actors/${actorId}/reverify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const data = (await response.json().catch(() => null)) as
        | { actor?: AdminActorReviewItem; error?: string }
        | null

      if (!response.ok || !data?.actor) {
        throw new Error(data?.error || "Kunne ikke reverifisere aktoren.")
      }

      setActors((current) =>
        current.map((actor) => (actor.id === data.actor?.id ? data.actor : actor)),
      )
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Kunne ikke reverifisere aktoren.")
    } finally {
      setReverifyingActorId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Aktorer</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Pending submissions</p>
          <p className="text-2xl font-semibold">{stats.pending}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Stale</p>
          <p className="text-2xl font-semibold">{stats.stale}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Manglende kilder</p>
          <p className="text-2xl font-semibold">{stats.missingSources}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Pilotfylker</p>
          <p className="text-2xl font-semibold">{stats.pilot}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Snart forfall</p>
          <p className="text-2xl font-semibold">{stats.dueSoon}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Bor reverifiseres</p>
          <p className="text-2xl font-semibold">{stats.due}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Over forfall</p>
          <p className="text-2xl font-semibold">{stats.overdue}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Blokkert</p>
          <p className="text-2xl font-semibold">{stats.blocked}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilotdekning</CardTitle>
          <CardDescription>
            Se hvilke pilotfylker som er browse-ready, og hvor det fortsatt mangler tjenesteklynger.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-3">
            {pilotCoverage.map((summary) => (
              <div key={summary.countySlug} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{summary.county}</p>
                    <p className="text-sm text-muted-foreground">
                      {summary.approvedActorCount} godkjente aktorer i {summary.municipalityCount} kommuner/byer
                    </p>
                  </div>
                  <Badge variant={summary.isBrowseReady ? "default" : "secondary"}>
                    {summary.isBrowseReady ? "browse-ready" : "needs fill"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">{summary.missingSourceCount} uten kilder</Badge>
                  <Badge variant="outline">{summary.staleCount} stale</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.coverageClusters.map((cluster) => (
                    <Badge key={cluster.key} variant={cluster.isReady ? "outline" : "secondary"}>
                      {cluster.label}: {cluster.actorCount}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Fylkesdekning</CardTitle>
            <CardDescription>
              Godkjente aktorer per fylke, manglende kilder, stale status og serviceklynger.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fylke</TableHead>
                  <TableHead>Godkjent</TableHead>
                  <TableHead>Mangler kilder</TableHead>
                  <TableHead>Stale</TableHead>
                  <TableHead>Klynger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countySummaries.map((summary) => (
                  <TableRow key={summary.countySlug}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{summary.county}</p>
                        <div className="flex flex-wrap gap-2">
                          {summary.isPilotCounty ? <Badge variant="secondary">pilot</Badge> : null}
                          {summary.needsFill ? <Badge variant="outline">needs fill</Badge> : null}
                          {summary.isBrowseReady ? <Badge variant="outline">browse-ready</Badge> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{summary.approvedActorCount}</TableCell>
                    <TableCell>{summary.missingSourceCount}</TableCell>
                    <TableCell>{summary.staleCount}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {summary.coverageClusters.map((cluster) => (
                          <Badge key={cluster.key} variant={cluster.isReady ? "outline" : "secondary"}>
                            {cluster.key}: {cluster.actorCount}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Kommunedekning</CardTitle>
              <CardDescription>Godkjente aktorer per kommune/by i fylkene som allerede har data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kommune/by</TableHead>
                    <TableHead>Fylke</TableHead>
                    <TableHead>Godkjent</TableHead>
                    <TableHead>Stale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {municipalitySummaries.map((summary) => (
                    <TableRow key={`${summary.countySlug}:${summary.municipalitySlug}`}>
                      <TableCell className="font-medium">{summary.municipality}</TableCell>
                      <TableCell>{summary.county}</TableCell>
                      <TableCell>{summary.approvedActorCount}</TableCell>
                      <TableCell>{summary.staleCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kategoridekning</CardTitle>
              <CardDescription>Godkjente aktorer per kategori i hele katalogen.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {categorySummaries.map((summary) => (
                <Badge key={summary.category} variant="outline">
                  {summary.category}: {summary.count}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moderering og friskhet</CardTitle>
          <CardDescription>Filtrer katalogen etter pilotstatus, valideringsbehov og pending flows.</CardDescription>
          <div className="flex flex-wrap gap-2">
            <Button variant={pilotOnly ? "default" : "outline"} size="sm" onClick={() => setPilotOnly((current) => !current)}>
              Pilot fylke
            </Button>
            <Button variant={pendingOnly ? "default" : "outline"} size="sm" onClick={() => setPendingOnly((current) => !current)}>
              Pending submissions
            </Button>
            <Button
              variant={unverifiedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setUnverifiedOnly((current) => !current)}
            >
              Uverifisert
            </Button>
            <Button variant={agingOnly ? "default" : "outline"} size="sm" onClick={() => setAgingOnly((current) => !current)}>
              Aging
            </Button>
            <Button variant={staleOnly ? "default" : "outline"} size="sm" onClick={() => setStaleOnly((current) => !current)}>
              Stale
            </Button>
            <Button
              variant={missingSourcesOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setMissingSourcesOnly((current) => !current)}
            >
              Mangler kilder
            </Button>
            {(["due_soon", "due", "overdue", "blocked"] as VerificationDueState[]).map((state) => (
              <Button
                key={state}
                variant={dueStateFilter === state ? "default" : "outline"}
                size="sm"
                onClick={() => setDueStateFilter((current) => (current === state ? null : state))}
              >
                {dueStateLabel(state)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {actionError ? <p className="mb-3 text-sm text-destructive">{actionError}</p> : null}
          {filteredActors.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen aktorer matcher filtrene.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aktor</TableHead>
                  <TableHead>Omrade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trust</TableHead>
                  <TableHead>Kvalitet</TableHead>
                  <TableHead className="text-right">Lenker</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActors.map((actor) => (
                  <TableRow key={actor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{actor.name}</p>
                        <p className="text-xs text-muted-foreground">{actor.category}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{actor.city || actor.municipality || "-"}</p>
                        <p className="text-xs text-muted-foreground">{actor.county || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={actor.status === "pending" ? "secondary" : "outline"}>{actor.status}</Badge>
                        {actor.isPilotCounty ? <Badge variant="outline">pilot</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ActorTrustBadges actor={actor} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={actor.dueState === "healthy" ? "outline" : "secondary"}>
                          {dueStateLabel(actor.dueState)}
                        </Badge>
                        {actor.qualitySummary.duplicateSourceCount > 0 ? (
                          <Badge variant="outline">duplikater: {actor.qualitySummary.duplicateSourceCount}</Badge>
                        ) : null}
                        {actor.qualitySummary.hasLowDiversitySourceSet ? (
                          <Badge variant="outline">lav diversitet</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReverify(actor.id)}
                          disabled={reverifyingActorId === actor.id}
                        >
                          {reverifyingActorId === actor.id ? "Reverifiserer..." : "Reverifiser"}
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/aktorer/${actor.slug}`} target="_blank">
                            Offentlig side
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/admin/actors">Admin CRUD</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
