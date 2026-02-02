"use client"

import { useEffect, useMemo, useState, type KeyboardEvent } from "react"
import { CheckIcon, ChevronsUpDownIcon, Search, SlidersHorizontal, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddressSearchInput } from "@/components/address-search-input"
import { ImageUploadField } from "@/components/image-upload"
import { ITEM_TYPES, PROBLEM_TYPES } from "@/lib/prisma-enums"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  formatCategoryLabel,
  formatEnumLabel,
  formatItemTypeLabel,
  formatProblemTypeLabel,
} from "@/lib/enum-labels"
import { categoryOrder } from "@/lib/categories"

type ResourceManagerProps = {
  resourceKey: string
  label: string
  description?: string
  defaultPayload?: object
  allowIdOnCreate?: boolean
}

type AdminRow = Record<string, any>

type FieldKind = "string" | "number" | "boolean" | "array" | "object"

type FieldMeta = {
  kind: FieldKind
  arrayItemKind?: "string" | "number" | "boolean" | "object"
}

type LookupConfig = {
  resource: string
  labelFields: string[]
  searchFields: string[]
}

const READ_ONLY_FIELDS = new Set(["id", "createdAt", "updatedAt"])
const NONE_VALUE = "__none__"

const actorCategory = categoryOrder

const actorStatus = ["pending", "approved", "rejected", "archived"]
const sourceType = ["website", "social", "google_reviews", "article", "map"]
const itemType = ITEM_TYPES
const problemType = PROBLEM_TYPES
const priority = ["save_money", "save_time", "save_impact", "balanced"]
const recommendation = ["repair", "buy_used", "donate", "recycle"]
const decisionStatus = ["feasible", "not_fully_feasible"]
const confidenceLevel = ["low", "medium", "high"]
const actionType = ["decision_complete", "go_call", "go_directions", "go_website", "open_actor", "challenge_complete"]
const quizLevel = ["starter", "pa_vei", "gjenbrukshelt"]
const userRole = ["user", "admin"]

const enumOptionsByResource: Record<string, Record<string, ReadonlyArray<string>>> = {
  actors: {
    category: actorCategory,
    status: actorStatus,
  },
  challenges: {
    category: actorCategory,
  },
  "actor-repair-services": {
    problemType,
    itemTypes: itemType,
  },
  "actor-sources": {
    type: sourceType,
  },
  decisions: {
    itemType,
    problemType,
    recommendation,
    bestFeasibleOption: recommendation,
    priority,
    status: decisionStatus,
    confidence: confidenceLevel,
  },
  "repair-estimates": {
    itemType,
    problemType,
  },
  "co2e-source-items": {
    itemType,
  },
  "user-actions": {
    type: actionType,
  },
  "quiz-attempts": {
    level: quizLevel,
  },
  "quiz-results": {
    level: quizLevel,
  },
  users: {
    role: userRole,
  },
}

const lookupConfigByField: Record<string, LookupConfig> = {
  actorId: { resource: "actors", labelFields: ["name", "slug"], searchFields: ["name", "slug", "category"] },
  createdById: { resource: "users", labelFields: ["name", "email"], searchFields: ["name", "email", "id"] },
  reviewedById: { resource: "users", labelFields: ["name", "email"], searchFields: ["name", "email", "id"] },
  userId: { resource: "users", labelFields: ["name", "email"], searchFields: ["name", "email", "id"] },
  challengeId: { resource: "challenges", labelFields: ["title", "key"], searchFields: ["title", "key"] },
  questionId: { resource: "quiz-questions", labelFields: ["question", "key"], searchFields: ["question", "key"] },
  detailedFactId: { resource: "detailed-facts", labelFields: ["title", "key"], searchFields: ["title", "key", "category"] },
  sourceId: { resource: "co2e-sources", labelFields: ["title", "key"], searchFields: ["title", "key"] },
}

const actorFormSections = [
  {
    title: "Grunninfo",
    keys: ["name", "slug", "category", "description", "longDescription"],
  },
  {
    title: "Kontakt og plassering",
    keys: ["address", "lat", "lng", "phone", "email", "website", "instagram"],
  },
  {
    title: "Bilde",
    keys: ["image"],
    layout: "stack",
  },
  {
    title: "Detaljer og innhold",
    keys: ["openingHours", "openingHoursOsm", "tags", "benefits", "howToUse"],
  },
  {
    title: "Administrasjon",
    keys: ["status", "reviewNote", "createdById", "reviewedById", "reviewedAt"],
  },
  {
    title: "System",
    keys: ["id", "createdAt", "updatedAt"],
  },
]

const actorFieldOrder = actorFormSections.flatMap((section) => section.keys)

const getEnumOptions = (resourceKey: string, field: string) => {
  return enumOptionsByResource[resourceKey]?.[field]
}

const formatEnumValue = (field: string, value: string) => {
  if (field === "category") {
    return formatCategoryLabel(value)
  }
  if (field === "itemType" || field === "itemTypes") {
    return formatItemTypeLabel(value)
  }
  if (field === "problemType" || field === "problemTypes") {
    return formatProblemTypeLabel(value)
  }
  return formatEnumLabel(value)
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

const stripReadOnlyFields = (value: AdminRow, options?: { keepId?: boolean }) => {
  const data = { ...value }
  if (!options?.keepId) {
    delete data.id
  }
  delete data.createdAt
  delete data.updatedAt
  return data
}

const inferFieldMeta = (value: unknown): FieldMeta => {
  if (Array.isArray(value)) {
    const sample = value.find((item) => item !== null && item !== undefined)
    const arrayItemKind =
      typeof sample === "number"
        ? "number"
        : typeof sample === "boolean"
          ? "boolean"
          : typeof sample === "object"
            ? "object"
            : "string"
    return { kind: "array", arrayItemKind }
  }
  if (typeof value === "number") return { kind: "number" }
  if (typeof value === "boolean") return { kind: "boolean" }
  if (typeof value === "object" && value !== null) return { kind: "object" }
  return { kind: "string" }
}

const formatInputValue = (value: unknown, meta: FieldMeta) => {
  if (meta.kind === "array") {
    if (typeof value === "string") return value
    if (!Array.isArray(value)) return ""
    return JSON.stringify(value, null, 2)
  }
  if (meta.kind === "object") {
    if (typeof value === "string") return value
    if (!value) return ""
    return JSON.stringify(value, null, 2)
  }
  if (meta.kind === "number") {
    if (value === null || value === undefined) return ""
    return String(value)
  }
  if (meta.kind === "boolean") {
    return Boolean(value)
  }
  if (value === null || value === undefined) return ""
  return String(value)
}

const parseFieldValue = (
  key: string,
  value: unknown,
  meta: FieldMeta,
): { value: unknown; error?: string } => {
  if (meta.kind === "number") {
    if (value === "" || value === null || value === undefined) return { value: null }
    const parsed = typeof value === "number" ? value : Number(value)
    if (Number.isNaN(parsed)) return { value, error: `Ugyldig tall for ${key}` }
    return { value: parsed }
  }

  if (meta.kind === "boolean") {
    if (typeof value === "boolean") return { value }
    if (value === "true") return { value: true }
    if (value === "false") return { value: false }
    return { value: Boolean(value) }
  }

  if (meta.kind === "array") {
    if (Array.isArray(value)) return { value }
    const raw = typeof value === "string" ? value.trim() : ""
    if (!raw) return { value: [] }

    if (raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return { value: parsed }
      } catch (error) {
        return { value, error: `Ugyldig JSON-liste for ${key}` }
      }
    }

    const rows = raw.split(/\r?\n/).map((row) => row.trim()).filter(Boolean)
    if (meta.arrayItemKind === "number") {
      const parsed = rows.map((row) => Number(row))
      if (parsed.some((item) => Number.isNaN(item))) {
        return { value, error: `Ugyldig tall-liste for ${key}` }
      }
      return { value: parsed }
    }
    if (meta.arrayItemKind === "boolean") {
      return { value: rows.map((row) => row.toLowerCase() === "true") }
    }
    if (meta.arrayItemKind === "object") {
      try {
        return {
          value: rows.map((row) => (row.startsWith("{") ? JSON.parse(row) : row)),
        }
      } catch (error) {
        return { value, error: `Ugyldig JSON-liste for ${key}` }
      }
    }
    return { value: rows }
  }

  if (meta.kind === "object") {
    if (value === null || value === undefined || value === "") return { value: null }
    if (typeof value === "object") return { value }
    const raw = String(value).trim()
    if (!raw) return { value: null }
    if (!raw.startsWith("{") && !raw.startsWith("[")) {
      return { value, error: `Ugyldig JSON for ${key}` }
    }
    try {
      return { value: JSON.parse(raw) }
    } catch (error) {
      return { value, error: `Ugyldig JSON for ${key}` }
    }
  }

  if (value === null || value === undefined) return { value: null }
  return { value: String(value) }
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
    item.email ??
    item.userId ??
    item.id ??
    "-"
  )
}

const isLongTextField = (key: string, value: unknown) => {
  if (key === "openingHoursOsm") return false
  if (typeof value === "string" && value.length > 120) return true
  return /description|content|explainability|howToUse|openingHours|benefits|tips|note|image/i.test(key)
}

const truncate = (value: string, limit = 80) => {
  if (!value) return "-"
  return value.length > limit ? `${value.slice(0, limit - 3)}...` : value
}

const formatColumnLabel = (key: string) => {
  if (lookupConfigByField[key]) {
    return key.replace(/Id$/, "")
  }
  return key
}

const formatFilterValue = (resourceKey: string, field: string, value: string | boolean | null | undefined) => {
  if (value === null || value === undefined || value === "") return ""
  const enumOptions = getEnumOptions(resourceKey, field)
  if (enumOptions && typeof value === "string") {
    return formatEnumValue(field, value)
  }
  if (typeof value === "boolean") {
    return value ? "True" : "False"
  }
  return String(value)
}

const normalizeSearchValue = (value: unknown): string => {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(normalizeSearchValue).join(" ")
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(normalizeSearchValue)
      .join(" ")
  }
  return ""
}

const toTimestamp = (value: unknown, key: string) => {
  if (value instanceof Date) return value.getTime()
  if (typeof value === "string" && key.endsWith("At")) {
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return null
}

const compareValues = (left: unknown, right: unknown, key: string) => {
  if (left === null || left === undefined) {
    if (right === null || right === undefined) return 0
    return 1
  }
  if (right === null || right === undefined) return -1

  if (typeof left === "number" && typeof right === "number") return left - right
  if (typeof left === "boolean" && typeof right === "boolean") {
    return left === right ? 0 : left ? 1 : -1
  }

  const leftDate = toTimestamp(left, key)
  const rightDate = toTimestamp(right, key)
  if (leftDate !== null && rightDate !== null) return leftDate - rightDate

  const leftText = normalizeSearchValue(left).toLowerCase()
  const rightText = normalizeSearchValue(right).toLowerCase()
  return leftText.localeCompare(rightText, undefined, { numeric: true, sensitivity: "base" })
}

type TagInputProps = {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
}

function TagInput({ value, onChange, placeholder, disabled }: TagInputProps) {
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
    if (disabled) return
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
    if (disabled) return
    if (!inputValue) return
    addTag(inputValue)
    setInputValue("")
  }

  return (
    <div className={cn("rounded-md border border-input bg-background px-2 py-2", disabled && "opacity-70")}>
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            <span className="truncate">{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">Fjern</span>
                <XIcon className="size-3" />
              </button>
            )}
          </Badge>
        ))}
        {!disabled && (
          <Input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="h-7 w-[160px] border-none bg-transparent px-1 py-0 text-sm shadow-none focus-visible:ring-0"
          />
        )}
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

function MultiSelect({ value, options, getLabel, onChange, disabled }: MultiSelectProps) {
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
              disabled && "opacity-70",
            )}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(next) => toggle(option, Boolean(next))}
              disabled={disabled}
            />
            <span>{label}</span>
          </label>
        )
      })}
    </div>
  )
}

type SearchSelectProps = {
  value: string | null
  options: AdminRow[]
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  onChange: (value: string | null) => void
  getLabel: (item: AdminRow) => string
  getSearchValue: (item: AdminRow) => string
}

function SearchSelect({
  value,
  options,
  placeholder,
  disabled,
  loading,
  onChange,
  getLabel,
  getSearchValue,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((item) => item.id === value)
  const selectedLabel = selected ? getLabel(selected) : ""
  const displayLabel = selectedLabel || ""

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled || loading}
          className="w-full justify-between"
        >
          <span className={cn("truncate text-left", !displayLabel && "text-muted-foreground")}>
            {loading ? "Laster..." : displayLabel || placeholder || "Velg"}
          </span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Søk..." />
          <CommandList>
            <CommandEmpty>{loading ? "Laster..." : "Ingen treff."}</CommandEmpty>
            <CommandGroup>
              {!disabled && value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                >
                  <span className="text-muted-foreground">Fjern valg</span>
                </CommandItem>
              )}
              {options.map((item) => {
                const label = getLabel(item)
                const searchValue = `${label} ${getSearchValue(item)}`.trim()
                const isSelected = item.id === value
                return (
                  <CommandItem
                    key={item.id}
                    value={searchValue}
                    onSelect={() => {
                      onChange(item.id ?? null)
                      setOpen(false)
                    }}
                  >
                    <CheckIcon className={cn("size-4", isSelected ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ResourceManager({
  resourceKey,
  label,
  description,
  defaultPayload,
  allowIdOnCreate = false,
}: ResourceManagerProps) {
  const [items, setItems] = useState<AdminRow[]>([])
  const [lookups, setLookups] = useState<Record<string, AdminRow[]>>({})
  const [loading, setLoading] = useState(true)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mode, setMode] = useState<"create" | "edit">("create")
  const [draft, setDraft] = useState<AdminRow>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, string | boolean | null>>({})
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("no-NO", { dateStyle: "medium", timeStyle: "short" }),
    [],
  )

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

  useEffect(() => {
    setFilters({})
    setFiltersOpen(false)
    setSortKey(null)
    setSortDirection("asc")
  }, [resourceKey])

  const columnKeys = useMemo(() => {
    const keys = new Set<string>()
    items.forEach((item) => {
      Object.keys(item).forEach((key) => keys.add(key))
    })
    if (defaultPayload) {
      Object.keys(defaultPayload).forEach((key) => keys.add(key))
    }
    const pinned = ["id", "createdAt", "updatedAt"]
    const rest = Array.from(keys).filter((key) => !pinned.includes(key)).sort()
    return [...pinned.filter((key) => keys.has(key)), ...rest]
  }, [items, defaultPayload])

  const formKeys = useMemo(() => {
    let baseKeys: string[] = []
    if (!columnKeys.length && defaultPayload) {
      baseKeys = Object.keys(defaultPayload)
    } else {
      const readOnly = columnKeys.filter((key) => READ_ONLY_FIELDS.has(key))
      const editable = columnKeys.filter((key) => !READ_ONLY_FIELDS.has(key))
      baseKeys = [...editable, ...readOnly]
    }

    if (resourceKey !== "actors") {
      return baseKeys
    }

    const remaining = baseKeys.filter((key) => !actorFieldOrder.includes(key))
    return [...actorFieldOrder, ...remaining]
  }, [columnKeys, defaultPayload, resourceKey])

  const fieldMeta = useMemo(() => {
    const meta: Record<string, FieldMeta> = {}
    const consider = (key: string, value: unknown) => {
      if (value === null || value === undefined) return
      if (!meta[key]) {
        meta[key] = inferFieldMeta(value)
      }
    }
    items.forEach((item) => {
      Object.entries(item).forEach(([key, value]) => consider(key, value))
    })
    if (defaultPayload) {
      Object.entries(defaultPayload).forEach(([key, value]) => consider(key, value))
    }
    return meta
  }, [items, defaultPayload])

  const columnKeyLookup = useMemo(() => {
    const map = new Map<string, string>()
    columnKeys.forEach((key) => map.set(key.toLowerCase(), key))
    return map
  }, [columnKeys])

  const enumFilterFields = useMemo(() => {
    const resourceEnums = enumOptionsByResource[resourceKey] ?? {}
    return Object.keys(resourceEnums).filter((field) => columnKeys.includes(field))
  }, [resourceKey, columnKeys])

  const booleanFilterFields = useMemo(() => {
    return columnKeys.filter((key) => fieldMeta[key]?.kind === "boolean")
  }, [columnKeys, fieldMeta])

  const hasFilters = enumFilterFields.length > 0 || booleanFilterFields.length > 0

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(
      (value) => value !== null && value !== undefined && value !== "",
    ).length
  }, [filters])

  const activeFilterEntries = useMemo(() => {
    return Object.entries(filters).filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    )
  }, [filters])

  const hasSearch = query.trim().length > 0
  const hasAnyFilter = activeFilterCount > 0 || hasSearch

  const lookupResources = useMemo(() => {
    const resources = new Set<string>()
    const keys = new Set([...columnKeys, ...formKeys])
    keys.forEach((key) => {
      const config = lookupConfigByField[key]
      if (config) {
        resources.add(config.resource)
      }
    })
    return Array.from(resources)
  }, [columnKeys, formKeys])

  const refreshLookups = async () => {
    if (!lookupResources.length) return
    setLookupLoading(true)
    try {
      const responses = await Promise.all(
        lookupResources.map(async (resource) => {
          const response = await fetch(`/api/admin/${resource}`)
          if (!response.ok) return { resource, items: [] }
          const items = (await response.json()) as AdminRow[]
          return { resource, items }
        }),
      )
      setLookups((prev) => {
        const next = { ...prev }
        responses.forEach(({ resource, items }) => {
          next[resource] = items
        })
        return next
      })
    } finally {
      setLookupLoading(false)
    }
  }

  useEffect(() => {
    void refreshLookups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupResources.join("|")])

  const getFieldSearchValue = (item: AdminRow, key: string) => {
    if (lookupConfigByField[key]) {
      const label = resolveLookupLabel(key, item[key])
      if (label) return String(label)
    }
    return normalizeSearchValue(item[key])
  }

  const matchesSearchToken = (item: AdminRow, token: string, searchText: string) => {
    const match = token.match(/^([^:=]+)[:=](.+)$/)
    if (match) {
      const field = match[1]
      const term = match[2]
      const normalizedField = columnKeyLookup.get(field)
      if (normalizedField) {
        const fieldValue = getFieldSearchValue(item, normalizedField).toLowerCase()
        return fieldValue.includes(term)
      }
    }
    return searchText.includes(token)
  }

  const searchedItems = useMemo(() => {
    const trimmed = query.trim()
    if (!trimmed) return items
    const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean)
    if (!tokens.length) return items

    return items.filter((item) => {
      const searchText = columnKeys
        .map((key) => getFieldSearchValue(item, key))
        .join(" ")
        .toLowerCase()
      return tokens.every((token) => matchesSearchToken(item, token, searchText))
    })
  }, [items, query, columnKeys, columnKeyLookup, lookups])

  const filteredItems = useMemo(() => {
    if (!hasFilters || activeFilterCount === 0) return searchedItems
    return searchedItems.filter((item) => {
      return Object.entries(filters).every(([field, filterValue]) => {
        if (filterValue === null || filterValue === undefined || filterValue === "") return true
        const value = item[field]
        const meta = fieldMeta[field]
        if (meta?.kind === "array") {
          if (!Array.isArray(value)) return false
          return value.map((entry) => String(entry)).includes(String(filterValue))
        }
        if (typeof filterValue === "boolean") {
          return value === filterValue
        }
        return String(value ?? "") === String(filterValue)
      })
    })
  }, [searchedItems, filters, fieldMeta, hasFilters, activeFilterCount])

  const sortedItems = useMemo(() => {
    if (!sortKey) return filteredItems
    const sorted = [...filteredItems].sort((left, right) =>
      compareValues(left[sortKey], right[sortKey], sortKey),
    )
    return sortDirection === "asc" ? sorted : sorted.reverse()
  }, [filteredItems, sortKey, sortDirection])

  const buildDraft = (source: AdminRow, defaults?: object) => {
    const base = { ...(defaults ?? {}), ...(source ?? {}) }
    if (!formKeys.length) return base
    const next: AdminRow = {}
    for (const key of formKeys) {
      next[key] = base[key]
    }
    return next
  }

  function resolveLookupLabel(field: string, value: unknown) {
    if (typeof value !== "string") return null
    const config = lookupConfigByField[field]
    if (!config) return null
    const options = lookups[config.resource] ?? []
    const match = options.find((item) => item.id === value)
    if (!match) return "Ukjent"
    for (const fieldKey of config.labelFields) {
      if (match[fieldKey]) {
        return String(match[fieldKey])
      }
    }
    return match.id ?? "Ukjent"
  }

  function getLookupLabel(resource: string, item: AdminRow) {
    const config = Object.values(lookupConfigByField).find((entry) => entry.resource === resource)
    const labelFields = config?.labelFields ?? ["title", "name", "key", "slug", "email"]
    for (const fieldKey of labelFields) {
      if (item[fieldKey]) {
        return String(item[fieldKey])
      }
    }
    return String(item.id ?? "Ukjent")
  }

  function getLookupSearchValue(resource: string, item: AdminRow) {
    const config = Object.values(lookupConfigByField).find((entry) => entry.resource === resource)
    const searchFields = config?.searchFields ?? ["title", "name", "key", "slug", "email", "id"]
    return searchFields.map((field) => item[field]).filter(Boolean).join(" ")
  }

  const formatCellValue = (key: string, value: unknown) => {
    if (lookupConfigByField[key]) {
      return resolveLookupLabel(key, value) ?? "Ukjent"
    }
    const enumOptions = getEnumOptions(resourceKey, key)
    if (Array.isArray(value)) {
      if (enumOptions) {
        return value.map((item) => formatEnumValue(key, String(item))).join(", ")
      }
      return value.map((item) => String(item)).join(", ")
    }
    if (enumOptions && typeof value === "string") {
      return formatEnumValue(key, value)
    }
    if (typeof value === "boolean") {
      return value ? "true" : "false"
    }
    if (value === null || value === undefined || value === "") {
      return "-"
    }
    if (typeof value === "object") {
      return JSON.stringify(value)
    }
    if (typeof value === "string" && key.endsWith("At")) {
      const parsed = new Date(value)
      if (!Number.isNaN(parsed.getTime())) {
        return dateFormatter.format(parsed)
      }
    }
    return String(value)
  }

  const openCreate = () => {
    setMode("create")
    setSelectedId(null)
    setDraft(buildDraft({}, defaultPayload))
    setSlugTouched(false)
    setDialogOpen(true)
  }

  const openEdit = (item: AdminRow) => {
    setMode("edit")
    setSelectedId(item.id ?? null)
    setDraft(buildDraft(item, defaultPayload))
    setSlugTouched(true)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payloadSource = stripReadOnlyFields(draft, { keepId: mode === "create" && allowIdOnCreate })
      const payload: AdminRow = {}

      for (const key of Object.keys(payloadSource)) {
        const meta = fieldMeta[key] ?? { kind: "string" }
        const result = parseFieldValue(key, payloadSource[key], meta)
        if (result.error) {
          setError(result.error)
          setSaving(false)
          return
        }
        payload[key] = result.value
      }

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
      await refreshLookups()
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
      await refreshLookups()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil")
    }
  }

  const handleSortToggle = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const clearFilters = () => {
    setFilters({})
  }

  const clearAllFilters = () => {
    setQuery("")
    clearFilters()
  }

  const isActorResource = resourceKey === "actors"
  const actorExtraKeys = isActorResource ? formKeys.filter((key) => !actorFieldOrder.includes(key)) : []

  const renderField = (key: string) => {
    const meta = fieldMeta[key] ?? { kind: "string" }
    const value = draft[key]
    const enumOptions = getEnumOptions(resourceKey, key)
    const enumOptionItems = enumOptions
      ? enumOptions.map((option) => ({
          value: option,
          label: formatEnumValue(key, option),
          keywords: option,
        }))
      : []
    const useSearchableSelect = Boolean(enumOptions && enumOptions.length > 8)
      const lookupConfig = lookupConfigByField[key]
      const isEditableId = allowIdOnCreate && mode === "create" && key === "id"
      const isReadOnly = READ_ONLY_FIELDS.has(key) && !isEditableId
      const isMultiline = meta.kind === "array" || meta.kind === "object" || isLongTextField(key, value)
      const isActorNameField = isActorResource && key === "name" && meta.kind === "string"
      const isActorSlugField = isActorResource && key === "slug" && meta.kind === "string"

    const commonProps = {
      id: key,
      name: key,
      disabled: isReadOnly,
    }

    return (
      <div key={key} className={isMultiline ? "sm:col-span-2 lg:col-span-3" : ""}>
        <Label htmlFor={key} className="text-sm">
          {key}
        </Label>
        <div className="mt-2">
          {lookupConfig ? (
            <SearchSelect
              value={typeof value === "string" ? value : null}
              options={lookups[lookupConfig.resource] ?? []}
              loading={lookupLoading && !(lookups[lookupConfig.resource] ?? []).length}
              onChange={(next) => setDraft((prev) => ({ ...prev, [key]: next }))}
              disabled={isReadOnly}
              getLabel={(item) => getLookupLabel(lookupConfig.resource, item)}
              getSearchValue={(item) => getLookupSearchValue(lookupConfig.resource, item)}
              placeholder={`Velg ${formatColumnLabel(key)}`}
            />
          ) : enumOptions && meta.kind !== "array" ? (
            useSearchableSelect ? (
              <SearchableSelect
                value={typeof value === "string" ? value : NONE_VALUE}
                onChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    [key]: next === NONE_VALUE ? null : next,
                  }))
                }
                options={[
                  { value: NONE_VALUE, label: "Ingen", keywords: "none" },
                  ...enumOptionItems,
                ]}
                placeholder={`Velg ${formatColumnLabel(key)}`}
                disabled={isReadOnly}
              />
            ) : (
              <Select
                value={typeof value === "string" ? value : NONE_VALUE}
                onValueChange={(next) =>
                  setDraft((prev) => ({
                    ...prev,
                    [key]: next === NONE_VALUE ? null : next,
                  }))
                }
                disabled={isReadOnly}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Velg ${key}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>Ingen</SelectItem>
                  {enumOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {formatEnumValue(key, option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          ) : enumOptions && meta.kind === "array" ? (
            <MultiSelect
              value={Array.isArray(value) ? value : []}
              options={enumOptions}
              getLabel={(option) => formatEnumValue(key, option)}
              onChange={(next) => setDraft((prev) => ({ ...prev, [key]: next }))}
              disabled={isReadOnly}
            />
          ) : meta.kind === "boolean" ? (
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(value)}
                onCheckedChange={(checked) => {
                  if (isReadOnly) return
                  setDraft((prev) => ({ ...prev, [key]: checked }))
                }}
                disabled={isReadOnly}
              />
              <span className="text-xs text-muted-foreground">{Boolean(value) ? "true" : "false"}</span>
            </div>
          ) : meta.kind === "array" && meta.arrayItemKind === "string" ? (
            <TagInput
              value={Array.isArray(value) ? value : []}
              onChange={(next) => setDraft((prev) => ({ ...prev, [key]: next }))}
              disabled={isReadOnly}
              placeholder="Legg til og trykk Enter"
            />
          ) : key === "address" && meta.kind === "string" ? (
            <AddressSearchInput
              id={key}
              name={key}
              value={formatInputValue(value, meta) as string}
              onChange={(next) => setDraft((prev) => ({ ...prev, [key]: next }))}
              onCoordinates={(coords) =>
                setDraft((prev) => {
                  const hasLat = Object.prototype.hasOwnProperty.call(prev, "lat")
                  const hasLng = Object.prototype.hasOwnProperty.call(prev, "lng")
                  if (!hasLat && !hasLng) return prev
                  return {
                    ...prev,
                    ...(hasLat ? { lat: coords.lat } : {}),
                    ...(hasLng ? { lng: coords.lng } : {}),
                  }
                })
              }
              disabled={isReadOnly}
              placeholder="Søk adresse"
            />
          ) : key === "image" && meta.kind === "string" ? (
            <ImageUploadField
              id={key}
              value={typeof value === "string" ? value : ""}
              onChange={(next) => setDraft((prev) => ({ ...prev, [key]: next }))}
              disabled={isReadOnly}
              folder={resourceKey}
            />
          ) : meta.kind === "object" || isMultiline ? (
            <Textarea
              {...commonProps}
              value={formatInputValue(value, meta) as string}
              onChange={(event) => setDraft((prev) => ({ ...prev, [key]: event.target.value }))}
              className="min-h-[140px] font-mono text-xs"
            />
            ) : (
              <Input
                {...commonProps}
                type={meta.kind === "number" ? "number" : "text"}
                value={formatInputValue(value, meta) as string}
                onChange={(event) => {
                  const nextValue = event.target.value
                  if (meta.kind === "number") {
                    setDraft((prev) => ({
                      ...prev,
                      [key]: nextValue === "" ? null : Number(nextValue),
                    }))
                    return
                  }
                  if (isActorSlugField) {
                    setSlugTouched(true)
                  }
                  setDraft((prev) => {
                    const nextDraft = {
                      ...prev,
                      [key]: nextValue,
                    }
                    if (isActorNameField && !slugTouched) {
                      nextDraft.slug = slugify(nextValue)
                    }
                    return nextDraft
                  })
                }}
              />
            )}
        </div>
      </div>
    )
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
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Sok etter felt, eller bruk felt:verdi"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9 pr-9"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:text-foreground"
                aria-label="Fjern sok"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={sortKey ?? NONE_VALUE}
              onValueChange={(next) => {
                if (next === NONE_VALUE) {
                  setSortKey(null)
                  return
                }
                setSortKey(next)
                setSortDirection("asc")
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sorter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Standard</SelectItem>
                {columnKeys.map((key) => (
                  <SelectItem key={key} value={key}>
                    {formatColumnLabel(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
              disabled={!sortKey}
            >
              {sortDirection === "asc" ? "Asc" : "Desc"}
            </Button>
            {hasFilters && (
              <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <SlidersHorizontal className="size-4" />
                    Filtre
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-4" align="end">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Filtre</span>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Nullstill
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3">
                    {enumFilterFields.map((field) => {
                      const options = enumOptionsByResource[resourceKey]?.[field] ?? []
                      return (
                        <div key={field}>
                          <Label className="text-xs">{formatColumnLabel(field)}</Label>
                          <Select
                            value={
                              typeof filters[field] === "string" && filters[field]
                                ? String(filters[field])
                                : NONE_VALUE
                            }
                            onValueChange={(next) =>
                              setFilters((prev) => ({
                                ...prev,
                                [field]: next === NONE_VALUE ? null : next,
                              }))
                            }
                          >
                            <SelectTrigger className="mt-1 w-full">
                              <SelectValue placeholder={`Alle ${formatColumnLabel(field)}`} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_VALUE}>Alle</SelectItem>
                              {options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {formatEnumValue(field, option)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    })}
                    {booleanFilterFields.map((field) => (
                      <div key={field}>
                        <Label className="text-xs">{formatColumnLabel(field)}</Label>
                        <Select
                          value={
                            filters[field] === null || filters[field] === undefined
                              ? NONE_VALUE
                              : String(filters[field])
                          }
                          onValueChange={(next) =>
                            setFilters((prev) => ({
                              ...prev,
                              [field]: next === NONE_VALUE ? null : next === "true",
                            }))
                          }
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue placeholder={`Alle ${formatColumnLabel(field)}`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE_VALUE}>Alle</SelectItem>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Viser {sortedItems.length} av {items.length}
          </span>
          {hasAnyFilter && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Nullstill alt
            </Button>
          )}
        </div>
        {hasAnyFilter && (
          <div className="mt-2 flex flex-wrap gap-2">
            {hasSearch && (
              <Badge variant="outline" className="gap-1">
                Sok: {query}
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Fjern sok"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            )}
            {activeFilterEntries.map(([field, value]) => (
              <Badge key={field} variant="outline" className="gap-1">
                {formatColumnLabel(field)}: {formatFilterValue(resourceKey, field, value as string | boolean)}
                <button
                  type="button"
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      [field]: null,
                    }))
                  }
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Fjern ${formatColumnLabel(field)}`}
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        {loading ? (
          <p className="text-sm text-muted-foreground">Laster...</p>
        ) : sortedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen data.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnKeys.map((key) => (
                    <TableHead key={key} className="whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleSortToggle(key)}
                        className="inline-flex items-center gap-2 text-left hover:text-foreground"
                      >
                        <span>{formatColumnLabel(key)}</span>
                        {sortKey === key && (
                          <span className="text-xs text-muted-foreground">
                            {sortDirection === "asc" ? "Asc" : "Desc"}
                          </span>
                        )}
                      </button>
                    </TableHead>
                  ))}
                  <TableHead className="sticky right-0 bg-background text-right whitespace-nowrap">
                    Handling
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item, index) => {
                  const rowKey = item.id ?? `${resourceKey}-${index}`
                  return (
                    <TableRow key={rowKey} className="group">
                      {columnKeys.map((key) => {
                        const cellValue = formatCellValue(key, item[key])
                        const displayValue = truncate(cellValue)
                        return (
                          <TableCell key={key} className="max-w-[240px] truncate" title={cellValue}>
                            {displayValue}
                          </TableCell>
                        )
                      })}
                      <TableCell className="sticky right-0 bg-background text-right">
                        <div className="flex flex-wrap justify-end gap-2 opacity-0 pointer-events-none transition group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
                          <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                            Rediger
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(item)}>
                            Slett
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-7xl w-[98vw] sm:max-w-7xl">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? `Ny ${label}` : `Rediger ${label}`}</DialogTitle>
            <DialogDescription>Oppdater feltene og lagre endringer.</DialogDescription>
          </DialogHeader>
          {isActorResource ? (
            <div className="grid max-h-[70vh] gap-6 overflow-y-auto p-1 pr-1">
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
          ) : (
            <div className="grid max-h-[70vh] p-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              {formKeys.map((key) => renderField(key))}
            </div>
          )}
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



