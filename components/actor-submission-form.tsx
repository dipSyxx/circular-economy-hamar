"use client"

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react"
import Link from "next/link"
import { XIcon } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { AddressSearchInput } from "@/components/address-search-input"
import { ImageUploadField } from "@/components/image-upload"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { categoryOrder, supportsRepairServices } from "@/lib/categories"
import {
  clampRepairServiceDraftToCategory,
  getRepairServiceItemTypesForCategory,
  getRepairServiceProblemTypesForCategory,
} from "@/lib/category-repair-scope"
import {
  formatCategoryLabel,
  formatEnumLabel,
  formatItemTypeLabel,
  formatProblemTypeLabel,
} from "@/lib/enum-labels"
import { ACTOR_FORM_SECTIONS } from "@/lib/actor-form-sections"
import { getCountyByName, getMunicipalitiesForCounty, norwayCounties } from "@/lib/geo"
import { cn } from "@/lib/utils"

export type ActorDraft = {
  name: string
  slug: string
  category: string
  description: string
  longDescription: string
  address: string
  postalCode: string
  county: string
  municipality: string
  city: string
  area: string
  lat: string
  lng: string
  phone: string
  email: string
  website: string
  instagram: string
  openingHours: string[]
  openingHoursOsm: string
  tags: string[]
  benefits: string[]
  howToUse: string[]
  image: string
  nationwide: boolean
}

export type RepairServiceDraft = {
  problemType: string
  itemTypes: string[]
  priceMin: string
  priceMax: string
  etaDays: string
}

export type SourceDraft = {
  type: string
  title: string
  url: string
  capturedAt: string
  note: string
}

type ActorSubmissionFormProps = {
  variant?: "card" | "dialog"
  mode?: "create" | "edit"
  actorId?: string
  initialActor?: ActorDraft
  initialRepairServices?: RepairServiceDraft[]
  initialSources?: SourceDraft[]
  submitLabel?: string
  onSuccess?: (actorId: string) => void | Promise<void>
}

type ActorSubmissionTab = "actor" | "sources" | "repair"

const sourceTypes = ["website", "social", "google_reviews", "article", "map"]

const sourceTypeLabels: Record<string, string> = {
  website: "Nettside",
  social: "Sosiale medier",
  google_reviews: "Google-anmeldelser",
  article: "Artikkel",
  map: "Kart",
}

const [basicInfoTitle, contactTitle, imageTitle, detailsTitle] = ACTOR_FORM_SECTIONS.slice(0, 4).map(
  (section) => section.title,
)

const dialogTabBodyClassName =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-4 touch-pan-y sm:px-6 sm:pb-5 sm:pt-5"

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

const emptyActor: ActorDraft = {
  name: "",
  slug: "",
  category: "brukt",
  description: "",
  longDescription: "",
  address: "",
  postalCode: "",
  county: "",
  municipality: "",
  city: "",
  area: "",
  lat: "",
  lng: "",
  phone: "",
  email: "",
  website: "",
  instagram: "",
  openingHours: [],
  openingHoursOsm: "",
  tags: [],
  benefits: [],
  howToUse: [],
  image: "",
  nationwide: false,
}

const buildInitialActor = (actor?: ActorDraft): ActorDraft => {
  if (!actor) return emptyActor
  return {
    ...actor,
    city: actor.municipality.trim() || actor.city.trim(),
  }
}

const emptyRepairService = (): RepairServiceDraft => ({
  problemType: "",
  itemTypes: [],
  priceMin: "",
  priceMax: "",
  etaDays: "",
})

const emptySource = (): SourceDraft => ({
  type: "website",
  title: "",
  url: "",
  capturedAt: "",
  note: "",
})

type TagInputProps = {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const tags = Array.isArray(value) ? value : []

  const addTag = (raw: string) => {
    const next = raw.trim()
    if (!next) return
    if (tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) return
    onChange([...tags, next])
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((item) => item !== tag))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      addTag(inputValue)
      setInputValue("")
    }
    if (event.key === "Backspace" && !inputValue && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  const handleBlur = () => {
    if (!inputValue) return
    addTag(inputValue)
    setInputValue("")
  }

  return (
    <div className="rounded-xl border border-input bg-background px-2.5 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 rounded-full">
            <span className="truncate">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Fjern</span>
              <XIcon className="size-3" />
            </button>
          </Badge>
        ))}
        <Input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="h-9 min-w-[8rem] flex-1 border-none bg-transparent px-1 py-0 text-sm shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  )
}

type MultiSelectProps = {
  value: string[]
  options: ReadonlyArray<string>
  getLabel?: (value: string) => string
  onChange: (value: string[]) => void
  disabled?: boolean
}

function MultiSelect({ value, options, getLabel, onChange, disabled = false }: MultiSelectProps) {
  const current = Array.isArray(value) ? value : []

  const toggle = (option: string, checked: boolean) => {
    if (disabled) return
    if (checked) {
      onChange([...current, option])
    } else {
      onChange(current.filter((item) => item !== option))
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const checked = current.includes(option)
        const label = getLabel ? getLabel(option) : formatEnumLabel(option)
        return (
          <label
            key={option}
            className={cn(
              "flex items-start gap-2.5 rounded-xl border border-input px-3 py-3 text-sm leading-snug",
              checked && "border-primary/40 bg-primary/5",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <Checkbox checked={checked} onCheckedChange={(next) => toggle(option, Boolean(next))} disabled={disabled} />
            <span className="min-w-0">{label}</span>
          </label>
        )
      })}
    </div>
  )
}

export function ActorSubmissionForm({
  variant = "card",
  mode = "create",
  actorId,
  initialActor,
  initialRepairServices,
  initialSources,
  submitLabel,
  onSuccess,
}: ActorSubmissionFormProps) {
  const { data } = authClient.useSession()
  const isSignedIn = Boolean(data?.session)
  const [actor, setActor] = useState<ActorDraft>(buildInitialActor(initialActor))
  const [repairServices, setRepairServices] = useState<RepairServiceDraft[]>(
    initialRepairServices?.length ? initialRepairServices : [emptyRepairService()],
  )
  const [sources, setSources] = useState<SourceDraft[]>(
    initialSources?.length ? initialSources : [emptySource()],
  )
  const [slugTouched, setSlugTouched] = useState(mode === "edit")
  const [activeTab, setActiveTab] = useState<ActorSubmissionTab>("actor")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const headingTitle = mode === "edit" ? "Oppdater aktør" : "Registrer ny aktør"
  const headingDescription =
    mode === "edit"
      ? "Oppdater feltene og send inn på nytt for godkjenning."
      : "Fyll inn feltene. Innsendingen blir gjennomgått av en administrator for publisering."
  const actionLabel = submitting ? "Sender..." : submitLabel ?? (mode === "edit" ? "Oppdater aktør" : "Send inn aktør")
  const statusNote = 'Aktøren får status "pending" til den er godkjent av administrator.'
  const slugPreview = useMemo(
    () => (slugTouched ? actor.slug : slugify(actor.name)),
    [actor.name, actor.slug, slugTouched],
  )
  const isDialog = variant === "dialog"
  const repairCategory = supportsRepairServices(actor.category)
  const repairProblemTypes = useMemo(
    () => getRepairServiceProblemTypesForCategory(actor.category),
    [actor.category],
  )
  const repairItemTypes = useMemo(() => getRepairServiceItemTypesForCategory(actor.category), [actor.category])
  const selectedCountySlug = useMemo(() => getCountyByName(actor.county)?.slug ?? "", [actor.county])
  const municipalityOptions = useMemo(
    () => (selectedCountySlug ? getMunicipalitiesForCounty(selectedCountySlug) : []),
    [selectedCountySlug],
  )

  useEffect(() => {
    if (repairCategory) return
    setRepairServices((current) =>
      current.every(
        (service) =>
          !service.problemType &&
          service.itemTypes.length === 0 &&
          !service.priceMin &&
          !service.priceMax &&
          !service.etaDays,
      )
        ? current
        : [emptyRepairService()],
    )
  }, [repairCategory])

  useEffect(() => {
    if (!repairCategory) return
    setRepairServices((prev) => prev.map((service) => clampRepairServiceDraftToCategory(actor.category, service)))
  }, [actor.category, repairCategory])

  const hasRepairServiceInput = (service: RepairServiceDraft) =>
    Boolean(
      service.problemType ||
        service.itemTypes.length ||
        service.priceMin.trim() ||
        service.priceMax.trim() ||
        service.etaDays.trim(),
    )

  const hasAnyRepairInput = repairServices.some(hasRepairServiceInput)

  const updateActor = (field: keyof ActorDraft, value: string | string[] | boolean) => {
    setActor((prev) => ({ ...prev, [field]: value }))
  }

  const updateRepairService = (index: number, nextValue: Partial<RepairServiceDraft>) => {
    setRepairServices((prev) =>
      prev.map((service, serviceIndex) => (serviceIndex === index ? { ...service, ...nextValue } : service)),
    )
  }

  const updateSource = (index: number, nextValue: Partial<SourceDraft>) => {
    setSources((prev) =>
      prev.map((source, sourceIndex) => (sourceIndex === index ? { ...source, ...nextValue } : source)),
    )
  }

  const addRepairService = () => {
    setRepairServices((prev) => [...prev, emptyRepairService()])
  }

  const removeRepairService = (index: number) => {
    setRepairServices((prev) => prev.filter((_, i) => i !== index))
  }

  const addSource = () => {
    setSources((prev) => [...prev, emptySource()])
  }

  const removeSource = (index: number) => {
    setSources((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const errors: string[] = []
    if (!actor.name.trim()) errors.push("Navn er påkrevd.")
    if (!slugPreview.trim()) errors.push("Slug er påkrevd.")
    if (!actor.description.trim()) errors.push("Kort beskrivelse er påkrevd.")
    if (!actor.longDescription.trim()) errors.push("Lang beskrivelse er påkrevd.")
    if (!actor.address.trim()) errors.push("Adresse er påkrevd.")
    if (!actor.county.trim()) errors.push("Fylke er påkrevd.")
    if (!actor.municipality.trim()) errors.push("Kommune er påkrevd.")
    if (!actor.openingHours.length) errors.push("Åpningstider er påkrevd.")
    if (!actor.tags.length) errors.push("Legg til minst ett tag.")
    if (!actor.benefits.length) errors.push("Legg til minst en fordel.")
    if (!actor.howToUse.length) errors.push("Legg til minst ett tips for bruk.")
    if (!actor.lat.trim() || !actor.lng.trim()) {
      errors.push("Gyldige koordinater er påkrevd.")
    } else {
      const lat = Number(actor.lat)
      const lng = Number(actor.lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        errors.push("Gyldige koordinater er påkrevd.")
      }
    }

    if (!sources.length) errors.push("Legg til minst en kilde.")

    const repairEntries = repairServices.filter(hasRepairServiceInput)
    if (repairCategory && repairEntries.length === 0) {
      errors.push("Legg til minst en reparasjonstjeneste.")
    }

    repairEntries.forEach((service, index) => {
      if (!service.problemType) errors.push(`Tjeneste #${index + 1}: problemtype mangler.`)
      if (!service.itemTypes.length) errors.push(`Tjeneste #${index + 1}: velg minst en type.`)
      if (!service.priceMin.trim() || !service.priceMax.trim()) {
        errors.push(`Tjeneste #${index + 1}: pris må fylles ut.`)
        return
      }

      const min = Number(service.priceMin)
      const max = Number(service.priceMax)
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        errors.push(`Tjeneste #${index + 1}: pris må fylles ut.`)
      } else if (min > max) {
        errors.push(`Tjeneste #${index + 1}: pris min kan ikke være høyere enn max.`)
      }
    })

    sources.forEach((source, index) => {
      if (!source.type) errors.push(`Kilde #${index + 1}: type mangler.`)
      if (!source.title.trim()) errors.push(`Kilde #${index + 1}: tittel mangler.`)
      if (!source.url.trim()) errors.push(`Kilde #${index + 1}: URL mangler.`)
    })

    return errors
  }

  const resolveValidationTab = (message: string): ActorSubmissionTab => {
    if (message === "Legg til minst en kilde." || message.startsWith("Kilde #")) {
      return "sources"
    }

    if (message === "Legg til minst en reparasjonstjeneste." || message.startsWith("Tjeneste #")) {
      return "repair"
    }

    return "actor"
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const errors = validate()
    if (errors.length) {
      setActiveTab(resolveValidationTab(errors[0]))
      setError(errors[0])
      return
    }

    setSubmitting(true)
    try {
      const isEdit = mode === "edit" && Boolean(actorId)
      const sanitizedRepairServices = repairServices
        .filter(hasRepairServiceInput)
        .map((service) => ({
          problemType: service.problemType,
          itemTypes: service.itemTypes,
          priceMin: Number(service.priceMin),
          priceMax: Number(service.priceMax),
          etaDays: service.etaDays ? Number(service.etaDays) : null,
        }))

      const payload = {
        actor: {
          name: actor.name.trim(),
          slug: slugPreview.trim(),
          category: actor.category,
          description: actor.description.trim(),
          longDescription: actor.longDescription.trim(),
          address: actor.address.trim(),
          postalCode: actor.postalCode.trim() || null,
          county: actor.county.trim(),
          municipality: actor.municipality.trim(),
          city: actor.municipality.trim(),
          area: actor.area.trim() || null,
          lat: Number(actor.lat),
          lng: Number(actor.lng),
          phone: actor.phone.trim() || null,
          email: actor.email.trim() || null,
          website: actor.website.trim() || null,
          instagram: actor.instagram.trim() || null,
          openingHours: actor.openingHours,
          openingHoursOsm: actor.openingHoursOsm.trim() || null,
          tags: actor.tags,
          benefits: actor.benefits,
          howToUse: actor.howToUse,
          image: actor.image.trim() || null,
          nationwide: actor.nationwide,
        },
        repairServices: sanitizedRepairServices,
        sources: sources.map((source) => ({
          type: source.type,
          title: source.title.trim(),
          url: source.url.trim(),
          capturedAt: source.capturedAt || null,
          note: source.note.trim() || null,
        })),
      }

      const response = await fetch(
        isEdit ? `/api/public/actor-submissions/${actorId}` : "/api/public/actor-submissions",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || "Kunne ikke sende inn aktøren.")
      }

      const data = (await response.json().catch(() => null)) as { actor?: { id?: string } } | null
      const resolvedId = data?.actor?.id ?? actorId ?? ""

      setSuccess(
        mode === "edit"
          ? "Aktøren er oppdatert og sendt inn på nytt."
          : "Takk. Aktøren er sendt inn og venter på godkjenning.",
      )

      if (mode === "create") {
        setActor(emptyActor)
        setRepairServices([emptyRepairService()])
        setSources([emptySource()])
        setSlugTouched(false)
        setActiveTab("actor")
      }

      if (resolvedId) {
        await onSuccess?.(resolvedId)
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Noe gikk galt.")
    } finally {
      setSubmitting(false)
    }
  }

  const loginActions = (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Button className="w-full sm:w-auto" asChild>
        <Link href="/auth/sign-in">Logg inn</Link>
      </Button>
      <Button className="w-full sm:w-auto" variant="outline" asChild>
        <Link href="/auth/sign-up">Registrer deg</Link>
      </Button>
    </div>
  )

  const loginPrompt = (
    <div className={cn("space-y-4", isDialog && "px-4 py-4 sm:px-6 sm:py-6")}>
      <div className={cn("space-y-3", isDialog && "rounded-2xl border bg-muted/20 p-4")}>
        <p className="text-sm text-muted-foreground">Logg inn for å sende inn en aktør til vurdering.</p>
        {loginActions}
      </div>
    </div>
  )

  const renderRepairServicesSection = () => (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Label>Reparasjonstjenester</Label>
        {!repairCategory && <Badge variant="secondary">Ikke påkrevd</Badge>}
      </div>
      {!repairCategory ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Denne kategorien kan sendes inn uten reparasjonstjenester. Velg en reparasjonskategori for å legge til tjenester.
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Legg til minst én reparasjonstjeneste som beskriver hva aktøren faktisk tilbyr.
        </p>
      )}
      <div className="mt-2 grid gap-3 md:gap-4">
        {!repairCategory && !hasAnyRepairInput ? (
          <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            Reparasjonstjenester er deaktivert for denne kategorien.
          </div>
        ) : (
          repairServices.map((service, index) => (
            <Card key={`repair-${index}`} className="rounded-xl border border-dashed">
              <CardContent className="grid gap-3 p-4 md:gap-4 md:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Tjeneste {index + 1}</p>
                  {repairServices.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => removeRepairService(index)}
                      disabled={!repairCategory}
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
                      onChange={(value) => updateRepairService(index, { problemType: value })}
                      placeholder="Velg problemtype"
                      options={repairProblemTypes.map((option) => ({
                        value: option,
                        label: formatProblemTypeLabel(option),
                        keywords: option,
                      }))}
                      disabled={!repairCategory}
                    />
                  </div>
                </div>

                <div>
                  <Label>Produktkategorier</Label>
                  <div className="mt-2">
                    <MultiSelect
                      value={service.itemTypes}
                      options={repairItemTypes}
                      getLabel={formatItemTypeLabel}
                      onChange={(value) => updateRepairService(index, { itemTypes: value })}
                      disabled={!repairCategory}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Pris fra (NOK)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={service.priceMin}
                      onChange={(event) => updateRepairService(index, { priceMin: event.target.value })}
                      disabled={!repairCategory}
                    />
                  </div>

                  <div>
                    <Label>Pris til (NOK)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={service.priceMax}
                      onChange={(event) => updateRepairService(index, { priceMax: event.target.value })}
                      disabled={!repairCategory}
                    />
                  </div>
                </div>

                <div>
                  <Label>Estimert tid (dager)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={service.etaDays}
                    onChange={(event) => updateRepairService(index, { etaDays: event.target.value })}
                    disabled={!repairCategory}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <Button type="button" variant="outline" className="mt-3 w-full sm:w-auto" onClick={addRepairService} disabled={!repairCategory}>
        Legg til tjeneste
      </Button>
    </div>
  )

  const renderSourcesSection = () => (
    <div>
      <div className="flex items-center justify-between gap-3">
        <Label>Kilder og dokumentasjon</Label>
        <Badge variant="secondary">Påkrevd</Badge>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Legg ved minst én kilde som dokumenterer aktøren før innsending.
      </p>
      <div className="mt-2 grid gap-3 md:gap-4">
        {sources.map((source, index) => (
          <Card key={`source-${index}`} className="rounded-xl border border-dashed">
            <CardContent className="grid gap-3 p-4 md:gap-4 md:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Kilde {index + 1}</p>
                {sources.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => removeSource(index)}>
                    Fjern
                  </Button>
                )}
              </div>

              <div>
                <Label>Type</Label>
                <Select value={source.type} onValueChange={(value) => updateSource(index, { type: value })}>
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Velg type" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceTypes.map((option) => (
                      <SelectItem key={option} value={option}>
                        {sourceTypeLabels[option] ?? formatEnumLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tittel</Label>
                <Input value={source.title} onChange={(event) => updateSource(index, { title: event.target.value })} />
              </div>

              <div>
                <Label>URL</Label>
                <Input
                  type="url"
                  value={source.url}
                  onChange={(event) => updateSource(index, { url: event.target.value })}
                  placeholder="https://"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Dato (valgfritt)</Label>
                  <Input
                    type="date"
                    value={source.capturedAt}
                    onChange={(event) => updateSource(index, { capturedAt: event.target.value })}
                  />
                </div>

                <div>
                  <Label>Notat</Label>
                  <Input value={source.note} onChange={(event) => updateSource(index, { note: event.target.value })} />
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

  const sectionGridClassName = "mt-2.5 grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3"

  const legacyFormBody = (
    <div
      className="grid gap-6 md:gap-8"
    >
      <div className="grid gap-5 md:gap-6">
        <div className="space-y-2.5">
          <p className="text-sm font-semibold tracking-tight">{basicInfoTitle}</p>
          <div className={sectionGridClassName}>
            <div>
              <Label htmlFor="name">Navn</Label>
              <Input
                id="name"
                value={actor.name}
                onChange={(event) => {
                  const value = event.target.value
                  updateActor("name", value)
                  if (!slugTouched) {
                    updateActor("slug", slugify(value))
                  }
                }}
                placeholder="Navn på aktør"
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slugTouched ? actor.slug : slugPreview}
                onChange={(event) => {
                  setSlugTouched(true)
                  updateActor("slug", event.target.value)
                }}
                placeholder="kort-navn"
              />
              <p className="mt-1 text-xs text-muted-foreground">URL: /aktorer/{slugPreview || "slug"}</p>
            </div>

            <div>
              <Label>Kategori</Label>
              <Select
                value={actor.category}
                onValueChange={(value) => {
                  updateActor("category", value)
                  if (!supportsRepairServices(value)) {
                    setRepairServices([emptyRepairService()])
                  } else {
                    setRepairServices((prev) =>
                      prev.map((service) => clampRepairServiceDraftToCategory(value, service)),
                    )
                  }
                }}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOrder.map((option) => (
                    <SelectItem key={option} value={option}>
                      {formatCategoryLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <Label htmlFor="description">Kort beskrivelse</Label>
              <Textarea
                id="description"
                value={actor.description}
                onChange={(event) => updateActor("description", event.target.value)}
                className="min-h-[104px] md:min-h-[120px]"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <Label htmlFor="longDescription">Lang beskrivelse</Label>
              <Textarea
                id="longDescription"
                value={actor.longDescription}
                onChange={(event) => updateActor("longDescription", event.target.value)}
                className="min-h-[140px] md:min-h-[160px]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-sm font-semibold tracking-tight">{contactTitle}</p>
          <div className={sectionGridClassName}>
            <div className="md:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <AddressSearchInput
                id="address"
                value={actor.address}
                onChange={(value) => updateActor("address", value)}
                onCoordinates={(coords) =>
                  setActor((prev) => ({
                    ...prev,
                    lat: coords.lat.toFixed(6),
                    lng: coords.lng.toFixed(6),
                  }))
                }
                placeholder="Gate, postnummer, sted"
              />
            </div>

            <div>
              <Label>Fylke</Label>
              <Select
                value={actor.county || undefined}
                onValueChange={(value) => {
                  const nextCountySlug = getCountyByName(value)?.slug ?? ""
                  const nextMunicipalities = nextCountySlug ? getMunicipalitiesForCounty(nextCountySlug) : []
                  const stillValid = nextMunicipalities.some((municipality) => municipality.name === actor.municipality)
                  setActor((prev) => ({
                    ...prev,
                    county: value,
                    municipality: stillValid ? prev.municipality : "",
                    city: stillValid ? prev.municipality : "",
                  }))
                }}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Velg fylke" />
                </SelectTrigger>
                <SelectContent>
                  {norwayCounties.map((county) => (
                    <SelectItem key={county.slug} value={county.name}>
                      {county.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Kommune</Label>
              <Select
                value={actor.municipality || undefined}
                onValueChange={(value) => setActor((prev) => ({ ...prev, municipality: value, city: value }))}
                disabled={!selectedCountySlug || municipalityOptions.length === 0}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Velg kommune" />
                </SelectTrigger>
                <SelectContent>
                  {municipalityOptions.map((municipality) => (
                    <SelectItem key={`${municipality.countySlug}:${municipality.slug}`} value={municipality.name}>
                      {municipality.name}
                    </SelectItem>
                  ))}
                  {!municipalityOptions.some((municipality) => municipality.name === actor.municipality) && actor.municipality ? (
                    <SelectItem value={actor.municipality}>{actor.municipality}</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="city">By / sted</Label>
              <Input
                id="city"
                value={actor.municipality || actor.city}
                placeholder={actor.municipality || "Velg kommune først"}
                disabled
                readOnly
              />
              {actor.municipality ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  By/sted følger valgt kommune. Bruk område-feltet hvis du trenger mer presisjon.
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="postalCode">Postnummer</Label>
              <Input
                id="postalCode"
                inputMode="numeric"
                value={actor.postalCode}
                onChange={(event) => updateActor("postalCode", event.target.value)}
                placeholder="2318"
              />
            </div>

            <div>
              <Label htmlFor="area">Område (valgfritt)</Label>
              <Input
                id="area"
                value={actor.area}
                onChange={(event) => updateActor("area", event.target.value)}
                placeholder="Sentrum"
              />
            </div>

            <div>
              <Label htmlFor="lat">Breddegrad</Label>
              <Input
                id="lat"
                type="number"
                step="0.000001"
                value={actor.lat}
                onChange={(event) => updateActor("lat", event.target.value)}
                placeholder="60.79"
              />
            </div>

            <div>
              <Label htmlFor="lng">Lengdegrad</Label>
              <Input
                id="lng"
                type="number"
                step="0.000001"
                value={actor.lng}
                onChange={(event) => updateActor("lng", event.target.value)}
                placeholder="11.07"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" type="tel" value={actor.phone} onChange={(event) => updateActor("phone", event.target.value)} />
            </div>

            <div>
              <Label htmlFor="email">E-post</Label>
              <Input id="email" type="email" value={actor.email} onChange={(event) => updateActor("email", event.target.value)} />
            </div>

            <div>
              <Label htmlFor="website">Nettside</Label>
              <Input
                id="website"
                type="url"
                value={actor.website}
                onChange={(event) => updateActor("website", event.target.value)}
                placeholder="https://"
              />
            </div>

            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                type="url"
                value={actor.instagram}
                onChange={(event) => updateActor("instagram", event.target.value)}
                placeholder="https://"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <label className="flex items-start gap-3 rounded-xl border border-input px-3 py-3.5 text-sm">
                <Checkbox checked={actor.nationwide} onCheckedChange={(value) => updateActor("nationwide", Boolean(value))} />
                <div>
                  <p className="font-medium">Landsdekkende tilbud</p>
                  <p className="text-xs text-muted-foreground">
                    Kryss av hvis aktøren leverer utover ett lokalt nedslagsfelt.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-sm font-semibold tracking-tight">{imageTitle}</p>
          <ImageUploadField id="image" value={actor.image} onChange={(value) => updateActor("image", value)} folder="actors" />
        </div>
        <div className="space-y-2.5">
          <p className="text-sm font-semibold tracking-tight">{detailsTitle}</p>
          <div className={sectionGridClassName}>
            <div className="md:col-span-2">
              <Label>Åpningstider</Label>
              <TagInput value={actor.openingHours} onChange={(value) => updateActor("openingHours", value)} placeholder="Legg til og trykk Enter" />
            </div>

            <div>
              <Label htmlFor="openingHoursOsm">OSM-format (valgfritt)</Label>
              <Input
                id="openingHoursOsm"
                value={actor.openingHoursOsm}
                onChange={(event) => updateActor("openingHoursOsm", event.target.value)}
                placeholder="Mo-Fr 10:00-17:00"
              />
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <Label>Tags</Label>
              <TagInput value={actor.tags} onChange={(value) => updateActor("tags", value)} placeholder="Legg til og trykk Enter" />
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <Label>Fordeler</Label>
              <TagInput value={actor.benefits} onChange={(value) => updateActor("benefits", value)} placeholder="Legg til og trykk Enter" />
            </div>

            <div className="md:col-span-2 xl:col-span-3">
              <Label>Hvordan bruke</Label>
              <TagInput value={actor.howToUse} onChange={(value) => updateActor("howToUse", value)} placeholder="Legg til og trykk Enter" />
            </div>
          </div>
        </div>
      </div>

      <div className={cn("grid gap-5 xl:grid-cols-2", isDialog && "hidden")}>
        {renderRepairServicesSection()}
        {renderSourcesSection()}
      </div>
    </div>
  )

  const formBody = isDialog ? (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as ActorSubmissionTab)}
      className="min-h-0 flex-1 gap-0"
    >
      <div className="px-4 pt-4 sm:px-6 sm:pt-5">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-xl p-1 sm:inline-flex sm:h-11 sm:w-auto sm:grid-cols-none">
          <TabsTrigger value="actor" className="justify-start px-4 text-sm sm:justify-center sm:px-5">
            Aktør
          </TabsTrigger>
          <TabsTrigger value="sources" className="justify-start px-4 text-sm sm:justify-center sm:px-5">
            Kilder
          </TabsTrigger>
          <TabsTrigger value="repair" className="justify-start px-4 text-sm sm:justify-center sm:px-5">
            Reparasjonstjenester
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="actor" className={dialogTabBodyClassName}>
        {legacyFormBody}
      </TabsContent>

      <TabsContent value="sources" className={dialogTabBodyClassName}>
        {renderSourcesSection()}
      </TabsContent>

      <TabsContent value="repair" className={dialogTabBodyClassName}>
        {renderRepairServicesSection()}
      </TabsContent>
    </Tabs>
  ) : (
    legacyFormBody
  )

  const feedbackMessages = (
    <>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}
    </>
  )

  const formFooter = isDialog ? (
    <div className="border-t bg-background/95 px-4 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur sm:px-6 sm:pb-4 sm:pt-4">
      <div className="grid gap-3">
        {feedbackMessages}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={submitting} className="w-full sm:order-2 sm:w-auto">
            {actionLabel}
          </Button>
          <span className="text-xs text-muted-foreground sm:order-1">{statusNote}</span>
        </div>
      </div>
    </div>
  ) : (
    <div className="grid gap-3 border-t pt-4 md:pt-5">
      {feedbackMessages}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {actionLabel}
        </Button>
        <span className="text-xs text-muted-foreground">{statusNote}</span>
      </div>
    </div>
  )

  const formContent = (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "min-w-0 [&_label+*]:mt-2",
        isDialog ? "flex min-h-0 flex-1 flex-col gap-0" : "grid gap-6",
      )}
    >
      {formBody}
      {formFooter}
    </form>
  )

  if (variant === "dialog") {
    return isSignedIn ? formContent : loginPrompt
  }

  if (!isSignedIn) {
    return (
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle>{headingTitle}</CardTitle>
          <CardDescription>Logg inn for å sende inn en aktør til vurdering.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">{loginActions}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle>{headingTitle}</CardTitle>
        <CardDescription>{headingDescription}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">{formContent}</CardContent>
    </Card>
  )
}
