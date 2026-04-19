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
export type ActorVerificationStatus = "unverified" | "community_verified" | "editorial_verified"
export type FreshnessStatus = "fresh" | "aging" | "stale"
export type VerificationDueState = "healthy" | "due_soon" | "due" | "overdue" | "blocked"
export type VerificationTaskStatus = "open" | "snoozed" | "resolved"
export type CountyRolloutStage = "pilot" | "queued" | "in_progress" | "ready"
export type CoverageClusterKey = "reuse" | "repair" | "recycling" | "access_redistribution"
export type GuideIntent =
  | "repair"
  | "buy-used"
  | "donate"
  | "recycle"
  | "rental"
  | "how-to-find-local-services"

export type EditorialTheme =
  | "local-discovery"
  | "repair-economy"
  | "trust-and-quality"
  | "circular-systems"

export const EDITORIAL_THEMES = [
  "local-discovery",
  "repair-economy",
  "trust-and-quality",
  "circular-systems",
] as const satisfies ReadonlyArray<EditorialTheme>

export interface GuideCtaLink {
  label: string
  href: string
}

export interface GuideSection {
  title: string
  body: string[]
  checklist?: string[]
  ctaLinks?: GuideCtaLink[]
}

export interface GuideDoc {
  slug: string
  title: string
  summary: string
  seoTitle: string
  seoDescription: string
  primaryIntent: GuideIntent
  relatedCategories: ActorCategory[]
  relatedCounties: string[]
  bodySections: GuideSection[]
}

export interface ArticleDoc {
  slug: string
  title: string
  summary: string
  seoTitle: string
  seoDescription: string
  publishedAt: string
  readingMinutes: number
  theme: EditorialTheme
  relatedCategories: ActorCategory[]
  relatedCounties: string[]
  bodySections: GuideSection[]
}

export interface Source {
  type: SourceType
  title: string
  url: string
  capturedAt?: string
  note?: string
}

export interface SourceQualitySummary {
  canonicalUrl?: string | null
  host?: string | null
  type: SourceType
  qualityScore: number
  isStrong: boolean
  isDuplicate: boolean
  warnings: string[]
}

export interface ActorQualitySummary {
  sourceCount: number
  uniqueSourceCount: number
  duplicateSourceCount: number
  uniqueHostCount: number
  strongSourceCount: number
  hasLowDiversitySourceSet: boolean
  hasWeakSourceSet: boolean
  dueState: VerificationDueState
  warnings: string[]
}

export interface Actor {
  id: string
  name: string
  slug: string
  category: ActorCategory
  description: string
  longDescription: string
  address: string
  postalCode?: string | null
  country?: string
  county?: string
  countySlug?: string
  municipality?: string
  municipalitySlug?: string
  city?: string
  area?: string | null
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
  nationwide?: boolean
  serviceAreaCountySlugs?: string[]
  serviceAreaMunicipalitySlugs?: string[]
  verificationStatus?: ActorVerificationStatus
  verifiedAt?: string
  freshnessStatus?: FreshnessStatus
  isTrusted?: boolean
  sourceCount?: number
  dueState?: VerificationDueState
  qualitySummary?: ActorQualitySummary
  repairServices?: RepairService[]
  sources: Source[]
}

export interface ActorImportBatchSummary {
  id: string
  filename: string
  status: "preview" | "applied" | "failed"
  targetCounties: string[]
  totalRows: number
  createCount: number
  updateCount: number
  skipCount: number
  errorCount: number
  warningCount: number
  errorSummary?: Record<string, unknown> | null
  createdBy?: {
    id: string
    name?: string | null
    email?: string | null
  } | null
  createdAt: string
  appliedAt?: string | null
}

export interface ActorImportRowSummary {
  id: string
  batchId: string
  rowType: "actor" | "actor_source" | "actor_repair_service"
  rowNumber: number
  rawData: Record<string, unknown>
  normalizedData?: Record<string, unknown> | null
  matchStrategy?: "slug" | "website_host" | "name_postal" | "none" | null
  matchedActorId?: string | null
  action: "create" | "update" | "skip" | "error"
  validationErrors: string[]
  warnings: string[]
  appliedAt?: string | null
  createdAt: string
}

export interface ActorCorrectionSuggestion {
  id: string
  actorId: string
  submittedById: string
  payload: Record<string, unknown>
  note: string
  sourceUrl?: string | null
  status: "pending" | "accepted" | "rejected"
  reviewNote?: string | null
  reviewedById?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface ActorCorrectionDiffEntry {
  field: string
  currentValue: unknown
  proposedValue: unknown
}

export interface AdminActorCorrectionSuggestion extends ActorCorrectionSuggestion {
  actor?: {
    id: string
    name: string
    slug: string
    description: string
    longDescription: string
    address: string
    postalCode?: string | null
    county?: string
    municipality?: string
    city?: string
    area?: string | null
    lat: number
    lng: number
    phone?: string | null
    email?: string | null
    website?: string | null
    instagram?: string | null
    openingHoursOsm?: string | null
    nationwide: boolean
    verificationStatus: ActorVerificationStatus
    verifiedAt?: string | null
  } | null
  submittedBy?: {
    id: string
    name?: string | null
    email?: string | null
  } | null
  reviewedBy?: {
    id: string
    name?: string | null
    email?: string | null
  } | null
  diff: ActorCorrectionDiffEntry[]
}

export interface AdminActorReviewItem {
  id: string
  name: string
  slug: string
  category: ActorCategory
  status: "pending" | "approved" | "rejected" | "archived"
  county?: string
  countySlug?: string
  municipality?: string
  municipalitySlug?: string
  city?: string
  verificationStatus?: ActorVerificationStatus
  verifiedAt?: string | null
  freshnessStatus?: FreshnessStatus
  isTrusted?: boolean
  sourceCount: number
  dueState: VerificationDueState
  qualitySummary: ActorQualitySummary
  isPilotCounty: boolean
}

export interface CoverageClusterStatus {
  key: CoverageClusterKey
  label: string
  categories: ActorCategory[]
  actorCount: number
  isReady: boolean
}

export interface CountyCoverageTarget {
  approvedActors: number
  municipalities: number
  requiredClusters: CoverageClusterKey[]
}

export interface CountyCoverageSummary {
  county: string
  countySlug: string
  approvedActorCount: number
  municipalityCount: number
  missingSourceCount: number
  staleCount: number
  blockedCount: number
  categoryCounts: Array<{
    category: ActorCategory
    count: number
  }>
  coverageClusters: CoverageClusterStatus[]
  isPilotCounty: boolean
  isBrowseReady: boolean
  needsFill: boolean
}

export interface MunicipalityCoverageSummary {
  county: string
  countySlug: string
  municipality: string
  municipalitySlug: string
  approvedActorCount: number
  missingSourceCount: number
  staleCount: number
  categoryCounts: Array<{
    category: ActorCategory
    count: number
  }>
}

export interface AdminVerificationTask {
  id: string
  actorId: string
  dueState: VerificationDueState
  status: VerificationTaskStatus
  reasonSummary: string
  generatedAt: string
  snoozeUntil?: string | null
  resolvedAt?: string | null
  resolutionNote?: string | null
  priorityRank: number
  actor: AdminActorReviewItem
}

export interface CountyRolloutBoardRow {
  county: string
  countySlug: string
  stage: CountyRolloutStage
  priority: number
  target: CountyCoverageTarget
  targetApprovedActorsMet: boolean
  targetMunicipalitiesMet: boolean
  targetProgressLabel: string
  notes?: string | null
  isPilotCounty: boolean
  approvedActorCount: number
  municipalityCount: number
  staleCount: number
  blockedCount: number
  missingSourceCount: number
  coverageClusters: CoverageClusterStatus[]
  missingClusterKeys: CoverageClusterKey[]
  isBrowseReady: boolean
  lastImportBatch?: {
    id: string
    filename: string
    appliedAt?: string | null
  } | null
}

export interface CountyBootstrapGuideStep {
  key: string
  title: string
  description: string
}

export interface CountyRolloutWorkflow {
  status: CountyRolloutBoardRow
  uncoveredMunicipalities: Array<{
    slug: string
    name: string
  }>
  importHistory: ActorImportBatchSummary[]
  recommendedDirectory: string
  recommendedFilenamePrefix: string
  guideSteps: CountyBootstrapGuideStep[]
}

export interface RepairService {
  problemType: ProblemType
  itemTypes?: ItemType[]
  priceMin: number
  priceMax: number | null
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
