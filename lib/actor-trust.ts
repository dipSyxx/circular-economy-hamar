import type { ActorQualitySummary, ActorVerificationStatus, FreshnessStatus } from "@/lib/data"

const DAY_MS = 24 * 60 * 60 * 1000
export const FRESH_DAYS = 180
export const STALE_DAYS = 365

export const getFreshnessStatus = (input: {
  verifiedAt?: Date | string | null
  sourceCount?: number
  qualitySummary?: Pick<ActorQualitySummary, "dueState">
}): FreshnessStatus => {
  if (!input.verifiedAt || !input.sourceCount || input.qualitySummary?.dueState === "blocked") {
    return "stale"
  }

  const verifiedAt = input.verifiedAt instanceof Date ? input.verifiedAt : new Date(input.verifiedAt)
  if (Number.isNaN(verifiedAt.getTime())) {
    return "stale"
  }

  const ageDays = Math.floor((Date.now() - verifiedAt.getTime()) / DAY_MS)
  if (ageDays <= FRESH_DAYS) {
    return "fresh"
  }
  if (ageDays <= STALE_DAYS) {
    return "aging"
  }
  return "stale"
}

export const getActorTrustState = (input: {
  verificationStatus?: ActorVerificationStatus | null
  verifiedAt?: Date | string | null
  sourceCount?: number
  qualitySummary?: Pick<ActorQualitySummary, "dueState">
}) => {
  const freshnessStatus = getFreshnessStatus({
    verifiedAt: input.verifiedAt,
    sourceCount: input.sourceCount,
    qualitySummary: input.qualitySummary,
  })

  const isTrusted =
    input.verificationStatus === "editorial_verified" &&
    (freshnessStatus === "fresh" || freshnessStatus === "aging")

  return {
    freshnessStatus,
    isTrusted,
  }
}
