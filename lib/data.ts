import type { ItemType, ProblemType } from "@/lib/decision-engine"

export type ActorCategory =
  | "brukt"
  | "reparasjon"
  | "gjenvinning"
  | "utleie"
  | "reparasjon_sko_klar"
  | "mottak_ombruk"
  | "mobelreparasjon"
  | "sykkelverksted"
  | "ombruksverksted"
  | "baerekraftig_mat"

export type SourceType = "website" | "social" | "google_reviews" | "article" | "map"

export interface Source {
  type: SourceType
  title: string
  url: string
  capturedAt?: string
  note?: string
}

export interface Actor {
  id: string
  name: string
  slug: string
  category: ActorCategory
  description: string
  longDescription: string
  address: string
  lat: number
  lng: number
  phone?: string | null
  email?: string | null
  website?: string | null
  instagram?: string | null
  openingHours: string[]
  openingHoursOsm?: string | null
  tags: string[]
  benefits: string[]
  howToUse: string[]
  image?: string | null
  repairServices?: RepairService[]
  sources: Source[]
}

export interface RepairService {
  problemType: ProblemType
  itemTypes?: ItemType[]
  priceMin: number
  priceMax: number
  etaDays?: number
}

export interface QuizQuestion {
  id: string
  question: string
  options: {
    text: string
    points: number
  }[]
}

export type QuizLevel = "starter" | "pa_vei" | "gjenbrukshelt"

export interface QuizResult {
  level: QuizLevel
  title: string
  description: string
  tips: string[]
  badge: string
}

export interface Challenge {
  id: string
  key?: string
  title: string
  description: string
  points: number
  icon: string
  category: ActorCategory
}

export interface RepairEstimate {
  itemType?: ItemType
  problemType?: ProblemType
  deviceType: string
  issue: string
  repairCostMin: number
  repairCostMax: number
  repairDays: number
  usedPriceMin: number
  usedPriceMax: number
  newPrice: number
  co2Saved: number
}

export type RepairData = Record<string, Record<string, RepairEstimate>>

export interface Fact {
  title: string
  stat: string
  description: string
  icon: string
}

export interface DetailedFactSource {
  name: string
  url: string
}

export interface DetailedFact {
  category: string
  icon: string
  title: string
  content: string[]
  tips: string[]
  sources: DetailedFactSource[]
}

export interface Co2eSource {
  id: string
  key?: string
  title: string
  url: string
  capturedAt?: string
  anchors?: string[]
}

export interface Co2eSourceItem {
  id: string
  sourceId: string
  itemType: ItemType
}
