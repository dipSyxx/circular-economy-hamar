"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth/client"
import { ActorSubmissionDialog } from "@/components/actor-submission-dialog"
import { ActorSubmissionForm, type ActorDraft, type RepairServiceDraft, type SourceDraft } from "@/components/actor-submission-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { actorCopy } from "@/content/no"

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

type MyActor = {
  id: string
  name: string
  slug: string
  category: string
  status: ActorStatus
  description: string
  longDescription: string
  address: string
  postalCode: string | null
  country: string
  county: string
  countySlug: string
  municipality: string
  municipalitySlug: string
  city: string
  area: string | null
  nationwide: boolean
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
  reviewNote: string | null
  createdAt: string
  updatedAt: string
  repairServices: ActorRepairService[]
  sources: ActorSource[]
}

const categoryLabels = actorCopy.categoryLabels as Record<string, string>

const statusLabels: Record<ActorStatus, string> = {
  pending: "Venter på godkjenning",
  approved: "Godkjent",
  rejected: "Avvist",
  archived: "Arkivert",
}

const formatDateInput = (value: string | null) => {
  if (!value) return ""
  return value.slice(0, 10)
}

const toDrafts = (actor: MyActor) => {
  const actorDraft: ActorDraft = {
    name: actor.name ?? "",
    slug: actor.slug ?? "",
    category: actor.category ?? "brukt",
    description: actor.description ?? "",
    longDescription: actor.longDescription ?? "",
    address: actor.address ?? "",
    postalCode: actor.postalCode ?? "",
    county: actor.county ?? "",
    municipality: actor.municipality ?? "",
    city: actor.city ?? "",
    area: actor.area ?? "",
    lat: Number.isFinite(actor.lat) ? String(actor.lat) : "",
    lng: Number.isFinite(actor.lng) ? String(actor.lng) : "",
    phone: actor.phone ?? "",
    email: actor.email ?? "",
    website: actor.website ?? "",
    instagram: actor.instagram ?? "",
    openingHours: actor.openingHours ?? [],
    openingHoursOsm: actor.openingHoursOsm ?? "",
    tags: actor.tags ?? [],
    benefits: actor.benefits ?? [],
    howToUse: actor.howToUse ?? [],
    image: actor.image ?? "",
    nationwide: actor.nationwide ?? false,
  }

  const repairServices: RepairServiceDraft[] = actor.repairServices?.length
    ? actor.repairServices.map((service) => ({
        problemType: service.problemType ?? "screen",
        itemTypes: service.itemTypes?.length ? service.itemTypes : ["phone"],
        priceMin: String(service.priceMin ?? ""),
        priceMax: String(service.priceMax ?? ""),
        etaDays: service.etaDays === null || service.etaDays === undefined ? "" : String(service.etaDays),
      }))
    : [{ problemType: "", itemTypes: [], priceMin: "", priceMax: "", etaDays: "" }]

  const sources: SourceDraft[] = actor.sources?.length
    ? actor.sources.map((source) => ({
        type: source.type ?? "website",
        title: source.title ?? "",
        url: source.url ?? "",
        capturedAt: formatDateInput(source.capturedAt),
        note: source.note ?? "",
      }))
    : [
        {
          type: "website",
          title: "",
          url: "",
          capturedAt: "",
          note: "",
        },
      ]

  return { actor: actorDraft, repairServices, sources }
}

export function MyActorsPanel() {
  const { data } = authClient.useSession()
  const isSignedIn = Boolean(data?.session)
  const [actors, setActors] = useState<MyActor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedActor, setSelectedActor] = useState<MyActor | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const formatter = useMemo(
    () => new Intl.DateTimeFormat("no-NO", { dateStyle: "medium" }),
    [],
  )

  const loadActors = async () => {
    if (!isSignedIn) {
      setActors([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/public/my-actors", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("Kunne ikke hente aktører.")
      }
      const data = (await response.json()) as MyActor[]
      setActors(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadActors()
  }, [isSignedIn])

  const handleDelete = async (actor: MyActor) => {
    const confirmed = window.confirm(`Slette ${actor.name}?`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/public/actor-submissions/${actor.id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error("Sletting feilet.")
      }
      await loadActors()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil")
    }
  }

  const openEditDialog = (actor: MyActor) => {
    setSelectedActor(actor)
    setEditOpen(true)
  }

  const closeEditDialog = () => {
    setEditOpen(false)
    setSelectedActor(null)
  }

  return (
    <Card>
      <CardHeader className="gap-3 p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Mine aktører</CardTitle>
            <CardDescription>Administrer dine innsendte aktører.</CardDescription>
          </div>
          <ActorSubmissionDialog
            triggerClassName="w-full sm:w-auto"
            onSuccess={async () => {
              await loadActors()
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        {!isSignedIn ? (
          <p className="text-sm text-muted-foreground">
            <Link href="/auth/sign-in" className="text-primary hover:underline">
              Logg inn
            </Link>{" "}
            for å administrere dine aktører.
          </p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Laster...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : actors.length === 0 ? (
          <p className="text-sm text-muted-foreground">Du har ikke sendt inn noen aktører ennå.</p>
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {actors.map((actor) => (
                <div key={actor.id} className="rounded-xl border p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{actor.name}</p>
                      <p className="truncate text-xs text-muted-foreground">/{actor.slug}</p>
                    </div>
                    <Badge className="shrink-0" variant={actor.status === "approved" ? "default" : "secondary"}>
                      {statusLabels[actor.status]}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">{categoryLabels[actor.category] ?? actor.category}</Badge>
                    <Badge variant="outline">{formatter.format(new Date(actor.updatedAt))}</Badge>
                  </div>

                  {actor.reviewNote ? <p className="mt-3 text-xs text-amber-600">{actor.reviewNote}</p> : null}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {actor.status === "approved" && (
                      <Button asChild size="sm" variant="ghost" className="w-full sm:w-auto">
                        <Link href={`/aktorer/${actor.slug}`}>Vis</Link>
                      </Button>
                    )}
                    <Button className="w-full sm:w-auto" size="sm" variant="outline" onClick={() => openEditDialog(actor)}>
                      Rediger
                    </Button>
                    <Button className="w-full sm:w-auto" size="sm" variant="destructive" onClick={() => handleDelete(actor)}>
                      Slett
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aktør</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Oppdatert</TableHead>
                    <TableHead className="text-right">Handling</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actors.map((actor) => (
                    <TableRow key={actor.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{actor.name}</span>
                          <span className="text-xs text-muted-foreground">/{actor.slug}</span>
                          {actor.reviewNote && <span className="mt-1 text-xs text-amber-600">{actor.reviewNote}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={actor.status === "approved" ? "default" : "secondary"}>
                          {statusLabels[actor.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{categoryLabels[actor.category] ?? actor.category}</Badge>
                      </TableCell>
                      <TableCell>{formatter.format(new Date(actor.updatedAt))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {actor.status === "approved" && (
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/aktorer/${actor.slug}`}>Vis</Link>
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(actor)}>
                            Rediger
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(actor)}>
                            Slett
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={(open) => (open ? setEditOpen(true) : closeEditDialog())}>
        <DialogContent className="h-dvh max-h-dvh w-screen max-w-none gap-0 rounded-none border-0 px-0 py-0 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[98vw] sm:max-w-7xl sm:rounded-2xl sm:border sm:px-0 sm:py-0 [&>[data-slot=dialog-header]+:not([data-slot=dialog-footer]):not([data-slot=dialog-close])]:overflow-visible [&>[data-slot=dialog-header]+:not([data-slot=dialog-footer]):not([data-slot=dialog-close])]:p-0 [&>[data-slot=dialog-header]+:not([data-slot=dialog-footer]):not([data-slot=dialog-close])]:pr-0">
          <DialogHeader className="border-b bg-background/95 px-4 pb-3 pt-[calc(1rem+env(safe-area-inset-top,0px))] text-left backdrop-blur sm:px-6 sm:pb-4 sm:pt-6">
            <DialogTitle>Rediger aktør</DialogTitle>
            <DialogDescription>Oppdater detaljer og send inn på nytt.</DialogDescription>
          </DialogHeader>
          {selectedActor && (
            <ActorSubmissionForm
              key={selectedActor.id}
              variant="dialog"
              mode="edit"
              actorId={selectedActor.id}
              initialActor={toDrafts(selectedActor).actor}
              initialRepairServices={toDrafts(selectedActor).repairServices}
              initialSources={toDrafts(selectedActor).sources}
              submitLabel="Oppdater aktør"
              onSuccess={async () => {
                await loadActors()
                closeEditDialog()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
