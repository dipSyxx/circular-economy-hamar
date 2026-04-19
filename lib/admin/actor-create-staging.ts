import type { ActorCategory, ItemType, ProblemType, SourceType } from "@prisma/client"
import { supportsRepairServices } from "@/lib/categories"
import { validateRepairServiceAgainstScope } from "@/lib/category-repair-scope"
import { assertRepairServicesAllowed } from "@/lib/actor-write"

export type AdminStagedSource = {
  type: string
  title: string
  url: string
  capturedAt: string
  note: string
}

export type AdminStagedRepair = {
  problemType: string
  itemTypes: string[]
  priceMin: string
  priceMax: string
  etaDays: string
}

export const emptyAdminStagedRepair = (): AdminStagedRepair => ({
  problemType: "",
  itemTypes: [],
  priceMin: "",
  priceMax: "",
  etaDays: "",
})

export const emptyAdminStagedSource = (): AdminStagedSource => ({
  type: "website",
  title: "",
  url: "",
  capturedAt: "",
  note: "",
})

const ensureString = (value: unknown) => (typeof value === "string" ? value.trim() : "")

const ensureStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value.map((entry) => String(entry).trim()).filter(Boolean)
}

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const parseDate = (value: unknown) => {
  if (typeof value !== "string" || !value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export type ParsedAdminRepairService = {
  problemType: ProblemType
  itemTypes: ItemType[]
  priceMin: number
  priceMax: number | null
  etaDays: number | null
}

export type ParsedAdminSource = {
  type: SourceType
  title: string
  url: string
  capturedAt: Date | null
  note: string | null
}

/**
 * Parses optional nested repair services + sources from admin actor create body.
 * Empty draft rows are dropped. If the user adds any repair row, at least one valid source is required.
 * If the category supports repair and the user adds any source row, at least one valid repair row is required.
 */
export function parseAdminActorNestedRelations(
  category: ActorCategory,
  repairServicesRaw: unknown,
  sourcesRaw: unknown,
): { repairServices: ParsedAdminRepairService[]; sources: ParsedAdminSource[] } {
  const repairServicesInput = Array.isArray(repairServicesRaw) ? repairServicesRaw : []
  const sourcesInput = Array.isArray(sourcesRaw) ? sourcesRaw : []

  const repairServices = repairServicesInput
    .filter((service) =>
      typeof service === "object" && service !== null
        ? Object.values(service as Record<string, unknown>).some((value) => value !== null && value !== "")
        : false,
    )
    .map((service, index) => {
      const row = service as Record<string, unknown>
      const problemType = ensureString(row.problemType) as ProblemType
      const itemTypes = ensureStringArray(row.itemTypes) as ItemType[]
      const priceMin = toNumber(row.priceMin)
      const priceMax = toNumber(row.priceMax)

      if (!problemType) {
        throw new Error(`Tjeneste #${index + 1} mangler problemtype.`)
      }
      if (!itemTypes.length) {
        throw new Error(`Tjeneste #${index + 1} må ha minst én varetype.`)
      }
      if (priceMin === null) {
        throw new Error(`Tjeneste #${index + 1} må ha prisområde.`)
      }
      if (priceMax !== null && priceMin > priceMax) {
        throw new Error(`Tjeneste #${index + 1} har ugyldig prisområde.`)
      }

      return {
        problemType,
        itemTypes,
        priceMin,
        priceMax,
        etaDays: toNumber(row.etaDays),
      }
    })

  const sources = sourcesInput
    .filter((source) =>
      typeof source === "object" && source !== null
        ? Object.values(source as Record<string, unknown>).some((value) => value !== null && value !== "")
        : false,
    )
    .map((source, index) => {
      const row = source as Record<string, unknown>
      const type = ensureString(row.type) as SourceType
      const title = ensureString(row.title)
      const url = ensureString(row.url)

      if (!type) {
        throw new Error(`Kilde #${index + 1} mangler type.`)
      }
      if (!title) {
        throw new Error(`Kilde #${index + 1} mangler tittel.`)
      }
      if (!url) {
        throw new Error(`Kilde #${index + 1} mangler URL.`)
      }

      return {
        type,
        title,
        url,
        capturedAt: parseDate(row.capturedAt),
        note: ensureString(row.note) || null,
      }
    })

  assertRepairServicesAllowed(category, repairServices)

  const hasRepairs = repairServices.length > 0
  const hasSources = sources.length > 0

  if (hasRepairs && !hasSources) {
    throw new Error("Legg til minst én kilde når du legger til reparasjonstjenester.")
  }

  if (supportsRepairServices(category) && hasSources && !hasRepairs) {
    throw new Error("Legg til minst én reparasjonstjeneste for denne kategorien, eller fjern kildene.")
  }

  for (let i = 0; i < repairServices.length; i++) {
    const scopeError = validateRepairServiceAgainstScope(category, repairServices[i].problemType, repairServices[i].itemTypes)
    if (scopeError) {
      throw new Error(`Tjeneste #${i + 1}: ${scopeError}`)
    }
  }

  return { repairServices, sources }
}
