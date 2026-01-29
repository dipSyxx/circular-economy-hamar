"use client"

import { useEffect, useMemo, useState } from "react"
import { actorCopy } from "@/content/no"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ActorStatus = "pending" | "approved" | "rejected" | "archived"

type ActorRepairService = {
  id: string
  problemType: string
  itemTypes: string[]
  priceMin: number
  priceMax: number
  etaDays: number | null
}

type ActorSource = {
  id: string
  type: string
  title: string
  url: string
  capturedAt: string | null
  note: string | null
}

type PendingActor = {
  id: string
  name: string
  slug: string
  category: string
  description: string
  longDescription: string
  address: string
  lat: number
  lng: number
  phone: string | null
  email: string | null
  website: string | null
  instagram: string | null
  openingHours: string[]
  openingHoursOsm: string | null
  tags: string[]
  benefits: string[]
  howToUse: string[]
  image: string | null
  status: ActorStatus
  reviewNote: string | null
  createdAt: string
  updatedAt: string
  createdBy: {
    name?: string | null
    email?: string | null
  } | null
  repairServices: ActorRepairService[]
  sources: ActorSource[]
}

type PendingActorsPanelProps = {
  initialActors: PendingActor[]
  reviewerId: string
}

const statusLabels: Record<ActorStatus, string> = {
  pending: "Venter på godkjenning",
  approved: "Godkjent",
  rejected: "Avvist",
  archived: "Arkivert",
}

const formatDate = (value: string | null, formatter: Intl.DateTimeFormat) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "-"
  return formatter.format(parsed)
}

const formatOwner = (actor: PendingActor) => {
  if (!actor.createdBy) return "Ukjent bruker"
  return actor.createdBy.name || actor.createdBy.email || "Ukjent bruker"
}

const formatEnumLabel = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())

const categoryLabels = actorCopy.categoryLabels as Record<string, string>
const formatCategory = (value: string) => categoryLabels[value] ?? formatEnumLabel(value)

const formatCoord = (value: number) => (Number.isFinite(value) ? value.toFixed(6) : "-")

const renderBadges = (values: string[]) => {
  if (!values.length) {
    return <p className="text-sm text-muted-foreground">-</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value, index) => (
        <Badge key={`${value}-${index}`} variant="secondary">
          {value}
        </Badge>
      ))}
    </div>
  )
}

const renderList = (values: string[]) => {
  if (!values.length) {
    return <p className="text-sm text-muted-foreground">-</p>
  }
  return (
    <ul className="space-y-1 text-sm">
      {values.map((value, index) => (
        <li key={`${value}-${index}`}>{value}</li>
      ))}
    </ul>
  )
}

export function PendingActorsPanel({ initialActors, reviewerId }: PendingActorsPanelProps) {
  const [items, setItems] = useState<PendingActor[]>(initialActors)
  const [error, setError] = useState<string | null>(null)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [selectedActor, setSelectedActor] = useState<PendingActor | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [imagePreviewError, setImagePreviewError] = useState(false)

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

  const openDetails = (actor: PendingActor) => {
    setSelectedActor(actor)
    setDialogOpen(true)
  }

  const closeDetails = () => {
    setDialogOpen(false)
    setSelectedActor(null)
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
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil")
      return false
    } finally {
      setLoading(id, false)
    }
  }

  const handleDecisionFromDialog = async (status: "approved" | "rejected") => {
    if (!selectedActor) return
    const ok = await handleDecision(selectedActor.id, status)
    if (ok) {
      closeDetails()
    }
  }

  const dialogLoading = selectedActor ? loadingIds.has(selectedActor.id) : false

  useEffect(() => {
    setImagePreviewError(false)
  }, [selectedActor?.image])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventende aktører</CardTitle>
        <CardDescription>Se detaljer og godkjenn eller avvis aktører som venter på gjennomgang.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen aktører venter på gjennomgang.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aktør</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Opprettet av</TableHead>
                <TableHead>Dato</TableHead>
                <TableHead className="text-right">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((actor) => (
                <TableRow key={actor.id}>
                  <TableCell className="font-medium">{actor.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{formatCategory(actor.category)}</Badge>
                  </TableCell>
                  <TableCell>{formatOwner(actor)}</TableCell>
                  <TableCell>{formatDate(actor.createdAt, formatter)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openDetails(actor)}>
                      Se detaljer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDetails())}>
        <DialogContent className="max-w-6xl w-[95vw] sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>{selectedActor?.name ?? "Detaljer"}</DialogTitle>
            <DialogDescription>
              Gjennomgå alle opplysninger før du godkjenner eller avviser aktøren.
            </DialogDescription>
          </DialogHeader>
          {selectedActor && (
            <div className="grid max-h-[70vh] gap-6 overflow-y-auto pr-2">
              <section className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{statusLabels[selectedActor.status]}</Badge>
                  <Badge variant="secondary">{formatCategory(selectedActor.category)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Opprettet av {formatOwner(selectedActor)} - {formatDate(selectedActor.createdAt, formatter)}
                </p>
                {selectedActor.reviewNote && (
                  <p className="text-sm text-amber-600">{selectedActor.reviewNote}</p>
                )}
              </section>

              <section>
                <h3 className="text-sm font-semibold">Grunninfo</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Navn</p>
                    <p className="text-sm font-medium">{selectedActor.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Slug</p>
                    <p className="text-sm font-medium">/{selectedActor.slug}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Kategori</p>
                    <Badge variant="outline">{formatCategory(selectedActor.category)}</Badge>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground">Kort beskrivelse</p>
                    <p className="text-sm">{selectedActor.description}</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground">Lang beskrivelse</p>
                    <p className="text-sm">{selectedActor.longDescription}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold">Kontakt og plassering</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="text-sm">{selectedActor.address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Breddegrad</p>
                    <p className="text-sm">{formatCoord(selectedActor.lat)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lengdegrad</p>
                    <p className="text-sm">{formatCoord(selectedActor.lng)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefon</p>
                    <p className="text-sm">{selectedActor.phone ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">E-post</p>
                    <p className="text-sm">{selectedActor.email ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nettside</p>
                    {selectedActor.website ? (
                      <a
                        className="text-sm text-primary hover:underline"
                        href={selectedActor.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selectedActor.website}
                      </a>
                    ) : (
                      <p className="text-sm">-</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Instagram</p>
                    {selectedActor.instagram ? (
                      <a
                        className="text-sm text-primary hover:underline"
                        href={selectedActor.instagram}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selectedActor.instagram}
                      </a>
                    ) : (
                      <p className="text-sm">-</p>
                    )}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground">Åpningstider</p>
                    {renderList(selectedActor.openingHours)}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground">OSM-format</p>
                    <p className="text-sm">{selectedActor.openingHoursOsm ?? "-"}</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold">Innhold og detaljer</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground">Tags</p>
                    {renderBadges(selectedActor.tags)}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground">Fordeler</p>
                    {renderList(selectedActor.benefits)}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground">Hvordan bruke</p>
                    {renderList(selectedActor.howToUse)}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground">Bilde</p>
                  {selectedActor.image ? (
                    <div className="mt-2 inline-flex max-w-full overflow-hidden rounded-lg border bg-muted/20">
                      <img
                        src={imagePreviewError ? "/placeholder.svg" : selectedActor.image}
                        alt={selectedActor.name}
                        className="h-auto w-auto max-h-80 max-w-full object-contain"
                        onError={() => setImagePreviewError(true)}
                      />
                    </div>
                  ) : (
                    <p className="text-sm">-</p>
                  )}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold">Reparasjonstjenester</h3>
                <div className="mt-3 grid gap-3">
                  {selectedActor.repairServices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ingen reparasjonstjenester.</p>
                  ) : (
                    selectedActor.repairServices.map((service) => (
                      <div key={service.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">{formatEnumLabel(service.problemType)}</p>
                          <Badge variant="outline">
                            {service.priceMin}–{service.priceMax} kr
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Varetyper: {service.itemTypes.map(formatEnumLabel).join(", ")}
                        </div>
                        {service.etaDays !== null && (
                          <div className="text-xs text-muted-foreground">Estimert tid: {service.etaDays} dager</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold">Kilder</h3>
                <div className="mt-3 grid gap-3">
                  {selectedActor.sources.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ingen kilder.</p>
                  ) : (
                    selectedActor.sources.map((source) => (
                      <div key={source.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium">{source.title}</p>
                          <Badge variant="secondary">{formatEnumLabel(source.type)}</Badge>
                        </div>
                        <a className="text-sm text-primary hover:underline" href={source.url} target="_blank" rel="noreferrer">
                          {source.url}
                        </a>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(source.capturedAt, formatter)}
                          {source.note ? ` - ${source.note}` : ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={closeDetails}>
              Lukk
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDecisionFromDialog("rejected")}
              disabled={!selectedActor || dialogLoading}
            >
              Avvis
            </Button>
            <Button onClick={() => handleDecisionFromDialog("approved")} disabled={!selectedActor || dialogLoading}>
              Godkjenn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
