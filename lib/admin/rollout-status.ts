import "server-only"

import { CountyRolloutStage } from "@prisma/client"
import { buildAdminActorReviewItem, adminActorReviewSelect } from "@/lib/admin/actor-review"
import type {
  CountyCoverageTarget,
  CountyRolloutBoardRow,
  CountyRolloutStage as CountyRolloutStageValue,
  CountyRolloutWorkflow,
  CoverageClusterKey,
} from "@/lib/data"
import { getCountyCoverageSummaries } from "@/lib/pilot-coverage"
import { isPilotCounty } from "@/lib/pilot-counties"
import { getCountyBySlug, getMunicipalitiesForCounty } from "@/lib/geo"
import { prisma } from "@/lib/prisma"

const defaultPriorityByStage: Record<CountyRolloutStageValue, number> = {
  pilot: 10,
  in_progress: 50,
  queued: 100,
  ready: 200,
}

export const requiredCountyRolloutClusters: CoverageClusterKey[] = [
  "reuse",
  "repair",
  "recycling",
  "access_redistribution",
]

const defaultCountyCoverageTarget = {
  approvedActors: 4,
  municipalities: 1,
} as const

const normalizeStage = (stage: CountyRolloutStage): CountyRolloutStageValue => stage

const buildCountyCoverageTarget = (input?: {
  targetApprovedActors?: number | null
  targetMunicipalities?: number | null
}): CountyCoverageTarget => ({
  approvedActors: Math.max(1, input?.targetApprovedActors ?? defaultCountyCoverageTarget.approvedActors),
  municipalities: Math.max(1, input?.targetMunicipalities ?? defaultCountyCoverageTarget.municipalities),
  requiredClusters: requiredCountyRolloutClusters,
})

const getComputedStage = ({
  countySlug,
  target,
  clusterReady,
  approvedActorCount,
  municipalityCount,
  currentStage,
}: {
  countySlug: string
  target: CountyCoverageTarget
  clusterReady: boolean
  approvedActorCount: number
  municipalityCount: number
  currentStage?: CountyRolloutStage | null
}): CountyRolloutStage => {
  if (isPilotCounty(countySlug)) {
    return CountyRolloutStage.pilot
  }
  const targetApprovedActorsMet = approvedActorCount >= target.approvedActors
  const targetMunicipalitiesMet = municipalityCount >= target.municipalities
  if (clusterReady && targetApprovedActorsMet && targetMunicipalitiesMet) {
    return CountyRolloutStage.ready
  }
  if (currentStage === CountyRolloutStage.in_progress) {
    return CountyRolloutStage.in_progress
  }
  if (approvedActorCount > 0 || municipalityCount > 0) {
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
      where:
        normalizedCountySlugs.length > 0
          ? { county: { is: { slug: { in: normalizedCountySlugs } } } }
          : undefined,
      select: {
        countyId: true,
        stage: true,
        priority: true,
        notes: true,
        targetApprovedActors: true,
        targetMunicipalities: true,
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
      const target = buildCountyCoverageTarget(current)
      const stage = getComputedStage({
        countySlug: county.slug,
        target,
        clusterReady: summary?.coverageClusters.every((cluster) => cluster.isReady) ?? false,
        approvedActorCount: summary?.approvedActorCount ?? 0,
        municipalityCount: summary?.municipalityCount ?? 0,
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
          targetApprovedActors: target.approvedActors,
          targetMunicipalities: target.municipalities,
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
        targetApprovedActors: true,
        targetMunicipalities: true,
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
    const target = buildCountyCoverageTarget(status)
    const clusterReady = summary?.coverageClusters.every((cluster) => cluster.isReady) ?? false
    const targetApprovedActorsMet = (summary?.approvedActorCount ?? 0) >= target.approvedActors
    const targetMunicipalitiesMet = (summary?.municipalityCount ?? 0) >= target.municipalities
    const stage = normalizeStage(
      status?.stage ??
        getComputedStage({
          countySlug: county.slug,
          target,
          clusterReady,
          approvedActorCount: summary?.approvedActorCount ?? 0,
          municipalityCount: summary?.municipalityCount ?? 0,
        }),
    )

    return {
      county: county.name,
      countySlug: county.slug,
      stage,
      priority: status?.priority ?? defaultPriorityByStage[stage],
      target,
      targetApprovedActorsMet,
      targetMunicipalitiesMet,
      targetProgressLabel: `${summary?.approvedActorCount ?? 0}/${target.approvedActors} aktører · ${summary?.municipalityCount ?? 0}/${target.municipalities} kommuner`,
      notes: status?.notes ?? null,
      isPilotCounty: isPilotCounty(county.slug),
      approvedActorCount: summary?.approvedActorCount ?? 0,
      municipalityCount: summary?.municipalityCount ?? 0,
      staleCount: summary?.staleCount ?? 0,
      blockedCount: summary?.blockedCount ?? 0,
      missingSourceCount: summary?.missingSourceCount ?? 0,
      coverageClusters: summary?.coverageClusters ?? [],
      missingClusterKeys: summary?.coverageClusters.filter((cluster) => !cluster.isReady).map((cluster) => cluster.key) ?? [],
      isBrowseReady: clusterReady && targetApprovedActorsMet && targetMunicipalitiesMet,
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
    targetApprovedActors?: number
    targetMunicipalities?: number
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
      targetApprovedActors: true,
      targetMunicipalities: true,
    },
  })

  const target = buildCountyCoverageTarget({
    targetApprovedActors: input.targetApprovedActors ?? existing?.targetApprovedActors ?? undefined,
    targetMunicipalities: input.targetMunicipalities ?? existing?.targetMunicipalities ?? undefined,
  })

  const fallbackStage = getComputedStage({
    countySlug: county.slug,
    target,
    clusterReady: false,
    approvedActorCount: 0,
    municipalityCount: 0,
    currentStage: existing?.stage ?? null,
  })

  await prisma.countyRolloutStatus.upsert({
    where: { countyId: county.id },
    update: {
      ...(input.stage ? { stage: input.stage } : {}),
      ...(typeof input.priority === "number" ? { priority: input.priority } : {}),
      ...(typeof input.targetApprovedActors === "number"
        ? { targetApprovedActors: Math.max(1, Math.round(input.targetApprovedActors)) }
        : {}),
      ...(typeof input.targetMunicipalities === "number"
        ? { targetMunicipalities: Math.max(1, Math.round(input.targetMunicipalities)) }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
    create: {
      countyId: county.id,
      stage: input.stage ?? normalizeStage(fallbackStage),
      priority:
        typeof input.priority === "number"
          ? input.priority
          : defaultPriorityByStage[input.stage ?? normalizeStage(fallbackStage)],
      targetApprovedActors: target.approvedActors,
      targetMunicipalities: target.municipalities,
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

export const getCountyRolloutWorkflow = async (countySlug: string): Promise<CountyRolloutWorkflow | null> => {
  const statuses = await listCountyRolloutStatuses()
  const status = statuses.find((entry) => entry.countySlug === countySlug)
  if (!status) {
    return null
  }

  const [importHistory, actors] = await Promise.all([
    prisma.actorImportBatch.findMany({
      where: {
        status: "applied",
        targetCounties: {
          has: countySlug,
        },
      },
      orderBy: [{ appliedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
      select: {
        id: true,
        filename: true,
        status: true,
        targetCounties: true,
        totalRows: true,
        createCount: true,
        updateCount: true,
        skipCount: true,
        errorCount: true,
        warningCount: true,
        errorSummary: true,
        createdAt: true,
        appliedAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.actor.findMany({
      where: {
        status: "approved",
        OR: [
          { countySlug },
          { baseCounty: { is: { slug: countySlug } } },
        ],
      },
      select: adminActorReviewSelect,
    }),
  ])

  const coveredMunicipalitySlugs = new Set(
    actors
      .map((actor) => actor.municipalitySlug)
      .filter((value): value is string => Boolean(value)),
  )
  const uncoveredMunicipalities = getMunicipalitiesForCounty(countySlug)
    .filter((municipality) => !coveredMunicipalitySlugs.has(municipality.slug))
    .map((municipality) => ({
      slug: municipality.slug,
      name: municipality.name,
    }))

  const countyName = getCountyBySlug(countySlug)?.name ?? status.county
  return {
    status,
    uncoveredMunicipalities,
    importHistory: importHistory.map((batch) => ({
      id: batch.id,
      filename: batch.filename,
      status: batch.status,
      targetCounties: batch.targetCounties,
      totalRows: batch.totalRows,
      createCount: batch.createCount,
      updateCount: batch.updateCount,
      skipCount: batch.skipCount,
      errorCount: batch.errorCount,
      warningCount: batch.warningCount,
      errorSummary: (batch.errorSummary as Record<string, unknown> | null) ?? null,
      createdBy: batch.createdBy,
      createdAt: batch.createdAt.toISOString(),
      appliedAt: batch.appliedAt?.toISOString() ?? null,
    })),
    recommendedDirectory: `data/imports/counties/${countySlug}`,
    recommendedFilenamePrefix: `${countySlug}-catalog`,
    guideSteps: [
      {
        key: "templates",
        title: `Start med ${countyName}-templates`,
        description: `Bruk county-spesifikk importflyt for ${countyName} og fyll actors.csv, actor_sources.csv og eventuelt actor_repair_services.csv.`,
      },
      {
        key: "targets",
        title: "Fyll coverage targets først",
        description: `Målbildet er minst ${status.target.approvedActors} godkjente aktører på tvers av ${status.target.municipalities} kommuner, i tillegg til alle fire serviceklynger.`,
      },
      {
        key: "clusters",
        title: "Lukk manglende serviceklynger",
        description:
          status.missingClusterKeys.length > 0
            ? `Mangler akkurat na: ${status.missingClusterKeys.join(", ")}. Prioriter disse i neste importbatch.`
            : "Alle serviceklynger er allerede dekket. Fokuser på flere kommuner og bedre kildekvalitet.",
      },
      {
        key: "review",
        title: "Bruk import + reverifisering sammen",
        description: "Etter apply skal fylket sjekkes i verification queue og rollout board for stale eller blocked aktører.",
      },
    ],
  }
}
