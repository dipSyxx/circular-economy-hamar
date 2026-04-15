import type { ActorCategory } from "@/lib/data"
import { supportsRepairServices } from "@/lib/categories"
import { formatCategoryLabel } from "@/lib/enum-labels"
import { ITEM_TYPES, PROBLEM_TYPES, type ItemType, type ProblemType } from "@/lib/prisma-enums"

/** Categories that may register repair services (subset of ActorCategory). */
type RepairActorCategory = Exclude<
  ActorCategory,
  "brukt" | "utleie" | "mottak_ombruk" | "baerekraftig_mat" | "gjenvinning"
>

const REPARASJON_ITEMS = [
  "phone",
  "laptop",
  "tablet",
  "desktop",
  "smartwatch",
  "tv",
  "monitor",
  "printer",
  "camera",
  "gaming_console",
  "audio",
  "small_appliance",
  "large_appliance",
  "other",
] as const satisfies readonly ItemType[]

const REPARASJON_PROBLEMS = [
  "screen",
  "battery",
  "slow",
  "no_power",
  "water",
  "overheating",
  "charging_port",
  "speaker",
  "microphone",
  "camera",
  "keyboard",
  "trackpad",
  "storage",
  "software",
  "connectivity",
  "broken_part",
  "cosmetic",
  "noise",
  "leak",
  "motor",
  "other",
] as const satisfies readonly ProblemType[]

const SKO_KLAR_ITEMS = ["footwear", "clothing", "other"] as const satisfies readonly ItemType[]

const SKO_KLAR_PROBLEMS = [
  "sole",
  "zipper",
  "seam",
  "tear",
  "stain",
  "broken_part",
  "cosmetic",
  "other",
] as const satisfies readonly ProblemType[]

const MOBEL_ITEMS = ["furniture", "other"] as const satisfies readonly ItemType[]

const MOBEL_PROBLEMS = ["broken_part", "cosmetic", "seam", "tear", "stain", "other"] as const satisfies readonly ProblemType[]

const SYKKEL_ITEMS = ["bicycle", "other"] as const satisfies readonly ItemType[]

const SYKKEL_PROBLEMS = [
  "chain",
  "brake",
  "tire",
  "wheel",
  "broken_part",
  "cosmetic",
  "noise",
  "other",
] as const satisfies readonly ProblemType[]

const scopedItemTypes: Record<RepairActorCategory, readonly ItemType[] | "all"> = {
  reparasjon: REPARASJON_ITEMS,
  reparasjon_sko_klar: SKO_KLAR_ITEMS,
  mobelreparasjon: MOBEL_ITEMS,
  sykkelverksted: SYKKEL_ITEMS,
  ombruksverksted: "all",
}

const scopedProblemTypes: Record<RepairActorCategory, readonly ProblemType[] | "all"> = {
  reparasjon: REPARASJON_PROBLEMS,
  reparasjon_sko_klar: SKO_KLAR_PROBLEMS,
  mobelreparasjon: MOBEL_PROBLEMS,
  sykkelverksted: SYKKEL_PROBLEMS,
  ombruksverksted: "all",
}

export function getRepairServiceItemTypesForCategory(category: string): ItemType[] {
  if (!supportsRepairServices(category)) return []
  const key = category as RepairActorCategory
  const scoped = scopedItemTypes[key]
  if (scoped === "all") return [...ITEM_TYPES]
  return scoped ? [...scoped] : [...ITEM_TYPES]
}

export function getRepairServiceProblemTypesForCategory(category: string): ProblemType[] {
  if (!supportsRepairServices(category)) return []
  const key = category as RepairActorCategory
  const scoped = scopedProblemTypes[key]
  if (scoped === "all") return [...PROBLEM_TYPES]
  return scoped ? [...scoped] : [...PROBLEM_TYPES]
}

export function repairServiceRowMatchesScope(
  category: string,
  problemType: ProblemType,
  itemTypes: ItemType[],
): boolean {
  if (!supportsRepairServices(category)) return false
  const allowedItems = new Set(getRepairServiceItemTypesForCategory(category))
  const allowedProblems = new Set(getRepairServiceProblemTypesForCategory(category))
  if (!allowedProblems.has(problemType)) return false
  return itemTypes.length > 0 && itemTypes.every((item) => allowedItems.has(item))
}

/** Norwegian error for API / validation, or null if OK. */
export function validateRepairServiceAgainstScope(
  category: ActorCategory,
  problemType: ProblemType,
  itemTypes: ItemType[],
): string | null {
  if (!supportsRepairServices(category)) return null
  const allowedItems = new Set(getRepairServiceItemTypesForCategory(category))
  const allowedProblems = new Set(getRepairServiceProblemTypesForCategory(category))
  const catLabel = formatCategoryLabel(category)

  if (!allowedProblems.has(problemType)) {
    return `Problemtypen passer ikke kategorien «${catLabel}».`
  }
  const invalidItems = itemTypes.filter((item) => !allowedItems.has(item))
  if (invalidItems.length > 0) {
    return `Minst én varetype passer ikke kategorien «${catLabel}».`
  }
  if (itemTypes.length === 0) {
    return "Velg minst én varetype som passer kategorien."
  }
  return null
}

export type RepairServiceLike = {
  problemType: string
  itemTypes: string[]
  priceMin?: string | number
  priceMax?: string | number
  etaDays?: string | number | null
}

/** Drop problem/item selections that are not allowed for the actor category (e.g. after category change). */
export function clampRepairServiceDraftToCategory<T extends RepairServiceLike>(category: string, service: T): T {
  if (!supportsRepairServices(category)) return service
  const allowedItems = new Set(getRepairServiceItemTypesForCategory(category))
  const allowedProblems = new Set(getRepairServiceProblemTypesForCategory(category))
  const nextItemTypes = service.itemTypes.filter((t) => allowedItems.has(t as ItemType))
  const nextProblem =
    service.problemType && allowedProblems.has(service.problemType as ProblemType)
      ? service.problemType
      : ""
  return { ...service, problemType: nextProblem, itemTypes: nextItemTypes }
}
