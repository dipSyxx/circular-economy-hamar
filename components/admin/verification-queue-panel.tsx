"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { AdminVerificationTask, VerificationDueState, VerificationTaskStatus } from "@/lib/data"

type VerificationQueuePanelProps = {
  initialTasks: AdminVerificationTask[]
}

const dueStateLabel = (state: VerificationDueState) => {
  if (state === "healthy") return "Frisk"
  if (state === "due_soon") return "Snart forfall"
  if (state === "due") return "Bor reverifiseres"
  if (state === "overdue") return "Over forfall"
  return "Blokkert"
}

const statusLabel = (status: VerificationTaskStatus) => {
  if (status === "open") return "Apen"
  if (status === "snoozed") return "Snoozed"
  return "Resolved"
}

export function VerificationQueuePanel({ initialTasks }: VerificationQueuePanelProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [dueStateFilter, setDueStateFilter] = useState<VerificationDueState | "all">("all")
  const [statusFilter, setStatusFilter] = useState<VerificationTaskStatus | "all">("open")
  const [countyFilter, setCountyFilter] = useState<string>("all")
  const [pilotFilter, setPilotFilter] = useState<"all" | "pilot" | "non-pilot">("all")
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionTaskId, setActionTaskId] = useState<string | null>(null)
  const [dialogMode, setDialogMode] = useState<"snooze" | "resolve" | null>(null)
  const [selectedTask, setSelectedTask] = useState<AdminVerificationTask | null>(null)
  const [snoozeUntil, setSnoozeUntil] = useState("")
  const [note, setNote] = useState("")

  const countyOptions = useMemo(
    () =>
      Array.from(
        new Map(
          tasks
            .map(
              (task) =>
                [task.actor.countySlug || "", task.actor.county || task.actor.countySlug || "Ukjent"] as const,
            )
            .filter((entry): entry is readonly [string, string] => Boolean(entry[0])),
        ).entries(),
      ).sort((left, right) => left[1].localeCompare(right[1], "no", { sensitivity: "base" })),
    [tasks],
  )

  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (dueStateFilter !== "all" && task.dueState !== dueStateFilter) return false
        if (statusFilter !== "all" && task.status !== statusFilter) return false
        if (countyFilter !== "all" && task.actor.countySlug !== countyFilter) return false
        if (pilotFilter === "pilot" && !task.actor.isPilotCounty) return false
        if (pilotFilter === "non-pilot" && task.actor.isPilotCounty) return false
        return true
      }),
    [tasks, dueStateFilter, statusFilter, countyFilter, pilotFilter],
  )

  const stats = useMemo(
    () => ({
      open: tasks.filter((task) => task.status === "open").length,
      snoozed: tasks.filter((task) => task.status === "snoozed").length,
      blocked: tasks.filter((task) => task.status !== "resolved" && task.dueState === "blocked").length,
      overdue: tasks.filter((task) => task.status !== "resolved" && task.dueState === "overdue").length,
    }),
    [tasks],
  )

  const closeDialog = () => {
    setDialogMode(null)
    setSelectedTask(null)
    setSnoozeUntil("")
    setNote("")
  }

  const reloadTasks = async () => {
    const response = await fetch("/api/admin/verification-tasks")
    const payload = (await response.json().catch(() => null)) as { tasks?: AdminVerificationTask[]; error?: string } | null
    if (!response.ok || !payload?.tasks) {
      throw new Error(payload?.error || "Kunne ikke laste verification queue.")
    }
    setTasks(payload.tasks)
  }

  const handleReverify = async (task: AdminVerificationTask) => {
    setActionError(null)
    setActionTaskId(task.id)

    try {
      const response = await fetch(`/api/admin/actors/${task.actorId}/reverify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewNote: "Reverifisert fra verification queue." }),
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        throw new Error(payload?.error || "Kunne ikke reverifisere aktøren.")
      }

      await reloadTasks()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Kunne ikke reverifisere aktøren.")
    } finally {
      setActionTaskId(null)
    }
  }

  const handleTaskAction = async () => {
    if (!selectedTask || !dialogMode) return

    setActionError(null)
    setActionTaskId(selectedTask.id)

    try {
      const response = await fetch(`/api/admin/verification-tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: dialogMode,
          snoozeUntil:
            dialogMode === "snooze" && snoozeUntil
              ? new Date(`${snoozeUntil}T12:00:00.000Z`).toISOString()
              : null,
          note,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { task?: AdminVerificationTask; error?: string }
        | null
      if (!response.ok || !payload?.task) {
        throw new Error(payload?.error || "Kunne ikke oppdatere verification task.")
      }

      await reloadTasks()
      closeDialog()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Kunne ikke oppdatere verification task.")
    } finally {
      setActionTaskId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Verification Queue</CardTitle>
            <CardDescription>
              Admin-first taskkø for reverifisering, snoozing og manuell opprydding av stale eller blokkerte aktører.
            </CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/rollout">Åpne rollout board</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Apen</p>
            <p className="text-2xl font-semibold">{stats.open}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Snoozed</p>
            <p className="text-2xl font-semibold">{stats.snoozed}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Blokkert</p>
            <p className="text-2xl font-semibold">{stats.blocked}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Over forfall</p>
            <p className="text-2xl font-semibold">{stats.overdue}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as VerificationTaskStatus | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              <SelectItem value="open">Apen</SelectItem>
              <SelectItem value="snoozed">Snoozed</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={countyFilter} onValueChange={setCountyFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Fylke" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle fylker</SelectItem>
              {countyOptions.map(([countySlug, county]) => (
                <SelectItem key={countySlug} value={countySlug}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pilotFilter} onValueChange={(value) => setPilotFilter(value as "all" | "pilot" | "non-pilot")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Omrade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle områder</SelectItem>
              <SelectItem value="pilot">Pilot</SelectItem>
              <SelectItem value="non-pilot">Ikke pilot</SelectItem>
            </SelectContent>
          </Select>
          {(["due_soon", "due", "overdue", "blocked"] as VerificationDueState[]).map((state) => (
            <Button
              key={state}
              variant={dueStateFilter === state ? "default" : "outline"}
              size="sm"
              onClick={() => setDueStateFilter((current) => (current === state ? "all" : state))}
            >
              {dueStateLabel(state)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {actionError ? <p className="mb-3 text-sm text-destructive">{actionError}</p> : null}
        {filteredTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen verification tasks matcher filtrene.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aktor</TableHead>
                <TableHead>Fylke</TableHead>
                <TableHead>Due state</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{task.actor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.actor.category} · {task.actor.city || task.actor.municipality || "-"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{task.actor.county || "-"}</p>
                      {task.actor.isPilotCounty ? <Badge variant="outline">pilot</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={task.dueState === "blocked" ? "destructive" : "secondary"}>
                      {dueStateLabel(task.dueState)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={task.status === "open" ? "default" : "outline"}>{statusLabel(task.status)}</Badge>
                      {task.snoozeUntil ? (
                        <p className="text-xs text-muted-foreground">
                          til {new Date(task.snoozeUntil).toLocaleDateString("no-NO")}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[360px] text-sm text-muted-foreground">
                    {task.reasonSummary}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReverify(task)}
                        disabled={actionTaskId === task.id}
                      >
                        {actionTaskId === task.id ? "Jobber..." : "Reverifiser"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task)
                          setDialogMode("snooze")
                          setNote(task.resolutionNote ?? "")
                          setSnoozeUntil("")
                        }}
                        disabled={actionTaskId === task.id}
                      >
                        Snooze
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task)
                          setDialogMode("resolve")
                          setNote(task.resolutionNote ?? "")
                        }}
                        disabled={actionTaskId === task.id}
                      >
                        Resolve
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "snooze" ? "Snooze verification task" : "Resolve verification task"}</DialogTitle>
            <DialogDescription>
              {selectedTask ? `Oppdater task for ${selectedTask.actor.name}.` : "Oppdater verification task."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {dialogMode === "snooze" ? (
              <div className="space-y-2">
                <Label htmlFor="snooze-until">Snooze til</Label>
                <Input
                  id="snooze-until"
                  type="date"
                  value={snoozeUntil}
                  onChange={(event) => setSnoozeUntil(event.target.value)}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="task-note">Notat</Label>
              <Textarea
                id="task-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="min-h-[120px]"
                placeholder="Valgfritt notat"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog}>
              Avbryt
            </Button>
            <Button onClick={handleTaskAction} disabled={actionTaskId === selectedTask?.id}>
              {actionTaskId === selectedTask?.id ? "Lagrer..." : "Lagre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
