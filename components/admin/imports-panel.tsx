"use client"

import Link from "next/link"
import { useState } from "react"
import { Download, FileUp, RefreshCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { actorImportTemplates } from "@/lib/import-templates"
import type { ActorImportBatchSummary, ActorImportRowSummary, CountyRolloutWorkflow } from "@/lib/data"

type ImportDetails = {
  batch: ActorImportBatchSummary
  rows: ActorImportRowSummary[]
}

type ImportsPanelProps = {
  initialBatches: ActorImportBatchSummary[]
  countyWorkflow?: CountyRolloutWorkflow | null
}

const rowTypeLabels: Record<ActorImportRowSummary["rowType"], string> = {
  actor: "aktor",
  actor_source: "kilde",
  actor_repair_service: "reparasjon",
}

export function ImportsPanel({ initialBatches, countyWorkflow }: ImportsPanelProps) {
  const [batches, setBatches] = useState(initialBatches)
  const [selectedBatch, setSelectedBatch] = useState<ImportDetails | null>(null)
  const [actorsFile, setActorsFile] = useState<File | null>(null)
  const [sourcesFile, setSourcesFile] = useState<File | null>(null)
  const [repairFile, setRepairFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const visibleBatches = countyWorkflow
    ? batches.filter((batch) => batch.targetCounties.includes(countyWorkflow.status.countySlug))
    : batches

  const downloadTemplate = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const updateBatchHistory = (nextBatch: ActorImportBatchSummary) => {
    setBatches((current) => {
      const filtered = current.filter((entry) => entry.id !== nextBatch.id)
      return [nextBatch, ...filtered]
    })
  }

  const loadBatch = async (batchId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/imports/${batchId}`)
      const payload = (await response.json()) as { error?: string } & Partial<ImportDetails>
      if (!response.ok || !payload.batch || !payload.rows) {
        throw new Error(payload.error ?? "Kunne ikke laste importdetaljer.")
      }

      setSelectedBatch({ batch: payload.batch, rows: payload.rows })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Kunne ikke laste importdetaljer.")
    } finally {
      setLoading(false)
    }
  }

  const previewImport = async () => {
    if (!actorsFile) {
      setError("actors.csv er pakrevd.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [actorsCsv, actorSourcesCsv, actorRepairServicesCsv] = await Promise.all([
        actorsFile.text(),
        sourcesFile ? sourcesFile.text() : Promise.resolve(undefined),
        repairFile ? repairFile.text() : Promise.resolve(undefined),
      ])

      const response = await fetch("/api/admin/imports/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: actorsFile.name,
          actorsCsv,
          actorSourcesCsv,
          actorRepairServicesCsv,
        }),
      })

      const payload = (await response.json()) as { error?: string } & Partial<ImportDetails>
      if (!response.ok || !payload.batch || !payload.rows) {
        throw new Error(payload.error ?? "Kunne ikke generere forhandsvisning.")
      }

      setSelectedBatch({ batch: payload.batch, rows: payload.rows })
      updateBatchHistory(payload.batch)
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Kunne ikke generere forhandsvisning.")
    } finally {
      setLoading(false)
    }
  }

  const applySelectedBatch = async () => {
    if (!selectedBatch) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/imports/${selectedBatch.batch.id}/apply`, {
        method: "POST",
      })

      const payload = (await response.json()) as { error?: string } & Partial<ImportDetails>
      if (!response.ok || !payload.batch || !payload.rows) {
        throw new Error(payload.error ?? "Kunne ikke bruke import batch.")
      }

      setSelectedBatch({ batch: payload.batch, rows: payload.rows })
      updateBatchHistory(payload.batch)
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : "Kunne ikke bruke import batch.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {countyWorkflow ? (
        <Card>
          <CardHeader>
            <CardTitle>{countyWorkflow.status.county}: guided bootstrap workflow</CardTitle>
            <CardDescription>
              Bruk county-spesifikke importer for a fylle targetene, lukke manglende klynger og bygge ut katalogen trinnvis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Coverage target</p>
                <p className="text-sm font-medium">
                  {countyWorkflow.status.target.approvedActors} aktorer / {countyWorkflow.status.target.municipalities} kommuner
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-sm font-medium">{countyWorkflow.status.targetProgressLabel}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Missing clusters</p>
                <p className="text-sm font-medium">
                  {countyWorkflow.status.missingClusterKeys.length > 0
                    ? countyWorkflow.status.missingClusterKeys.join(", ")
                    : "Ingen"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Recommended directory</p>
                <p className="font-mono text-sm">{countyWorkflow.recommendedDirectory}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start lokalt med <code>pnpm run init:county-import -- --county={countyWorkflow.status.countySlug}</code>
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Uncovered municipalities</p>
                <p className="text-sm font-medium">
                  {countyWorkflow.uncoveredMunicipalities.length > 0
                    ? countyWorkflow.uncoveredMunicipalities.slice(0, 8).map((entry) => entry.name).join(", ")
                    : "Alle kjente kommuner i taxonomy har minst ett treff."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/admin/rollout-workflow/${countyWorkflow.status.countySlug}`}>Til county workflow</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/${countyWorkflow.status.countySlug}`} target="_blank">
                  Apen offentlig fylkesside
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>CSV-import</CardTitle>
          <CardDescription>
            Last opp actors.csv som hovedfil. actor_sources.csv og actor_repair_services.csv er valgfrie vedlegg.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => downloadTemplate("actors.csv", actorImportTemplates.actors)}>
              <Download className="mr-2 h-4 w-4" />
              actors.csv mal
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadTemplate("actor_sources.csv", actorImportTemplates.actor_sources)}
            >
              <Download className="mr-2 h-4 w-4" />
              actor_sources.csv mal
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                downloadTemplate("actor_repair_services.csv", actorImportTemplates.actor_repair_services)
              }
            >
              <Download className="mr-2 h-4 w-4" />
              actor_repair_services.csv mal
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="actors-file">
                actors.csv
              </label>
              <Input id="actors-file" type="file" accept=".csv,text/csv" onChange={(event) => setActorsFile(event.target.files?.[0] ?? null)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="sources-file">
                actor_sources.csv
              </label>
              <Input id="sources-file" type="file" accept=".csv,text/csv" onChange={(event) => setSourcesFile(event.target.files?.[0] ?? null)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="repair-file">
                actor_repair_services.csv
              </label>
              <Input id="repair-file" type="file" accept=".csv,text/csv" onChange={(event) => setRepairFile(event.target.files?.[0] ?? null)} />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-wrap gap-3">
            <Button onClick={previewImport} disabled={loading}>
              <FileUp className="mr-2 h-4 w-4" />
              Forhandsvis batch
            </Button>
            {selectedBatch ? (
              <Button
                variant="outline"
                onClick={applySelectedBatch}
                disabled={loading || selectedBatch.batch.errorCount > 0 || selectedBatch.batch.status === "applied"}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Bruk batch
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {selectedBatch ? (
        <Card>
          <CardHeader>
            <CardTitle>Aktiv batch: {selectedBatch.batch.filename}</CardTitle>
            <CardDescription>
              Status: {selectedBatch.batch.status}. Gjennomga radene under før du bruker batchen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-6">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Rader</p>
                <p className="text-2xl font-semibold">{selectedBatch.batch.totalRows}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Create</p>
                <p className="text-2xl font-semibold">{selectedBatch.batch.createCount}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Update</p>
                <p className="text-2xl font-semibold">{selectedBatch.batch.updateCount}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Skip</p>
                <p className="text-2xl font-semibold">{selectedBatch.batch.skipCount}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Feil</p>
                <p className="text-2xl font-semibold">{selectedBatch.batch.errorCount}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Advarsler</p>
                <p className="text-2xl font-semibold">{selectedBatch.batch.warningCount}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Berorte fylker:</span>
              {selectedBatch.batch.targetCounties.length > 0 ? (
                selectedBatch.batch.targetCounties.map((countySlug) => (
                  <Badge key={countySlug} variant="outline">
                    {countySlug}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary">Ingen spesifiserte fylker</Badge>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Rad</TableHead>
                  <TableHead>Handling</TableHead>
                  <TableHead>Match</TableHead>
                  <TableHead>Validering</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedBatch.rows.slice(0, 60).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Badge variant="secondary">{rowTypeLabels[row.rowType]}</Badge>
                    </TableCell>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell>
                      <Badge variant={row.action === "error" ? "destructive" : row.action === "skip" ? "outline" : "default"}>
                        {row.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.matchStrategy ?? "-"}</TableCell>
                    <TableCell className="space-y-1">
                      {row.validationErrors.length > 0 ? (
                        <p className="text-xs text-destructive">{row.validationErrors.join(" ")}</p>
                      ) : null}
                      {row.warnings.length > 0 ? (
                        <p className="text-xs text-amber-700">{row.warnings.join(" ")}</p>
                      ) : null}
                      {row.validationErrors.length === 0 && row.warnings.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Ingen merknader</p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {selectedBatch.rows.length > 60 ? (
              <p className="text-xs text-muted-foreground">
                Viser de 60 forste radene. Hele batchen er lagret og kan hentes igjen fra historikken.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Importhistorikk</CardTitle>
          <CardDescription>Siste batcher og deres status.</CardDescription>
        </CardHeader>
        <CardContent>
          {visibleBatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen batcher ennå.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filnavn</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Opprettet</TableHead>
                  <TableHead>Target fylker</TableHead>
                  <TableHead className="text-right">Detaljer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.filename}</TableCell>
                    <TableCell>
                      <Badge variant={batch.status === "applied" ? "default" : "secondary"}>{batch.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(batch.createdAt).toLocaleDateString("no-NO")}</TableCell>
                    <TableCell>{batch.targetCounties.join(", ") || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => loadBatch(batch.id)} disabled={loading}>
                        Vis
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {countyWorkflow && visibleBatches.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Ingen batcher for {countyWorkflow.status.county} ennÃ¥. Start med county-spesifikk bootstrap over.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
