import type {
  ActorQualitySummary,
  ActorVerificationStatus,
  SourceQualitySummary,
  SourceType,
  VerificationDueState,
} from "@/lib/data"

const DAY_MS = 24 * 60 * 60 * 1000
const STRONG_SOURCE_TYPES = new Set<SourceType>(["website", "map"])
const SOURCE_TYPE_SCORES: Record<SourceType, number> = {
  website: 4,
  map: 4,
  article: 3,
  google_reviews: 3,
  social: 2,
}
const TRACKING_QUERY_PREFIXES = ["utm_"]
const TRACKING_QUERY_KEYS = new Set([
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_src",
  "si",
])

type SourceLike = {
  type?: SourceType | null
  title?: string | null
  url?: string | null
  capturedAt?: Date | string | null
  note?: string | null
}

type ActorQualityInput = {
  verificationStatus?: ActorVerificationStatus | null
  verifiedAt?: Date | string | null
  sources: SourceLike[]
}

const normalizeText = (value?: string | null) => value?.trim() ?? ""

const parseDate = (value?: Date | string | null) => {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const canonicalizeSourceUrl = (value?: string | null) => {
  const trimmed = normalizeText(value)
  if (!trimmed) {
    return {
      canonicalUrl: null,
      host: null,
      path: null,
    }
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)
    url.hash = ""
    for (const [key] of url.searchParams.entries()) {
      const normalizedKey = key.toLowerCase()
      if (
        TRACKING_QUERY_KEYS.has(normalizedKey) ||
        TRACKING_QUERY_PREFIXES.some((prefix) => normalizedKey.startsWith(prefix))
      ) {
        url.searchParams.delete(key)
      }
    }

    const host = url.hostname.toLowerCase()
    const path = url.pathname.replace(/\/+$/, "") || "/"
    return {
      canonicalUrl: `${host}${path === "/" ? "" : path}`,
      host,
      path,
    }
  } catch {
    return {
      canonicalUrl: null,
      host: null,
      path: null,
    }
  }
}

const getSourceBaseQualityScore = (source: SourceLike) => {
  const type = (source.type ?? "website") as SourceType
  let qualityScore = SOURCE_TYPE_SCORES[type] ?? 1

  if (parseDate(source.capturedAt)) {
    qualityScore += 1
  }
  if (normalizeText(source.title).length >= 12) {
    qualityScore += 1
  }
  if (normalizeText(source.note).length >= 16) {
    qualityScore += 1
  }

  return qualityScore
}

export const summarizeSources = (sources: SourceLike[]): SourceQualitySummary[] => {
  const canonicalCounts = new Map<string, number>()

  const summaries = sources.map((source) => {
    const type = (source.type ?? "website") as SourceType
    const canonical = canonicalizeSourceUrl(source.url)
    if (canonical.canonicalUrl) {
      canonicalCounts.set(canonical.canonicalUrl, (canonicalCounts.get(canonical.canonicalUrl) ?? 0) + 1)
    }

    const summary: SourceQualitySummary = {
      canonicalUrl: canonical.canonicalUrl,
      host: canonical.host,
      type,
      qualityScore: getSourceBaseQualityScore(source),
      isStrong: STRONG_SOURCE_TYPES.has(type),
      isDuplicate: false,
      warnings: [],
    }

    return summary
  })

  return summaries.map((summary) => {
    const warnings = [...summary.warnings]
    if (summary.canonicalUrl && (canonicalCounts.get(summary.canonicalUrl) ?? 0) > 1) {
      warnings.push("Duplikatkilde basert på kanonisk URL.")
    }
    return {
      ...summary,
      isDuplicate: summary.canonicalUrl ? (canonicalCounts.get(summary.canonicalUrl) ?? 0) > 1 : false,
      warnings,
    }
  })
}

export const getActorQualitySummary = ({
  verificationStatus,
  verifiedAt,
  sources,
}: ActorQualityInput): ActorQualitySummary => {
  const sourceSummaries = summarizeSources(sources)
  const uniqueCanonicalUrls = Array.from(
    new Set(sourceSummaries.map((source) => source.canonicalUrl).filter(Boolean) as string[]),
  )
  const uniqueHosts = Array.from(
    new Set(sourceSummaries.map((source) => source.host).filter(Boolean) as string[]),
  )
  const strongSourceCount = sourceSummaries.filter((source) => source.isStrong && !source.isDuplicate).length
  const duplicateSourceCount = sourceSummaries.filter((source) => source.isDuplicate).length
  const uniqueSourceCount = uniqueCanonicalUrls.length
  const hasLowDiversitySourceSet = uniqueSourceCount > 1 && uniqueHosts.length <= 1
  const hasWeakSourceSet = uniqueSourceCount < 2 || strongSourceCount === 0
  const warnings: string[] = []

  if (duplicateSourceCount > 0) {
    warnings.push("Kildesettet inneholder duplikater.")
  }
  if (hasLowDiversitySourceSet) {
    warnings.push("Kildesettet er lavdivers og bruker bare ett vertsdomene.")
  }
  if (hasWeakSourceSet) {
    warnings.push("Kildesettet er svakt og bor styrkes for ny verifisering.")
  }

  const parsedVerifiedAt = parseDate(verifiedAt)
  const ageDays = parsedVerifiedAt
    ? Math.floor((Date.now() - parsedVerifiedAt.getTime()) / DAY_MS)
    : Number.POSITIVE_INFINITY

  let dueState: VerificationDueState = "due"
  const isBlocked = uniqueSourceCount === 0 || (duplicateSourceCount >= sourceSummaries.length && sourceSummaries.length > 0)

  if (isBlocked) {
    dueState = "blocked"
  } else if (ageDays > 365) {
    dueState = "overdue"
  } else {
    const hasHealthySourceSet = uniqueSourceCount >= 2 && strongSourceCount >= 1
    if (verificationStatus === "editorial_verified" && hasHealthySourceSet && ageDays <= 150) {
      dueState = "healthy"
    } else if (verificationStatus === "editorial_verified" && hasHealthySourceSet && ageDays <= 180) {
      dueState = "due_soon"
    } else {
      dueState = "due"
    }
  }

  return {
    sourceCount: sourceSummaries.length,
    uniqueSourceCount,
    duplicateSourceCount,
    uniqueHostCount: uniqueHosts.length,
    strongSourceCount,
    hasLowDiversitySourceSet,
    hasWeakSourceSet,
    dueState,
    warnings,
  }
}
