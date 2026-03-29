"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CountyRolloutBoardRow, CountyRolloutStage } from "@/lib/data"

type RolloutBoardProps = {
  initialStatuses: CountyRolloutBoardRow[]
}

const stageLabel = (stage: CountyRolloutStage) => {
  if (stage === "pilot") return "Pilot"
  if (stage === "queued") return "Queued"
  if (stage === "in_progress") return "In progress"
  return "Ready"
}

export function RolloutBoard({ initialStatuses }: RolloutBoardProps) {
  const [statuses, setStatuses] = useState(initialStatuses)
  const [savingCountySlug, setSavingCountySlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { stage: CountyRolloutStage; priority: string; notes: string }>>(
    () =>
      Object.fromEntries(
        initialStatuses.map((status) => [
          status.countySlug,
          {
            stage: status.stage,
            priority: String(status.priority),
            notes: status.notes ?? "",
          },
        ]),
      ),
  )

  const stats = useMemo(
    () => ({
      pilot: statuses.filter((status) => status.stage === "pilot").length,
      queued: statuses.filter((status) => status.stage === "queued").length,
      inProgress: statuses.filter((status) => status.stage === "in_progress").length,
      ready: statuses.filter((status) => status.stage === "ready").length,
    }),
    [statuses],
  )

  const saveRow = async (countySlug: string) => {
    const draft = drafts[countySlug]
    if (!draft) return

    setError(null)
    setSavingCountySlug(countySlug)

    try {
      const response = await fetch(`/api/admin/county-rollout-status/${countySlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: draft.stage,
          priority: Number(draft.priority),
          notes: draft.notes,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { status?: CountyRolloutBoardRow; error?: string }
        | null
      if (!response.ok || !payload?.status) {
        throw new Error(payload?.error || "Kunne ikke oppdatere rolloutstatus.")
      }
      const updatedStatus = payload.status

      setStatuses((current) =>
        current
          .map((status) => (status.countySlug === updatedStatus.countySlug ? updatedStatus : status))
          .sort((left, right) => {
            if (left.priority !== right.priority) return left.priority - right.priority
            if (left.isPilotCounty !== right.isPilotCounty) return left.isPilotCounty ? -1 : 1
            return left.county.localeCompare(right.county, "no", { sensitivity: "base" })
          }),
      )
      setDrafts((current) => ({
        ...current,
        [countySlug]: {
          stage: updatedStatus.stage,
          priority: String(updatedStatus.priority),
          notes: updatedStatus.notes ?? "",
        },
      }))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kunne ikke oppdatere rolloutstatus.")
    } finally {
      setSavingCountySlug(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Pilot</p>
          <p className="text-2xl font-semibold">{stats.pilot}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Queued</p>
          <p className="text-2xl font-semibold">{stats.queued}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">In progress</p>
          <p className="text-2xl font-semibold">{stats.inProgress}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">Ready</p>
          <p className="text-2xl font-semibold">{stats.ready}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All counties rollout board</CardTitle>
          <CardDescription>
            Operasjonell status per fylke med prioritet, dekningsrisiko og siste importpåvirkning.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fylke</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Dekning</TableHead>
                <TableHead>Risiko</TableHead>
                <TableHead>Siste import</TableHead>
                <TableHead>Notater</TableHead>
                <TableHead className="text-right">Lenker</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((status) => {
                const draft = drafts[status.countySlug] ?? {
                  stage: status.stage,
                  priority: String(status.priority),
                  notes: status.notes ?? "",
                }
                const stageLocked = status.isPilotCounty || status.isBrowseReady

                return (
                  <TableRow key={status.countySlug}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{status.county}</p>
                        <div className="flex flex-wrap gap-2">
                          {status.isPilotCounty ? <Badge variant="secondary">pilot</Badge> : null}
                          {status.isBrowseReady ? <Badge variant="outline">browse-ready</Badge> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <Select
                        value={draft.stage}
                        onValueChange={(value) =>
                          setDrafts((current) => ({
                            ...current,
                            [status.countySlug]: {
                              ...draft,
                              stage: value as CountyRolloutStage,
                            },
                          }))
                        }
                        disabled={stageLocked}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Velg stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pilot">Pilot</SelectItem>
                          <SelectItem value="queued">Queued</SelectItem>
                          <SelectItem value="in_progress">In progress</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                        </SelectContent>
                      </Select>
                      {stageLocked ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {status.isPilotCounty
                            ? "Pilotfylker styres automatisk."
                            : "Ready settes automatisk nar alle fire klynger er pa plass."}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="min-w-[110px]">
                      <Input
                        type="number"
                        value={draft.priority}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [status.countySlug]: {
                              ...draft,
                              priority: event.target.value,
                            },
                          }))
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <p className="text-sm">
                          {status.approvedActorCount} aktorer i {status.municipalityCount} kommuner/byer
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {status.coverageClusters.map((cluster) => (
                            <Badge key={`${status.countySlug}-${cluster.key}`} variant={cluster.isReady ? "outline" : "secondary"}>
                              {cluster.key}: {cluster.actorCount}
                            </Badge>
                          ))}
                        </div>
                        {status.missingClusterKeys.length > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Mangler: {status.missingClusterKeys.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{status.staleCount} stale</Badge>
                        <Badge variant={status.blockedCount > 0 ? "destructive" : "outline"}>
                          {status.blockedCount} blocked
                        </Badge>
                        <Badge variant="outline">{status.missingSourceCount} uten kilder</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {status.lastImportBatch ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{status.lastImportBatch.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {status.lastImportBatch.appliedAt
                              ? new Date(status.lastImportBatch.appliedAt).toLocaleDateString("no-NO")
                              : "Ikke brukt"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Ingen applied batch ennå</p>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[240px]">
                      <Input
                        value={draft.notes}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [status.countySlug]: {
                              ...draft,
                              notes: event.target.value,
                            },
                          }))
                        }
                        placeholder="Operasjonelle notater"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => saveRow(status.countySlug)}
                          disabled={savingCountySlug === status.countySlug}
                        >
                          {savingCountySlug === status.countySlug ? "Lagrer..." : "Lagre"}
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/admin/imports">Imports</Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/${status.countySlug}`} target="_blank">
                            Offentlig side
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
