"use client"

import { Badge } from "@/components/ui/badge"
import type { Actor, ActorVerificationStatus, FreshnessStatus } from "@/lib/data"

type ActorTrustBadgesProps = {
  actor: Pick<Actor, "verificationStatus" | "freshnessStatus" | "isTrusted" | "sourceCount">
  className?: string
}

const verificationLabel = (status?: ActorVerificationStatus) => {
  if (status === "editorial_verified") return "Redaksjonelt verifisert"
  if (status === "community_verified") return "Community-verifisert"
  return "Uverifisert"
}

const freshnessLabel = (status?: FreshnessStatus) => {
  if (status === "fresh") return "Nylig verifisert"
  if (status === "aging") return "Verifisert tidligere"
  if (status === "stale") return "Trenger ny verifisering"
  return null
}

export function ActorTrustBadges({ actor, className }: ActorTrustBadgesProps) {
  const freshness = freshnessLabel(actor.freshnessStatus)

  return (
    <div className={className ? `flex flex-wrap gap-2 ${className}` : "flex flex-wrap gap-2"}>
      <Badge variant={actor.isTrusted ? "default" : "secondary"}>{verificationLabel(actor.verificationStatus)}</Badge>
      {freshness ? (
        <Badge variant={actor.freshnessStatus === "stale" ? "outline" : "secondary"}>{freshness}</Badge>
      ) : null}
      <Badge variant="outline">
        {(actor.sourceCount ?? 0).toString()} {(actor.sourceCount ?? 0) === 1 ? "kilde" : "kilder"}
      </Badge>
    </div>
  )
}
