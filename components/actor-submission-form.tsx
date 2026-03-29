"use client"

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react"
import Link from "next/link"
import { XIcon } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AddressSearchInput } from "@/components/address-search-input"
import { ImageUploadField } from "@/components/image-upload"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { ITEM_TYPES, PROBLEM_TYPES } from "@/lib/prisma-enums"
import { categoryOrder, supportsRepairServices } from "@/lib/categories"
import { getCountyByName, getMunicipalitiesForCounty, norwayCounties } from "@/lib/geo"
import {
  formatCategoryLabel,
  formatEnumLabel,
  formatItemTypeLabel,
  formatProblemTypeLabel,
} from "@/lib/enum-labels"

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

const problemTypes = PROBLEM_TYPES
const itemTypes = ITEM_TYPES
const sourceTypes = ["website", "social", "google_reviews", "article", "map"]

const sourceTypeLabels: Record<string, string> = {
  website: "Nettside",
  social: "Sosiale medier",
  google_reviews: "Google-anmeldelser",
  article: "Artikkel",
  map: "Kart",
}

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
    city: actor.city.trim() || actor.municipality.trim(),
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
    <div className="rounded-md border border-input bg-background px-2 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
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
          className="h-7 w-[180px] border-none bg-transparent px-1 py-0 text-sm shadow-none focus-visible:ring-0"
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
}

function MultiSelect({ value, options, getLabel, onChange }: MultiSelectProps) {
  const current = Array.isArray(value) ? value : []

  const toggle = (option: string, checked: boolean) => {
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
              "flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm",
              checked && "border-primary/40 bg-primary/5",
            )}
          >
            <Checkbox checked={checked} onCheckedChange={(next) => toggle(option, Boolean(next))} />
            <span>{label}</span>
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
  const [cityOverride, setCityOverride] = useState(
    Boolean(
      (initialActor?.city || "").trim() &&
        (initialActor?.municipality || "").trim() &&
        initialActor?.city.trim() !== initialActor?.municipality.trim(),
    ),
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const headingTitle = mode === "edit" ? "Oppdater aktor" : "Registrer ny aktor"
  const headingDescription =
    mode === "edit"
      ? "Oppdater feltene og send inn pa nytt for godkjenning."
      : "Fyll inn feltene. Innsendingen blir gjennomgatt av en administrator for publisering."

  const slugPreview = useMemo(
    () => (slugTouched ? actor.slug : slugify(actor.name)),
    [actor.name, actor.slug, slugTouched],
  )
  const isDialog = variant === "dialog"
  const repairCategory = supportsRepairServices(actor.category)
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

  const hasRepairServiceInput = (service: RepairServiceDraft) =>
    Boolean(
      service.problemType ||
        service.itemTypes.length ||
        service.priceMin.trim() ||
        service.priceMax.trim() ||
        service.etaDays.trim(),
    )

  const updateActor = (field: keyof ActorDraft, value: string | string[] | boolean) => {
    setActor((prev) => ({ ...prev, [field]: value }))
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
    if (!actor.name.trim()) errors.push("Navn er pakrevd.")
    if (!slugPreview.trim()) errors.push("Slug er pakrevd.")
    if (!actor.description.trim()) errors.push("Kort beskrivelse er pakrevd.")
    if (!actor.longDescription.trim()) errors.push("Lang beskrivelse er pakrevd.")
    if (!actor.address.trim()) errors.push("Adresse er pakrevd.")
    if (!actor.county.trim()) errors.push("Fylke er pakrevd.")
    if (!actor.municipality.trim()) errors.push("Kommune er pakrevd.")
    if (!(actor.city.trim() || actor.municipality.trim())) errors.push("By/sted er pakrevd.")
    if (!actor.openingHours.length) errors.push("Apningstider er pakrevd.")
    if (!actor.tags.length) errors.push("Legg til minst ett tag.")
    if (!actor.benefits.length) errors.push("Legg til minst en fordel.")
    if (!actor.howToUse.length) errors.push("Legg til minst ett tips for bruk.")
    if (!actor.lat.trim() || !actor.lng.trim()) {
      errors.push("Gyldige koordinater er pakrevd.")
    } else {
      const lat = Number(actor.lat)
      const lng = Number(actor.lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        errors.push("Gyldige koordinater er pakrevd.")
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
        errors.push(`Tjeneste #${index + 1}: pris ma fylles ut.`)
        return
      }
      const min = Number(service.priceMin)
      const max = Number(service.priceMax)
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        errors.push(`Tjeneste #${index + 1}: pris ma fylles ut.`)
      } else if (min > max) {
        errors.push(`Tjeneste #${index + 1}: pris min kan ikke vaere hoyere enn max.`)
      }
    })

    sources.forEach((source, index) => {
      if (!source.type) errors.push(`Kilde #${index + 1}: type mangler.`)
      if (!source.title.trim()) errors.push(`Kilde #${index + 1}: tittel mangler.`)
      if (!source.url.trim()) errors.push(`Kilde #${index + 1}: URL mangler.`)
    })

    return errors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const errors = validate()
    if (errors.length) {
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
          city: (actor.city.trim() || actor.municipality.trim()),
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
        throw new Error(data?.error || "Kunne ikke sende inn aktoren.")
      }

      const data = (await response.json().catch(() => null)) as { actor?: { id?: string } } | null
      const resolvedId = data?.actor?.id ?? actorId ?? ""

      setSuccess(
        mode === "edit"
          ? "Aktoren er oppdatert og sendt inn pa nytt."
          : "Takk. Aktoren er sendt inn og venter pa godkjenning.",
      )

      if (mode === "create") {
        setActor(emptyActor)
        setRepairServices([emptyRepairService()])
        setSources([emptySource()])
        setSlugTouched(false)
        setCityOverride(false)
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
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link href="/auth/sign-in">Logg inn</Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/auth/sign-up">Registrer deg</Link>
      </Button>
    </div>
  )

  const loginPrompt = (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Logg inn for a sende inn en aktor til vurdering.</p>
      {loginActions}
    </div>
  )

  const formBody = (
    <div className={cn("grid gap-8", isDialog && "max-h-[70vh] overflow-y-auto p-1 pr-1")}>
      <div className="grid gap-6">
        <div>
          <p className="text-sm font-semibold">Grunninfo</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                placeholder="Navn pa aktor"
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
            <div className="sm:col-span-2 lg:col-span-3">
              <Label htmlFor="description">Kort beskrivelse</Label>
              <Textarea
                id="description"
                value={actor.description}
                onChange={(event) => updateActor("description", event.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Label htmlFor="longDescription">Lang beskrivelse</Label>
              <Textarea
                id="longDescription"
                value={actor.longDescription}
                onChange={(event) => updateActor("longDescription", event.target.value)}
                className="min-h-[160px]"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">Kontakt og geografi</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
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
                  updateActor("county", value)
                  if (actor.municipality) {
                    const nextMunicipalities = nextCountySlug ? getMunicipalitiesForCounty(nextCountySlug) : []
                    const stillValid = nextMunicipalities.some((municipality) => municipality.name === actor.municipality)
                    if (!stillValid) {
                      updateActor("municipality", "")
                      if (!cityOverride) {
                        updateActor("city", "")
                      }
                    } else if (!cityOverride) {
                      updateActor("city", actor.municipality)
                    }
                  }
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
                onValueChange={(value) => {
                  updateActor("municipality", value)
                  if (!cityOverride) {
                    updateActor("city", value)
                  }
                }}
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
                  {!municipalityOptions.some((municipality) => municipality.name === actor.municipality) &&
                  actor.municipality ? (
                    <SelectItem value={actor.municipality}>{actor.municipality}</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="city">By / sted</Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={cityOverride}
                    onCheckedChange={(checked) => {
                      const nextOverride = Boolean(checked)
                      setCityOverride(nextOverride)
                      if (!nextOverride) {
                        updateActor("city", actor.municipality || "")
                      }
                    }}
                  />
                  Annet sted / bydel
                </label>
              </div>
              <Input
                id="city"
                value={actor.city}
                onChange={(event) => updateActor("city", event.target.value)}
                placeholder={cityOverride ? "Oslo sentrum" : actor.municipality || "Velg kommune først"}
                disabled={!cityOverride && Boolean(actor.municipality)}
              />
              {!cityOverride && actor.municipality ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  By/sted følger valgt kommune. Slå på overstyring hvis du trenger et mer spesifikt sted.
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
              <Label htmlFor="area">Omrade (valgfritt)</Label>
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
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="flex items-center gap-3 rounded-md border border-input px-3 py-3 text-sm">
                <Checkbox checked={actor.nationwide} onCheckedChange={(value) => updateActor("nationwide", Boolean(value))} />
                <div>
                  <p className="font-medium">Landsdekkende tilbud</p>
                  <p className="text-xs text-muted-foreground">Kryss av hvis aktoren leverer utover ett lokalt nedslagsfelt.</p>
                </div>
              </label>
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Bilde</p>
          <div className="mt-3">
            <ImageUploadField id="image" value={actor.image} onChange={(value) => updateActor("image", value)} folder="actors" />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">Detaljer og innhold</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2">
              <Label>Apningstider</Label>
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
            <div className="sm:col-span-2 lg:col-span-3">
              <Label>Tags</Label>
              <TagInput value={actor.tags} onChange={(value) => updateActor("tags", value)} placeholder="Legg til og trykk Enter" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Label>Fordeler</Label>
              <TagInput value={actor.benefits} onChange={(value) => updateActor("benefits", value)} placeholder="Legg til og trykk Enter" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Label>Hvordan bruke</Label>
              <TagInput value={actor.howToUse} onChange={(value) => updateActor("howToUse", value)} placeholder="Legg til og trykk Enter" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-3">
            <Label>Reparasjonstjenester</Label>
            {!repairCategory && <Badge variant="secondary">Valgfritt</Badge>}
          </div>
          {!repairCategory && (
            <p className="mt-2 text-xs text-muted-foreground">Denne kategorien kan sendes inn uten reparasjonstjenester.</p>
          )}
          <div className="mt-2 grid gap-4">
            {repairServices.map((service, index) => (
              <Card key={`repair-${index}`} className="border border-dashed">
                <CardContent className="grid gap-4 pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Tjeneste {index + 1}</p>
                    {repairServices.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeRepairService(index)}>
                        Fjern
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label>Problemtype</Label>
                    <div className="mt-1">
                      <SearchableSelect
                        value={service.problemType}
                        onChange={(value) =>
                          setRepairServices((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, problemType: value } : item)),
                          )
                        }
                        placeholder="Velg problemtype"
                        options={problemTypes.map((option) => ({
                          value: option,
                          label: formatProblemTypeLabel(option),
                          keywords: option,
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Produktkategorier</Label>
                    <div className="mt-2">
                      <MultiSelect
                        value={service.itemTypes}
                        options={itemTypes}
                        getLabel={formatItemTypeLabel}
                        onChange={(value) =>
                          setRepairServices((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, itemTypes: value } : item)),
                          )
                        }
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
                        onChange={(event) =>
                          setRepairServices((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, priceMin: event.target.value } : item)),
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>Pris til (NOK)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={service.priceMax}
                        onChange={(event) =>
                          setRepairServices((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, priceMax: event.target.value } : item)),
                          )
                        }
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
                      onChange={(event) =>
                        setRepairServices((prev) =>
                          prev.map((item, idx) => (idx === index ? { ...item, etaDays: event.target.value } : item)),
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button type="button" variant="outline" className="mt-3" onClick={addRepairService}>
            Legg til tjeneste
          </Button>
        </div>

        <div>
          <Label>Kilder og dokumentasjon</Label>
          <div className="mt-2 grid gap-4">
            {sources.map((source, index) => (
              <Card key={`source-${index}`} className="border border-dashed">
                <CardContent className="grid gap-4 pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Kilde {index + 1}</p>
                    {sources.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSource(index)}>
                        Fjern
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={source.type}
                      onValueChange={(value) =>
                        setSources((prev) => prev.map((item, idx) => (idx === index ? { ...item, type: value } : item)))
                      }
                    >
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
                    <Input
                      value={source.title}
                      onChange={(event) =>
                        setSources((prev) => prev.map((item, idx) => (idx === index ? { ...item, title: event.target.value } : item)))
                      }
                    />
                  </div>
                  <div>
                    <Label>URL</Label>
                    <Input
                      type="url"
                      value={source.url}
                      onChange={(event) =>
                        setSources((prev) => prev.map((item, idx) => (idx === index ? { ...item, url: event.target.value } : item)))
                      }
                      placeholder="https://"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label>Dato (valgfritt)</Label>
                      <Input
                        type="date"
                        value={source.capturedAt}
                        onChange={(event) =>
                          setSources((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, capturedAt: event.target.value } : item)),
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label>Notat</Label>
                      <Input
                        value={source.note}
                        onChange={(event) =>
                          setSources((prev) => prev.map((item, idx) => (idx === index ? { ...item, note: event.target.value } : item)))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button type="button" variant="outline" className="mt-3" onClick={addSource}>
            Legg til kilde
          </Button>
        </div>
      </div>
    </div>
  )

  const formFooter = (
    <div className="grid gap-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-emerald-600">{success}</p>}

      {isDialog ? (
        <>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sender..." : submitLabel ?? (mode === "edit" ? "Oppdater aktor" : "Send inn aktor")}
            </Button>
          </DialogFooter>
          <span className="text-xs text-muted-foreground">
            Aktoren far status "pending" til den er godkjent av administrator.
          </span>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Sender..." : submitLabel ?? (mode === "edit" ? "Oppdater aktor" : "Send inn aktor")}
          </Button>
          <span className="text-xs text-muted-foreground">
            Aktoren far status "pending" til den er godkjent av administrator.
          </span>
        </div>
      )}
    </div>
  )

  const formContent = (
    <form onSubmit={handleSubmit} className={cn("grid gap-8 [&_label+*]:mt-2", isDialog && "gap-4")}>
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
        <CardHeader>
          <CardTitle>{headingTitle}</CardTitle>
          <CardDescription>Logg inn for a sende inn en aktor til vurdering.</CardDescription>
        </CardHeader>
        <CardContent>{loginActions}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{headingTitle}</CardTitle>
        <CardDescription>{headingDescription}</CardDescription>
      </CardHeader>
      <CardContent>{formContent}</CardContent>
    </Card>
  )
}
