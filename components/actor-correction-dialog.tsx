"use client"

import { useState } from "react"
import Link from "next/link"
import { Flag } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type ActorCorrectionDialogProps = {
  actor: {
    id: string
    name: string
    address: string
    postalCode?: string | null
    county?: string
    municipality?: string
    city?: string
    phone?: string | null
    email?: string | null
    website?: string | null
    openingHoursOsm?: string | null
  }
}

type FormState = {
  note: string
  sourceUrl: string
  address: string
  postalCode: string
  county: string
  municipality: string
  phone: string
  email: string
  website: string
  openingHoursOsm: string
}

const initialFormState: FormState = {
  note: "",
  sourceUrl: "",
  address: "",
  postalCode: "",
  county: "",
  municipality: "",
  phone: "",
  email: "",
  website: "",
  openingHoursOsm: "",
}

export function ActorCorrectionDialog({ actor }: ActorCorrectionDialogProps) {
  const { data } = authClient.useSession()
  const isSignedIn = Boolean(data?.session)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(initialFormState)
    setError(null)
    setSuccess(null)
  }

  const buildPayload = () => {
    const payload: Record<string, string> = {}

    if (form.address.trim() && form.address.trim() !== actor.address) payload.address = form.address.trim()
    if (form.postalCode.trim() && form.postalCode.trim() !== (actor.postalCode ?? "")) {
      payload.postalCode = form.postalCode.trim()
    }
    if (form.county.trim() && form.county.trim() !== (actor.county ?? "")) payload.county = form.county.trim()
    if (form.municipality.trim() && form.municipality.trim() !== (actor.municipality ?? "")) {
      payload.municipality = form.municipality.trim()
    }
    if (form.phone.trim() && form.phone.trim() !== (actor.phone ?? "")) payload.phone = form.phone.trim()
    if (form.email.trim() && form.email.trim() !== (actor.email ?? "")) payload.email = form.email.trim()
    if (form.website.trim() && form.website.trim() !== (actor.website ?? "")) payload.website = form.website.trim()
    if (form.openingHoursOsm.trim() && form.openingHoursOsm.trim() !== (actor.openingHoursOsm ?? "")) {
      payload.openingHoursOsm = form.openingHoursOsm.trim()
    }

    return payload
  }

  const submit = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const payload = buildPayload()

    try {
      const response = await fetch("/api/public/actor-corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorId: actor.id,
          note: form.note.trim(),
          sourceUrl: form.sourceUrl.trim() || undefined,
          payload,
        }),
      })

      const result = (await response.json()) as { error?: string }
      if (!response.ok) {
        throw new Error(result.error ?? "Kunne ikke sende inn korrekturforslaget.")
      }

      setSuccess("Takk. Forslaget er sendt til redaksjonell gjennomgang.")
      setForm(initialFormState)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Kunne ikke sende inn korrekturforslaget.")
    } finally {
      setSaving(false)
    }
  }

  if (!isSignedIn) {
    return (
      <Button variant="outline" asChild>
        <Link href="/auth/sign-in">
          <Flag className="mr-2 h-4 w-4" />
          Logg inn for a foresla korrigering
        </Link>
      </Button>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Flag className="mr-2 h-4 w-4" />
          Foresla korrigering
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Foresla korrigering for {actor.name}</DialogTitle>
          <DialogDescription>
            Send inn endringer du har oppdaget. Forslaget blir gjennomgatt av redaksjonen før det publiseres.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="correction-note">Hva er feil eller utdatert?</Label>
            <Textarea
              id="correction-note"
              value={form.note}
              onChange={(event) => updateField("note", event.target.value)}
              placeholder="Beskriv hva som bor oppdateres."
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="correction-source-url">Kilde til endringen</Label>
            <Input
              id="correction-source-url"
              value={form.sourceUrl}
              onChange={(event) => updateField("sourceUrl", event.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="correction-address">Ny adresse</Label>
              <Input
                id="correction-address"
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
                placeholder={actor.address}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="correction-postal-code">Postnummer</Label>
              <Input
                id="correction-postal-code"
                value={form.postalCode}
                onChange={(event) => updateField("postalCode", event.target.value)}
                placeholder={actor.postalCode ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="correction-municipality">Kommune</Label>
              <Input
                id="correction-municipality"
                value={form.municipality}
                onChange={(event) => updateField("municipality", event.target.value)}
                placeholder={actor.municipality ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="correction-county">Fylke</Label>
              <Input
                id="correction-county"
                value={form.county}
                onChange={(event) => updateField("county", event.target.value)}
                placeholder={actor.county ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="correction-phone">Telefon</Label>
              <Input
                id="correction-phone"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder={actor.phone ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="correction-email">E-post</Label>
              <Input
                id="correction-email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder={actor.email ?? ""}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="correction-website">Nettside</Label>
              <Input
                id="correction-website"
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
                placeholder={actor.website ?? ""}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="correction-opening-hours">Opening hours (OSM-format)</Label>
              <Input
                id="correction-opening-hours"
                value={form.openingHoursOsm}
                onChange={(event) => updateField("openingHoursOsm", event.target.value)}
                placeholder={actor.openingHoursOsm ?? "Mo-Fr 10:00-18:00"}
              />
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Lukk
            </Button>
            <Button onClick={submit} disabled={saving}>
              Send inn forslag
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
