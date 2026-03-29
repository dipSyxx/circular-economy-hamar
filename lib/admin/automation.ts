import "server-only"

import { prisma } from "@/lib/prisma"
import { refreshCountyRolloutStatuses } from "@/lib/admin/rollout-status"
import { refreshAllVerificationTasks, refreshVerificationTasksForActors } from "@/lib/admin/verification-tasks"

export const refreshAutomationStateForActors = async (
  actorIds: string[],
  extraCountySlugs: string[] = [],
) => {
  const uniqueActorIds = Array.from(new Set(actorIds.filter(Boolean)))

  const actorCounties =
    uniqueActorIds.length > 0
      ? await prisma.actor.findMany({
          where: { id: { in: uniqueActorIds } },
          select: { countySlug: true },
        })
      : []

  const countySlugs = Array.from(
    new Set([
      ...extraCountySlugs.filter(Boolean),
      ...actorCounties.map((actor) => actor.countySlug).filter((slug): slug is string => Boolean(slug)),
    ]),
  )

  if (uniqueActorIds.length > 0) {
    await refreshVerificationTasksForActors(uniqueActorIds)
  }
  if (countySlugs.length > 0) {
    await refreshCountyRolloutStatuses(countySlugs)
  }
}

export const refreshAutomationStateForCounties = async (countySlugs: string[]) => {
  const uniqueCountySlugs = Array.from(new Set(countySlugs.filter(Boolean)))
  if (uniqueCountySlugs.length === 0) return
  await refreshCountyRolloutStatuses(uniqueCountySlugs)
}

export const refreshAllAutomationState = async () => {
  await Promise.all([refreshAllVerificationTasks(), refreshCountyRolloutStatuses()])
}
