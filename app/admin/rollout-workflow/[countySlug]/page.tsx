import Link from "next/link"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { getCountyRolloutWorkflow } from "@/lib/admin/rollout-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function AdminCountyRolloutWorkflowPage({
  params,
}: {
  params: Promise<{ countySlug: string }>
}) {
  await requireAdmin()
  const { countySlug } = await params
  const workflow = await getCountyRolloutWorkflow(countySlug)

  if (!workflow) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{workflow.status.county}: county workflow</h1>
          <p className="text-muted-foreground">
            Guided bootstrap for county-by-county imports, coverage targets and rollout risk.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/rollout">Tilbake til rollout board</Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/imports?county=${workflow.status.countySlug}`}>Åpne county-import</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Stage" value={workflow.status.stage} />
        <StatCard label="Priority" value={String(workflow.status.priority)} />
        <StatCard
          label="Coverage target"
          value={`${workflow.status.target.approvedActors} aktører / ${workflow.status.target.municipalities} kommuner`}
        />
        <StatCard label="Progress" value={workflow.status.targetProgressLabel} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Operational checklist</CardTitle>
            <CardDescription>Bruk denne rekkefølgen når du bygger ut et nytt fylke.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Recommended directory</p>
              <p className="font-mono text-sm">{workflow.recommendedDirectory}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Scaffold lokalt med <code>pnpm run init:county-import -- --county={workflow.status.countySlug}</code>
              </p>
            </div>
            <ol className="space-y-3">
              {workflow.guideSteps.map((step, index) => (
                <li key={step.key} className="rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    {index + 1}. {step.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coverage gaps</CardTitle>
            <CardDescription>Bruk gap-listen til a styre neste fylkesbatch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Service clusters</p>
              <div className="flex flex-wrap gap-2">
                {workflow.status.coverageClusters.map((cluster) => (
                  <Badge key={cluster.key} variant={cluster.isReady ? "outline" : "secondary"}>
                    {cluster.key}: {cluster.actorCount}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Missing municipalities</p>
              {workflow.uncoveredMunicipalities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {workflow.uncoveredMunicipalities.slice(0, 16).map((municipality) => (
                    <Badge key={municipality.slug} variant="secondary">
                      {municipality.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Alle kommuner i den kanoniske taxonomy-listen har minst ett approved actor-treff.
                </p>
              )}
            </div>

            <div className="rounded-lg border p-3 text-sm text-muted-foreground">
              <p>
                Risks: {workflow.status.staleCount} stale, {workflow.status.blockedCount} blocked,{" "}
                {workflow.status.missingSourceCount} uten kilder.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent imports for {workflow.status.county}</CardTitle>
          <CardDescription>Viser de siste applied batchene som traff dette fylket.</CardDescription>
        </CardHeader>
        <CardContent>
          {workflow.importHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ingen applied importer enna.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Create / update</TableHead>
                  <TableHead>Warnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflow.importHistory.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.filename}</TableCell>
                    <TableCell>
                      {batch.appliedAt ? new Date(batch.appliedAt).toLocaleDateString("no-NO") : "-"}
                    </TableCell>
                    <TableCell>{batch.totalRows}</TableCell>
                    <TableCell>
                      {batch.createCount} / {batch.updateCount}
                    </TableCell>
                    <TableCell>{batch.warningCount}</TableCell>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}
