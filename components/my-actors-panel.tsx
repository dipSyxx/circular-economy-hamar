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
  }

  const repairServices: RepairServiceDraft[] = actor.repairServices?.length
    ? actor.repairServices.map((service) => ({
        problemType: service.problemType ?? "screen",
        itemTypes: service.itemTypes?.length ? service.itemTypes : ["phone"],
        priceMin: String(service.priceMin ?? ""),
        priceMax: String(service.priceMax ?? ""),
        etaDays: service.etaDays === null || service.etaDays === undefined ? "" : String(service.etaDays),
      }))
    : [
        {
          problemType: "screen",
          itemTypes: ["phone"],
          priceMin: "",
          priceMax: "",
          etaDays: "",
        },
      ]

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
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Mine aktører</CardTitle>
            <CardDescription>Administrer dine innsendte aktører.</CardDescription>
          </div>
          <ActorSubmissionDialog
            onSuccess={async () => {
              await loadActors()
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
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
          <div className="overflow-x-auto">
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
                        {actor.reviewNote && (
                          <span className="text-xs text-amber-600 mt-1">
                            {actor.reviewNote}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={actor.status === "approved" ? "default" : "secondary"}>
                        {statusLabels[actor.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[actor.category] ?? actor.category}
                      </Badge>
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
        )}
      </CardContent>

      <Dialog open={editOpen} onOpenChange={(open) => (open ? setEditOpen(true) : closeEditDialog())}>
        <DialogContent className="max-w-7xl w-[98vw] sm:max-w-7xl">
          <DialogHeader>
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
