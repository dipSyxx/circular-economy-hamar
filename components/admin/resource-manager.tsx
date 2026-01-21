"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ResourceManagerProps = {
  resourceKey: string
  label: string
  description?: string
  defaultPayload?: object
}

type AdminRow = Record<string, any>

const stripReadOnlyFields = (value: AdminRow) => {
  const data = { ...value }
  delete data.id
  delete data.createdAt
  delete data.updatedAt
  return data
}

const formatDisplay = (item: AdminRow) => {
  return (
    item.name ??
    item.title ??
    item.slug ??
    item.key ??
    item.level ??
    item.category ??
    item.itemType ??
    item.id ??
    "-"
  )
}

export function ResourceManager({ resourceKey, label, description, defaultPayload }: ResourceManagerProps) {
  const [items, setItems] = useState<AdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<"create" | "edit">("create")
  const [draft, setDraft] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/${resourceKey}`)
      if (!response.ok) {
        throw new Error(`Failed to load ${label}`)
      }
      const data = (await response.json()) as AdminRow[]
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
  }, [resourceKey])

  const filteredItems = useMemo(() => {
    if (!query) return items
    const lower = query.toLowerCase()
    return items.filter((item) => {
      const haystack = `${item.id ?? ""} ${formatDisplay(item)} ${item.key ?? ""} ${item.slug ?? ""}`.toLowerCase()
      return haystack.includes(lower)
    })
  }, [items, query])

  const openCreate = () => {
    setMode("create")
    setSelectedId(null)
    setDraft(JSON.stringify(defaultPayload ?? {}, null, 2))
    setDialogOpen(true)
  }

  const openEdit = (item: AdminRow) => {
    setMode("edit")
    setSelectedId(item.id)
    setDraft(JSON.stringify(item, null, 2))
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const parsed = JSON.parse(draft) as AdminRow
      const payload = stripReadOnlyFields(parsed)

      const response =
        mode === "create"
          ? await fetch(`/api/admin/${resourceKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/admin/${resourceKey}/${selectedId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })

      if (!response.ok) {
        throw new Error("Lagring feilet")
      }
      setDialogOpen(false)
      await loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: AdminRow) => {
    const confirmed = window.confirm(`Slette "${formatDisplay(item)}"?`)
    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/${resourceKey}/${item.id}`, { method: "DELETE" })
      if (!response.ok) {
        throw new Error("Sletting feilet")
      }
      await loadItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">{label}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={loadItems} disabled={loading}>
              Oppdater
            </Button>
            <Button onClick={openCreate}>Ny</Button>
          </div>
        </div>
        <div className="mt-3">
          <Input
            placeholder="Sok etter id, tittel eller nokkel"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Laster...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen data.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">ID</TableHead>
                <TableHead>Visning</TableHead>
                <TableHead className="w-[200px]">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell className="text-sm">{formatDisplay(item)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                        Rediger
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(item)}>
                        Slett
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? `Ny ${label}` : `Rediger ${label}`}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-[360px] font-mono text-xs"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Lagrer..." : "Lagre"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
