"use client"

import { useState, useEffect, useMemo, type JSX } from "react"
import { ExternalLink, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchableSelect } from "@/components/ui/searchable-select"
import type { ActorFormSection } from "@/lib/actor-form-sections"
import {
  getRepairServiceItemTypesForCategory,
  getRepairServiceProblemTypesForCategory,
} from "@/lib/category-repair-scope"
import { supportsRepairServices } from "@/lib/categories"
import type { AdminStagedRepair, AdminStagedSource } from "@/lib/admin/actor-create-staging"
import { ITEM_TYPES, PROBLEM_TYPES } from "@/lib/prisma-enums"
import { formatItemTypeLabel, formatProblemTypeLabel } from "@/lib/enum-labels"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActorSource = {
  id: string
  actorId: string
  type: string
  title: string
  url: string
  capturedAt: string | null
  note: string | null
}

type ActorRepairService = {
  id: string
  actorId: string
  problemType: string
  itemTypes: string[]
  priceMin: number
  priceMax: number
  etaDays: number | null
}

export type ActorDialogContentProps = {
  mode: "create" | "edit"
  actorId: string | null
  /** Current actor category from admin draft (filters repair service enums). */
  actorCategory?: string
  /** Staged kilder while creating a new actor (saved with first Lagre). */
  createStagedSources?: AdminStagedSource[]
  onCreateStagedSourcesChange?: (next: AdminStagedSource[]) => void
  /** Staged reparasjonstjenester while creating a new actor. */
  createStagedRepairs?: AdminStagedRepair[]
  onCreateStagedRepairsChange?: (next: AdminStagedRepair[]) => void
  actorFormSections: ActorFormSection[]
  actorExtraKeys: string[]
  formKeys: string[]
  renderField: (key: string) => JSX.Element
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOURCE_TYPES = ["website", "social", "google_reviews", "article", "map"] as const

const sourceTypeLabels: Record<string, string> = {
  website: "Nettside",
  social: "Sosiale medier",
  google_reviews: "Google-anmeldelser",
  article: "Artikkel",
  map: "Kart",
}

const formatSourceType = (type: string) => sourceTypeLabels[type] ?? type

const EMPTY_SOURCE = {
  type: "website" as string,
  title: "",
  url: "",
  capturedAt: "",
  note: "",
}

const EMPTY_REPAIR = {
  problemType: "" as string,
  itemTypes: [] as string[],
  priceMin: "",
  priceMax: "",
  etaDays: "",
}

// ---------------------------------------------------------------------------
// SourcesManager
// ---------------------------------------------------------------------------

type SourcesManagerProps =
  | { variant: "persisted"; actorId: string }
  | {
      variant: "staging"
      sources: AdminStagedSource[]
      onChange: (next: AdminStagedSource[]) => void
    }

function SourcesManager(props: SourcesManagerProps) {
  if (props.variant === "staging") {
    return <SourcesManagerStaging sources={props.sources} onChange={props.onChange} />
  }
  return <SourcesManagerPersisted actorId={props.actorId} />
}

function SourcesManagerStaging({
  sources,
  onChange,
}: {
  sources: AdminStagedSource[]
  onChange: (next: AdminStagedSource[]) => void
}) {
  const update = (index: number, patch: Partial<AdminStagedSource>) => {
    onChange(sources.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const removeAt = (index: number) => {
    onChange(sources.filter((_, i) => i !== index))
  }

  const addSource = () => {
    onChange([...sources, { type: "website", title: "", url: "", capturedAt: "", note: "" }])
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Label>Kilder og dokumentasjon</Label>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Legg ved minst én kilde som dokumenterer aktøren før innsending.
      </p>
      <div className="mt-2 grid gap-3 md:gap-4">
        {sources.map((source, index) => (
          <Card key={`staged-src-${index}`} className="rounded-xl border border-dashed">
            <CardContent className="grid gap-3 p-4 md:gap-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Kilde {index + 1}</p>
                {sources.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => removeAt(index)}>
                    Fjern
                  </Button>
                )}
              </div>

              <div>
                <Label>Type</Label>
                <Select value={source.type} onValueChange={(value) => update(index, { type: value })}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Velg type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {formatSourceType(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tittel</Label>
                <Input
                  className="mt-1"
                  value={source.title}
                  onChange={(e) => update(index, { title: e.target.value })}
                />
              </div>

              <div>
                <Label>URL</Label>
                <Input
                  type="url"
                  className="mt-1"
                  value={source.url}
                  onChange={(e) => update(index, { url: e.target.value })}
                  placeholder="https://"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Dato (valgfritt)</Label>
                  <Input
                    type="date"
                    className="mt-1"
                    value={source.capturedAt}
                    onChange={(e) => update(index, { capturedAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Notat</Label>
                  <Input
                    className="mt-1"
                    value={source.note}
                    onChange={(e) => update(index, { note: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button type="button" variant="outline" className="mt-3 w-full sm:w-auto" onClick={addSource}>
        Legg til kilde
      </Button>
    </div>
  )
}

function SourcesManagerPersisted({ actorId }: { actorId: string }) {
  const [sources, setSources] = useState<ActorSource[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState(EMPTY_SOURCE)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/actor-sources")
      if (!res.ok) throw new Error("Kunne ikke laste kilder")
      const all = (await res.json()) as ActorSource[]
      setSources(all.filter((s) => s.actorId === actorId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorId])

  const handleAdd = async () => {
    if (!draft.title.trim() || !draft.url.trim()) {
      setError("Tittel og URL er påkrevd.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/actor-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId,
          type: draft.type,
          title: draft.title.trim(),
          url: draft.url.trim(),
          capturedAt: draft.capturedAt || null,
          note: draft.note.trim() || null,
        }),
      })
      if (!res.ok) throw new Error("Lagring feilet")
      setDraft(EMPTY_SOURCE)
      setAdding(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Slette denne kilden?")) return
    try {
      await fetch(`/api/admin/actor-sources/${id}`, { method: "DELETE" })
      await load()
    } catch {
      setError("Sletting feilet")
    }
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Laster kilder...</p>
      ) : sources.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ingen kilder registrert for denne aktøren ennå.</p>
      ) : (
        <div className="rounded-md border divide-y">
          {sources.map((source) => (
            <div key={source.id} className="flex items-start gap-3 px-4 py-3">
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{source.title}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {formatSourceType(source.type)}
                  </Badge>
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-full"
                >
                  {source.url}
                  <ExternalLink className="size-3 shrink-0" />
                </a>
                {source.note && (
                  <p className="text-xs text-muted-foreground">{source.note}</p>
                )}
                {source.capturedAt && (
                  <p className="text-xs text-muted-foreground">
                    Hentet: {new Date(source.capturedAt).toLocaleDateString("no-NO")}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(source.id)}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Slett kilde</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="rounded-md border p-4 space-y-4 bg-muted/20">
          <p className="text-sm font-medium">Ny kilde</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={draft.type}
                onValueChange={(v) => setDraft((prev) => ({ ...prev, type: v }))}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatSourceType(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tittel *</Label>
              <Input
                value={draft.title}
                onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="f.eks. Offisiell nettside"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Nettadresse *</Label>
              <Input
                value={draft.url}
                onChange={(e) => setDraft((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://eksempel.no"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hentet dato</Label>
              <Input
                type="date"
                value={draft.capturedAt}
                onChange={(e) => setDraft((prev) => ({ ...prev, capturedAt: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Merknad</Label>
              <Input
                value={draft.note}
                onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Valgfri kommentar"
                className="h-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleAdd} disabled={saving}>
              {saving ? "Lagrer..." : "Legg til"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false)
                setDraft(EMPTY_SOURCE)
                setError(null)
              }}
            >
              Avbryt
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="mr-2 size-4" />
          Legg til kilde
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// RepairServicesManager
// ---------------------------------------------------------------------------

type RepairServicesManagerProps =
  | { variant: "persisted"; actorId: string; actorCategory?: string }
  | {
      variant: "staging"
      actorCategory?: string
      services: AdminStagedRepair[]
      onChange: (next: AdminStagedRepair[]) => void
    }

function RepairServicesManager(props: RepairServicesManagerProps) {
  if (props.variant === "staging") {
    return (
      <RepairServicesManagerStaging
        actorCategory={props.actorCategory}
        services={props.services}
        onChange={props.onChange}
      />
    )
  }
  return <RepairServicesManagerPersisted actorId={props.actorId} actorCategory={props.actorCategory} />
}

function RepairServicesManagerStaging({
  actorCategory,
  services,
  onChange,
}: {
  actorCategory?: string
  services: AdminStagedRepair[]
  onChange: (next: AdminStagedRepair[]) => void
}) {
  const categoryKey = actorCategory?.trim() ?? ""
  const isRepairCategory = categoryKey ? supportsRepairServices(categoryKey) : false

  const problemOptions = useMemo(() => {
    if (!isRepairCategory) return [...PROBLEM_TYPES]
    const scoped = getRepairServiceProblemTypesForCategory(categoryKey)
    return scoped.length ? scoped : [...PROBLEM_TYPES]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey, isRepairCategory])

  const itemOptions = useMemo(() => {
    if (!isRepairCategory) return [...ITEM_TYPES]
    const scoped = getRepairServiceItemTypesForCategory(categoryKey)
    return scoped.length ? scoped : [...ITEM_TYPES]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey, isRepairCategory])

  const update = (index: number, patch: Partial<AdminStagedRepair>) => {
    onChange(services.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const toggleItemType = (index: number, type: string) => {
    const current = services[index].itemTypes
    const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type]
    update(index, { itemTypes: next })
  }

  const removeAt = (index: number) => {
    onChange(services.filter((_, i) => i !== index))
  }

  const addService = () => {
    onChange([...services, { problemType: "", itemTypes: [], priceMin: "", priceMax: "", etaDays: "" }])
  }

  const hasAnyInput = services.some(
    (s) => s.problemType || s.itemTypes.length || s.priceMin || s.priceMax || s.etaDays,
  )

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Label>Reparasjonstjenester</Label>
        {!isRepairCategory && <Badge variant="secondary">Ikke påkrevd</Badge>}
      </div>
      {!isRepairCategory ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Denne kategorien kan sendes inn uten reparasjonstjenester. Velg en reparasjonskategori på fanen «Aktør» for å legge til tjenester.
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Legg til minst én reparasjonstjeneste som beskriver hva aktøren faktisk tilbyr.
        </p>
      )}
      <div className="mt-2 grid gap-3 md:gap-4">
        {!isRepairCategory && !hasAnyInput ? (
          <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            Reparasjonstjenester er deaktivert for denne kategorien.
          </div>
        ) : (
          services.map((service, index) => (
            <Card key={`staged-repair-${index}`} className="rounded-xl border border-dashed">
              <CardContent className="grid gap-3 p-4 md:gap-4 md:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Tjeneste {index + 1}</p>
                  {services.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => removeAt(index)}
                      disabled={!isRepairCategory}
                    >
                      Fjern
                    </Button>
                  )}
                </div>

                <div>
                  <Label>Problemtype</Label>
                  <div className="mt-1">
                    <SearchableSelect
                      value={service.problemType}
                      onChange={(value) => update(index, { problemType: value })}
                      placeholder="Velg problemtype"
                      options={problemOptions.map((option) => ({
                        value: option,
                        label: formatProblemTypeLabel(option),
                        keywords: option,
                      }))}
                      disabled={!isRepairCategory}
                    />
                  </div>
                </div>

                <div>
                  <Label>Produktkategorier</Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {itemOptions.map((type) => {
                      const checked = service.itemTypes.includes(type)
                      return (
                        <label
                          key={type}
                          className={`flex items-start gap-2.5 rounded-xl border border-input px-3 py-3 text-sm leading-snug cursor-pointer ${
                            checked ? "border-primary/40 bg-primary/5" : ""
                          } ${!isRepairCategory ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleItemType(index, type)}
                            disabled={!isRepairCategory}
                          />
                          <span className="min-w-0">{formatItemTypeLabel(type)}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Pris fra (NOK)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      className="mt-1"
                      value={service.priceMin}
                      onChange={(e) => update(index, { priceMin: e.target.value })}
                      disabled={!isRepairCategory}
                    />
                  </div>
                  <div>
                    <Label>Pris til (NOK)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      className="mt-1"
                      value={service.priceMax}
                      onChange={(e) => update(index, { priceMax: e.target.value })}
                      disabled={!isRepairCategory}
                    />
                  </div>
                </div>

                <div>
                  <Label>Estimert tid (dager)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    className="mt-1"
                    value={service.etaDays}
                    onChange={(e) => update(index, { etaDays: e.target.value })}
                    disabled={!isRepairCategory}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full sm:w-auto"
        onClick={addService}
        disabled={!isRepairCategory}
      >
        Legg til tjeneste
      </Button>
    </div>
  )
}

function RepairServicesManagerPersisted({ actorId, actorCategory }: { actorId: string; actorCategory?: string }) {
  const [services, setServices] = useState<ActorRepairService[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState(EMPTY_REPAIR)

  const categoryKey = actorCategory?.trim() ?? ""
  const isRepairCategory = categoryKey ? supportsRepairServices(categoryKey) : false

  const problemOptions = useMemo(() => {
    if (!isRepairCategory) return [...PROBLEM_TYPES]
    const scoped = getRepairServiceProblemTypesForCategory(categoryKey)
    return scoped.length ? scoped : [...PROBLEM_TYPES]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey, isRepairCategory])

  const itemOptions = useMemo(() => {
    if (!isRepairCategory) return [...ITEM_TYPES]
    const scoped = getRepairServiceItemTypesForCategory(categoryKey)
    return scoped.length ? scoped : [...ITEM_TYPES]
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey, isRepairCategory])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/actor-repair-services")
      if (!res.ok) throw new Error("Kunne ikke laste tjenester")
      const all = (await res.json()) as ActorRepairService[]
      setServices(all.filter((s) => s.actorId === actorId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actorId])

  const handleAdd = async () => {
    const priceMin = Number(draft.priceMin)
    const priceMax = Number(draft.priceMax)
    if (!draft.problemType || draft.itemTypes.length === 0) {
      setError("Problemtype og minst én gjenstandstype er påkrevd.")
      return
    }
    if (Number.isNaN(priceMin) || Number.isNaN(priceMax) || priceMin < 0 || priceMax < priceMin) {
      setError("Ugyldig prisintervall.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/actor-repair-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId,
          problemType: draft.problemType,
          itemTypes: draft.itemTypes,
          priceMin,
          priceMax,
          etaDays: draft.etaDays === "" ? null : Number(draft.etaDays),
        }),
      })
      if (!res.ok) throw new Error("Lagring feilet")
      setDraft(EMPTY_REPAIR)
      setAdding(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Slette denne tjenesten?")) return
    try {
      await fetch(`/api/admin/actor-repair-services/${id}`, { method: "DELETE" })
      await load()
    } catch {
      setError("Sletting feilet")
    }
  }

  const toggleItemType = (type: string) => {
    setDraft((prev) => ({
      ...prev,
      itemTypes: prev.itemTypes.includes(type)
        ? prev.itemTypes.filter((t) => t !== type)
        : [...prev.itemTypes, type],
    }))
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Laster tjenester...</p>
      ) : services.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ingen reparasjonstjenester registrert ennå.</p>
      ) : (
        <div className="rounded-md border divide-y">
          {services.map((service) => (
            <div key={service.id} className="flex items-start gap-3 px-4 py-3">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {formatProblemTypeLabel(service.problemType)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {service.priceMin}–{service.priceMax} kr
                    {service.etaDays != null ? ` · ${service.etaDays} dager` : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {service.itemTypes.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {formatItemTypeLabel(t)}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(service.id)}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Slett tjeneste</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div className="rounded-md border p-4 space-y-4 bg-muted/20">
          <p className="text-sm font-medium">Ny reparasjonstjeneste</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Problemtype *</Label>
              <SearchableSelect
                value={draft.problemType}
                      options={problemOptions.map((p) => ({
                        value: p,
                        label: formatProblemTypeLabel(p),
                        keywords: p,
                      }))}
                onChange={(v) => setDraft((prev) => ({ ...prev, problemType: v }))}
                placeholder="Velg problemtype"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Gjenstandstyper *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {itemOptions.map((type) => {
                  const checked = draft.itemTypes.includes(type)
                  return (
                    <label
                      key={type}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs cursor-pointer transition-colors ${
                        checked ? "border-primary/40 bg-primary/5" : "border-border"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleItemType(type)}
                      />
                      <span>{formatItemTypeLabel(type)}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Minstepris (kr) *</Label>
              <Input
                type="number"
                min={0}
                value={draft.priceMin}
                onChange={(e) => setDraft((prev) => ({ ...prev, priceMin: e.target.value }))}
                placeholder="500"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Makspris (kr) *</Label>
              <Input
                type="number"
                min={0}
                value={draft.priceMax}
                onChange={(e) => setDraft((prev) => ({ ...prev, priceMax: e.target.value }))}
                placeholder="1500"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ledetid (dager)</Label>
              <Input
                type="number"
                min={0}
                value={draft.etaDays}
                onChange={(e) => setDraft((prev) => ({ ...prev, etaDays: e.target.value }))}
                placeholder="2"
                className="h-9"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleAdd} disabled={saving}>
              {saving ? "Lagrer..." : "Legg til"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setAdding(false)
                setDraft(EMPTY_REPAIR)
                setError(null)
              }}
            >
              Avbryt
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)} disabled={!isRepairCategory}>
          <Plus className="mr-2 size-4" />
          Legg til tjeneste
        </Button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ActorDialogContent — exported, rendered inside the ResourceManager <Dialog>
// ---------------------------------------------------------------------------

export function ActorDialogContent({
  mode,
  actorId,
  actorCategory,
  createStagedSources,
  onCreateStagedSourcesChange,
  createStagedRepairs,
  onCreateStagedRepairsChange,
  actorFormSections,
  actorExtraKeys,
  formKeys,
  renderField,
}: ActorDialogContentProps) {
  const canStageCreate =
    mode === "create" &&
    createStagedSources &&
    onCreateStagedSourcesChange &&
    createStagedRepairs &&
    onCreateStagedRepairsChange

  return (
    <Tabs defaultValue="actor" className="w-full">
      <TabsList className="mb-4 h-11 px-1 gap-1">
        <TabsTrigger value="actor" className="px-5 text-sm">Aktør</TabsTrigger>
        <TabsTrigger value="sources" disabled={mode === "create" && !canStageCreate} className="px-5 text-sm">
          Aktørkilder
        </TabsTrigger>
        <TabsTrigger value="repair" disabled={mode === "create" && !canStageCreate} className="px-5 text-sm">
          Reparasjons-tjenester
        </TabsTrigger>
      </TabsList>

      {/* ---- Aktør tab ---- */}
      <TabsContent value="actor">
        <div className="grid max-h-[60vh] gap-6 overflow-y-auto p-1 pr-2">
          {actorFormSections.map((section) => {
            const keys = section.keys.filter((key) => formKeys.includes(key))
            if (!keys.length) return null
            const gridClassName =
              section.layout === "stack"
                ? "mt-3 grid gap-4"
                : "mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            return (
              <div key={section.title}>
                <p className="text-sm font-semibold">{section.title}</p>
                <div className={gridClassName}>{keys.map((key) => renderField(key))}</div>
              </div>
            )
          })}
          {actorExtraKeys.length > 0 && (
            <div>
              <p className="text-sm font-semibold">Andre felt</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {actorExtraKeys.map((key) => renderField(key))}
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      {/* ---- Aktørkilder tab ---- */}
      <TabsContent value="sources">
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {canStageCreate ? (
            <SourcesManager
              variant="staging"
              sources={createStagedSources}
              onChange={onCreateStagedSourcesChange}
            />
          ) : mode === "edit" && actorId ? (
            <SourcesManager variant="persisted" actorId={actorId} />
          ) : (
            <p className="text-sm text-muted-foreground py-4">Lagre aktøren først for å legge til kilder.</p>
          )}
        </div>
      </TabsContent>

      {/* ---- Reparasjons-tjenester tab ---- */}
      <TabsContent value="repair">
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {canStageCreate ? (
            <RepairServicesManager
              variant="staging"
              actorCategory={actorCategory}
              services={createStagedRepairs}
              onChange={onCreateStagedRepairsChange}
            />
          ) : mode === "edit" && actorId ? (
            <RepairServicesManager variant="persisted" actorId={actorId} actorCategory={actorCategory} />
          ) : (
            <p className="text-sm text-muted-foreground py-4">
              Lagre aktøren først for å legge til reparasjonstjenester.
            </p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
