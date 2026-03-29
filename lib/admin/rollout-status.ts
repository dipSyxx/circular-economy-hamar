import "server-only"

import { CountyRolloutStage } from "@prisma/client"
import { buildAdminActorReviewItem, adminActorReviewSelect } from "@/lib/admin/actor-review"
import type { CountyRolloutBoardRow, CountyRolloutStage as CountyRolloutStageValue } from "@/lib/data"
import { getCountyCoverageSummaries } from "@/lib/pilot-coverage"
import { isPilotCounty } from "@/lib/pilot-counties"
import { prisma } from "@/lib/prisma"

const defaultPriorityByStage: Record<CountyRolloutStageValue, number> = {
  pilot: 10,
  in_progress: 50,
  queued: 100,
  ready: 200,
}

const normalizeStage = (stage: CountyRolloutStage): CountyRolloutStageValue => stage

const getComputedStage = ({
  countySlug,
  isBrowseReady,
  approvedActorCount,
  currentStage,
}: {
  countySlug: string
  isBrowseReady: boolean
  approvedActorCount: number
  currentStage?: CountyRolloutStage | null
}): CountyRolloutStage => {
  if (isPilotCounty(countySlug)) {
    return CountyRolloutStage.pilot
  }
  if (isBrowseReady) {
    return CountyRolloutStage.ready
  }
  if (currentStage === CountyRolloutStage.in_progress) {
    return CountyRolloutStage.in_progress
  }
  if (approvedActorCount > 0) {
    return CountyRolloutStage.in_progress
  }
  return CountyRolloutStage.queued
}

const buildLastImportBatchMap = async () => {
  const batches = await prisma.actorImportBatch.findMany({
    where: { status: "applied" },
    select: {
      id: true,
      filename: true,
      appliedAt: true,
      targetCounties: true,
    },
    orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }],
  })

  const byCountySlug = new Map<
    string,
    {
      id: string
      filename: string
      appliedAt: string | null
    }
  >()

  for (const batch of batches) {
    for (const countySlug of batch.targetCounties) {
      if (!byCountySlug.has(countySlug)) {
        byCountySlug.set(countySlug, {
          id: batch.id,
          filename: batch.filename,
          appliedAt: batch.appliedAt?.toISOString() ?? null,
        })
      }
    }
  }

  return byCountySlug
}

export const refreshCountyRolloutStatuses = async (countySlugs?: string[]) => {
  const normalizedCountySlugs = Array.from(new Set((countySlugs ?? []).filter(Boolean)))

  const [counties, actors, existingStatuses] = await Promise.all([
    prisma.county.findMany({
      where: normalizedCountySlugs.length > 0 ? { slug: { in: normalizedCountySlugs } } : undefined,
      select: {
        id: true,
        slug: true,
        name: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.actor.findMany({
      where: normalizedCountySlugs.length > 0 ? { countySlug: { in: normalizedCountySlugs } } : undefined,
      select: adminActorReviewSelect,
    }),
    prisma.countyRolloutStatus.findMany({
      where: normalizedCountySlugs.length > 0 ? { county: { slug: { in: normalizedCountySlugs } } } : undefined,
      select: {
        countyId: true,
        stage: true,
        priority: true,
        notes: true,
      },
    }),
  ])

  const summaries = getCountyCoverageSummaries(actors.map(buildAdminActorReviewItem))
  const summaryByCountySlug = new Map(summaries.map((summary) => [summary.countySlug, summary]))
  const existingByCountyId = new Map(existingStatuses.map((status) => [status.countyId, status]))

  await Promise.all(
    counties.map((county) => {
      const summary = summaryByCountySlug.get(county.slug)
      const current = existingByCountyId.get(county.id)
      const stage = getComputedStage({
        countySlug: county.slug,
        isBrowseReady: summary?.isBrowseReady ?? false,
        approvedActorCount: summary?.approvedActorCount ?? 0,
        currentStage: current?.stage ?? null,
      })
      const priority = current?.priority ?? defaultPriorityByStage[normalizeStage(stage)]

      return prisma.countyRolloutStatus.upsert({
        where: { countyId: county.id },
        update: {
          stage,
          priority,
        },
        create: {
          countyId: county.id,
          stage,
          priority,
          notes: null,
        },
      })
    }),
  )
}

export const listCountyRolloutStatuses = async () => {
  await refreshCountyRolloutStatuses()

  const [counties, actors, statuses, lastImportBatchByCounty] = await Promise.all([
    prisma.county.findMany({
      include: {
        rolloutStatus: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.actor.findMany({
      select: adminActorReviewSelect,
    }),
    prisma.countyRolloutStatus.findMany({
      select: {
        countyId: true,
        stage: true,
        priority: true,
        notes: true,
      },
    }),
    buildLastImportBatchMap(),
  ])

  const actorReviewItems = actors.map(buildAdminActorReviewItem)
  const summaries = getCountyCoverageSummaries(actorReviewItems)
  const summaryByCountySlug = new Map(summaries.map((summary) => [summary.countySlug, summary]))
  const statusByCountyId = new Map(statuses.map((status) => [status.countyId, status]))

  const rows: CountyRolloutBoardRow[] = counties.map((county) => {
    const summary = summaryByCountySlug.get(county.slug)
    const status = statusByCountyId.get(county.id)
    const stage = normalizeStage(
      status?.stage ??
        getComputedStage({
          countySlug: county.slug,
          isBrowseReady: summary?.isBrowseReady ?? false,
          approvedActorCount: summary?.approvedActorCount ?? 0,
        }),
    )

    return {
      county: county.name,
      countySlug: county.slug,
      stage,
      priority: status?.priority ?? defaultPriorityByStage[stage],
      notes: status?.notes ?? null,
      isPilotCounty: isPilotCounty(county.slug),
      approvedActorCount: summary?.approvedActorCount ?? 0,
      municipalityCount: summary?.municipalityCount ?? 0,
      staleCount: summary?.staleCount ?? 0,
      blockedCount: summary?.blockedCount ?? 0,
      missingSourceCount: summary?.missingSourceCount ?? 0,
      coverageClusters: summary?.coverageClusters ?? [],
      missingClusterKeys: summary?.coverageClusters.filter((cluster) => !cluster.isReady).map((cluster) => cluster.key) ?? [],
      isBrowseReady: summary?.isBrowseReady ?? false,
      lastImportBatch: lastImportBatchByCounty.get(county.slug) ?? null,
    }
  })

  return rows.sort((left, right) => {
    if (left.priority !== right.priority) {
      return left.priority - right.priority
    }
    if (left.isPilotCounty !== right.isPilotCounty) {
      return left.isPilotCounty ? -1 : 1
    }
    return left.county.localeCompare(right.county, "no", { sensitivity: "base" })
  })
}

export const updateCountyRolloutStatus = async (
  countySlug: string,
  input: {
    stage?: CountyRolloutStageValue
    priority?: number
    notes?: string | null
  },
) => {
  const county = await prisma.county.findUnique({
    where: { slug: countySlug },
    select: {
      id: true,
      slug: true,
    },
  })

  if (!county) {
    throw new Error("Fylket ble ikke funnet.")
  }

  if (isPilotCounty(county.slug) && input.stage && input.stage !== "pilot") {
    throw new Error("Pilotfylker styres automatisk som pilot i denne fasen.")
  }

  const existing = await prisma.countyRolloutStatus.findUnique({
    where: { countyId: county.id },
    select: {
      countyId: true,
      stage: true,
      priority: true,
      notes: true,
    },
  })

  const fallbackStage = getComputedStage({
    countySlug: county.slug,
    isBrowseReady: false,
    approvedActorCount: 0,
    currentStage: existing?.stage ?? null,
  })

  await prisma.countyRolloutStatus.upsert({
    where: { countyId: county.id },
    update: {
      ...(input.stage ? { stage: input.stage } : {}),
      ...(typeof input.priority === "number" ? { priority: input.priority } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
    create: {
      countyId: county.id,
      stage: input.stage ?? normalizeStage(fallbackStage),
      priority:
        typeof input.priority === "number"
          ? input.priority
          : defaultPriorityByStage[input.stage ?? normalizeStage(fallbackStage)],
      notes: input.notes ?? null,
    },
  })

  const statuses = await listCountyRolloutStatuses()
  const updated = statuses.find((status) => status.countySlug === countySlug)
  if (!updated) {
    throw new Error("Kunne ikke lese oppdatert rolloutstatus.")
  }

  return updated
}
