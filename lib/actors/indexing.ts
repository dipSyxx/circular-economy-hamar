import { formatCategoryLabel } from "@/lib/enum-labels"
import { getMunicipalityBySlug, norwayCounties } from "@/lib/geo"

export type ActorBrowseScopeRow = {
  countySlug: string
  municipalitySlug: string | null
  priority: number
}

type ActorBrowseIndexInput = {
  name: string
  category: string
  description: string
  address?: string | null
  county?: string | null
  countySlug?: string | null
  municipality?: string | null
  municipalitySlug?: string | null
  city?: string | null
  tags?: string[]
  nationwide?: boolean
  serviceAreaCountySlugs?: string[]
  serviceAreaMunicipalitySlugs?: string[]
}

const pushScope = (
  scopes: Map<string, ActorBrowseScopeRow>,
  countySlug: string | null | undefined,
  municipalitySlug: string | null,
  priority: number,
) => {
  if (!countySlug) return
  const key = `${countySlug}:${municipalitySlug ?? "*"}`.toLowerCase()
  const existing = scopes.get(key)
  if (!existing || priority < existing.priority) {
    scopes.set(key, { countySlug, municipalitySlug, priority })
  }
}

const toNonEmptyStrings = (values?: Array<string | null | undefined>) =>
  Array.from(new Set((values ?? []).map((value) => value?.trim()).filter(Boolean) as string[]))

export const buildActorSearchText = (input: ActorBrowseIndexInput) =>
  [
    input.name,
    formatCategoryLabel(input.category),
    input.description,
    input.address,
    input.county,
    input.municipality,
    input.city,
    ...(input.tags ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()

export const buildActorBrowseScopes = (input: ActorBrowseIndexInput): ActorBrowseScopeRow[] => {
  const scopes = new Map<string, ActorBrowseScopeRow>()
  const serviceAreaCountySlugs = toNonEmptyStrings(input.serviceAreaCountySlugs)
  const serviceAreaMunicipalitySlugs = toNonEmptyStrings(input.serviceAreaMunicipalitySlugs)

  if (input.countySlug) {
    pushScope(scopes, input.countySlug, null, 0)
  }

  if (input.countySlug && input.municipalitySlug) {
    pushScope(scopes, input.countySlug, input.municipalitySlug, 0)
  }

  for (const countySlug of serviceAreaCountySlugs) {
    pushScope(scopes, countySlug, null, 1)
  }

  for (const municipalitySlug of serviceAreaMunicipalitySlugs) {
    const municipality = getMunicipalityBySlug(municipalitySlug)
    if (!municipality) continue
    pushScope(scopes, municipality.countySlug, null, 1)
    pushScope(scopes, municipality.countySlug, municipality.slug, 1)
  }

  if (input.nationwide) {
    for (const county of norwayCounties) {
      pushScope(scopes, county.slug, null, 2)
    }
  }

  return Array.from(scopes.values()).sort((left, right) => {
    if (left.priority !== right.priority) return left.priority - right.priority
    if (left.countySlug !== right.countySlug) {
      return left.countySlug.localeCompare(right.countySlug, "no", { sensitivity: "base" })
    }
    return (left.municipalitySlug ?? "").localeCompare(right.municipalitySlug ?? "", "no", {
      sensitivity: "base",
    })
  })
}
