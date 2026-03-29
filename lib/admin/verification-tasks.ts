import "server-only"

import {
  ActorVerificationTaskStatus,
  Prisma,
  type VerificationDueState as PrismaVerificationDueState,
} from "@prisma/client"
import { buildAdminActorReviewItem, adminActorReviewSelect } from "@/lib/admin/actor-review"
import type { AdminActorReviewItem, AdminVerificationTask, VerificationDueState, VerificationTaskStatus } from "@/lib/data"
import { prisma } from "@/lib/prisma"

const ACTIVE_TASK_STATUSES: ActorVerificationTaskStatus[] = [
  ActorVerificationTaskStatus.open,
  ActorVerificationTaskStatus.snoozed,
]

const dueStatePriority: Record<VerificationDueState, number> = {
  blocked: 0,
  overdue: 1,
  due: 2,
  due_soon: 3,
  healthy: 4,
}

type VerificationTaskFilters = {
  dueState?: VerificationDueState | null
  status?: VerificationTaskStatus | null
  countySlug?: string | null
  pilot?: boolean | null
}

type TaskActor = Prisma.ActorGetPayload<{
  select: typeof adminActorReviewSelect
}>

type TaskWithActor = {
  id: string
  actorId: string
  dueState: PrismaVerificationDueState
  status: ActorVerificationTaskStatus
  reasonSummary: string
  generatedAt: Date
  snoozeUntil: Date | null
  resolvedAt: Date | null
  resolutionNote: string | null
  actor: TaskActor
}

const normalizeTaskStatus = (status: ActorVerificationTaskStatus): VerificationTaskStatus => status
const normalizeDueState = (dueState: PrismaVerificationDueState): VerificationDueState => dueState

const buildReasonSummary = (actor: AdminActorReviewItem) => {
  const reasons: string[] = []

  if (actor.dueState === "blocked") {
    reasons.push("Manglende eller utilstrekkelig kildegrunnlag blokkerer redaksjonell verifisering.")
  } else if (actor.dueState === "overdue") {
    reasons.push("Aktøren er over ett år siden sist redaksjonelt verifisert.")
  } else if (actor.dueState === "due") {
    reasons.push("Aktøren bør reverifiseres nå.")
  } else if (actor.dueState === "due_soon") {
    reasons.push("Aktøren nærmer seg neste reverifisering.")
  }

  if (actor.qualitySummary.hasWeakSourceSet) {
    reasons.push("Kildesettet er svakt og trenger flere eller sterkere kilder.")
  }
  if (actor.qualitySummary.hasLowDiversitySourceSet) {
    reasons.push("Kildesettet er lavdiverst og bør suppleres med flere uavhengige kilder.")
  }
  if (actor.qualitySummary.duplicateSourceCount > 0) {
    reasons.push(`Kildesettet inneholder ${actor.qualitySummary.duplicateSourceCount} duplikat(er).`)
  }

  return Array.from(new Set(reasons)).join(" ")
}

const serializeTask = (task: TaskWithActor): AdminVerificationTask => ({
  id: task.id,
  actorId: task.actorId,
  dueState: normalizeDueState(task.dueState),
  status: normalizeTaskStatus(task.status),
  reasonSummary: task.reasonSummary,
  generatedAt: task.generatedAt.toISOString(),
  snoozeUntil: task.snoozeUntil?.toISOString() ?? null,
  resolvedAt: task.resolvedAt?.toISOString() ?? null,
  resolutionNote: task.resolutionNote ?? null,
  priorityRank: dueStatePriority[normalizeDueState(task.dueState)],
  actor: buildAdminActorReviewItem(task.actor),
})

const resolveActiveTasks = async (
  actorId: string,
  options?: {
    resolvedById?: string | null
    resolutionNote?: string | null
    now?: Date
  },
) => {
  const resolvedAt = options?.now ?? new Date()

  await prisma.actorVerificationTask.updateMany({
    where: {
      actorId,
      status: {
        in: ACTIVE_TASK_STATUSES,
      },
    },
    data: {
      status: ActorVerificationTaskStatus.resolved,
      resolvedAt,
      resolvedById: options?.resolvedById ?? null,
      resolutionNote: options?.resolutionNote ?? null,
      snoozeUntil: null,
    },
  })
}

const fetchActorReviewItem = async (actorId: string) => {
  const actor = await prisma.actor.findUnique({
    where: { id: actorId },
    select: adminActorReviewSelect,
  })

  return actor ? buildAdminActorReviewItem(actor) : null
}

const fetchActiveTasksForActor = async (actorId: string) =>
  prisma.actorVerificationTask.findMany({
    where: {
      actorId,
      status: {
        in: ACTIVE_TASK_STATUSES,
      },
    },
    orderBy: [{ generatedAt: "desc" }, { createdAt: "desc" }],
  })

const syncVerificationTaskForActorItem = async (
  actor: AdminActorReviewItem,
  existingTasks?: Awaited<ReturnType<typeof fetchActiveTasksForActor>>,
) => {
  const now = new Date()
  const activeTasks = [...(existingTasks ?? (await fetchActiveTasksForActor(actor.id)))]

  if (activeTasks.length > 1) {
    const [keep, ...extras] = activeTasks
    if (extras.length > 0) {
      await prisma.actorVerificationTask.updateMany({
        where: {
          id: {
            in: extras.map((task) => task.id),
          },
        },
        data: {
          status: ActorVerificationTaskStatus.resolved,
          resolvedAt: now,
          resolutionNote: "Auto-resolved duplicate active verification task.",
          snoozeUntil: null,
        },
      })
    }
    activeTasks.length = 0
    activeTasks.push(keep)
  }

  const actorNeedsTask = actor.status === "approved" && actor.dueState !== "healthy"
  if (!actorNeedsTask) {
    if (activeTasks.length > 0) {
      await resolveActiveTasks(actor.id, {
        now,
        resolutionNote:
          actor.status === "approved"
            ? "Auto-resolved because actor no longer requires verification."
            : "Auto-resolved because actor is no longer approved.",
      })
    }
    return null
  }

  const reasonSummary = buildReasonSummary(actor)
  const primaryTask = activeTasks[0]
  const snoozeStillActive =
    primaryTask?.status === ActorVerificationTaskStatus.snoozed &&
    primaryTask.snoozeUntil &&
    primaryTask.snoozeUntil.getTime() > now.getTime()

  if (!primaryTask) {
    const created = await prisma.actorVerificationTask.create({
      data: {
        actorId: actor.id,
        dueState: actor.dueState,
        status: ActorVerificationTaskStatus.open,
        reasonSummary,
        generatedAt: now,
      },
      include: {
        actor: {
          select: adminActorReviewSelect,
        },
      },
    })

    return serializeTask(created)
  }

  const updated = await prisma.actorVerificationTask.update({
    where: { id: primaryTask.id },
    data: {
      dueState: actor.dueState,
      reasonSummary,
      generatedAt: now,
      status: snoozeStillActive ? ActorVerificationTaskStatus.snoozed : ActorVerificationTaskStatus.open,
      ...(snoozeStillActive ? {} : { snoozeUntil: null }),
      resolvedAt: null,
      resolvedById: null,
      resolutionNote: null,
    },
    include: {
      actor: {
        select: adminActorReviewSelect,
      },
    },
  })

  return serializeTask(updated)
}

export const refreshVerificationTaskForActor = async (actorId: string) => {
  const actor = await fetchActorReviewItem(actorId)
  if (!actor) {
    await resolveActiveTasks(actorId, {
      resolutionNote: "Auto-resolved because actor no longer exists.",
    })
    return null
  }

  return syncVerificationTaskForActorItem(actor)
}

export const refreshVerificationTasksForActors = async (actorIds: string[]) => {
  const uniqueActorIds = Array.from(new Set(actorIds.filter(Boolean)))
  if (uniqueActorIds.length === 0) return []

  const [actors, tasks] = await Promise.all([
    prisma.actor.findMany({
      where: { id: { in: uniqueActorIds } },
      select: adminActorReviewSelect,
    }),
    prisma.actorVerificationTask.findMany({
      where: {
        actorId: { in: uniqueActorIds },
        status: { in: ACTIVE_TASK_STATUSES },
      },
      orderBy: [{ generatedAt: "desc" }, { createdAt: "desc" }],
    }),
  ])

  const tasksByActorId = new Map<string, typeof tasks>()
  for (const task of tasks) {
    const bucket = tasksByActorId.get(task.actorId) ?? []
    bucket.push(task)
    tasksByActorId.set(task.actorId, bucket)
  }

  const reviewItems = actors.map(buildAdminActorReviewItem)
  const refreshed = await Promise.all(
    reviewItems.map((actor) => syncVerificationTaskForActorItem(actor, tasksByActorId.get(actor.id))),
  )

  const missingActorIds = uniqueActorIds.filter((actorId) => !reviewItems.some((actor) => actor.id === actorId))
  if (missingActorIds.length > 0) {
    await Promise.all(missingActorIds.map((actorId) => resolveActiveTasks(actorId, {
      resolutionNote: "Auto-resolved because actor no longer exists.",
    })))
  }

  return refreshed.filter(Boolean)
}

export const refreshAllVerificationTasks = async () => {
  const [actors, tasks] = await Promise.all([
    prisma.actor.findMany({
      select: adminActorReviewSelect,
    }),
    prisma.actorVerificationTask.findMany({
      where: {
        status: {
          in: ACTIVE_TASK_STATUSES,
        },
      },
      orderBy: [{ generatedAt: "desc" }, { createdAt: "desc" }],
    }),
  ])

  const tasksByActorId = new Map<string, typeof tasks>()
  for (const task of tasks) {
    const bucket = tasksByActorId.get(task.actorId) ?? []
    bucket.push(task)
    tasksByActorId.set(task.actorId, bucket)
  }

  const reviewItems = actors.map(buildAdminActorReviewItem)
  const refreshed = await Promise.all(
    reviewItems.map((actor) => syncVerificationTaskForActorItem(actor, tasksByActorId.get(actor.id))),
  )

  const actorIds = new Set(reviewItems.map((actor) => actor.id))
  const orphanedTaskActorIds = Array.from(
    new Set(tasks.map((task) => task.actorId).filter((actorId) => !actorIds.has(actorId))),
  )
  if (orphanedTaskActorIds.length > 0) {
    await Promise.all(
      orphanedTaskActorIds.map((actorId) =>
        resolveActiveTasks(actorId, {
          resolutionNote: "Auto-resolved because actor no longer exists.",
        }),
      ),
    )
  }

  return refreshed.filter(Boolean)
}

export const listAdminVerificationTasks = async (filters: VerificationTaskFilters = {}) => {
  const tasks = await prisma.actorVerificationTask.findMany({
    where: {
      status: filters.status
        ? filters.status
        : {
            in: ACTIVE_TASK_STATUSES,
          },
      ...(filters.dueState ? { dueState: filters.dueState } : {}),
    },
    include: {
      actor: {
        select: adminActorReviewSelect,
      },
    },
    orderBy: [{ generatedAt: "desc" }, { createdAt: "desc" }],
  })

  return tasks
    .map(serializeTask)
    .filter((task) => {
      if (filters.countySlug && task.actor.countySlug !== filters.countySlug) return false
      if (filters.pilot !== null && filters.pilot !== undefined && task.actor.isPilotCounty !== filters.pilot) {
        return false
      }
      return true
    })
    .sort((left, right) => {
      if (left.priorityRank !== right.priorityRank) {
        return left.priorityRank - right.priorityRank
      }
      return new Date(right.generatedAt).getTime() - new Date(left.generatedAt).getTime()
    })
}

export const updateVerificationTaskStatus = async (
  taskId: string,
  input: {
    action: "snooze" | "resolve"
    snoozeUntil?: Date | null
    note?: string | null
    resolvedById?: string | null
  },
) => {
  const existing = await prisma.actorVerificationTask.findUnique({
    where: { id: taskId },
    include: {
      actor: {
        select: adminActorReviewSelect,
      },
    },
  })

  if (!existing) {
    throw new Error("Verification task ble ikke funnet.")
  }

  if (input.action === "snooze") {
    if (!input.snoozeUntil) {
      throw new Error("snoozeUntil er påkrevd for snoozing.")
    }
    if (Number.isNaN(input.snoozeUntil.getTime())) {
      throw new Error("snoozeUntil må være en gyldig dato.")
    }
    if (input.snoozeUntil.getTime() <= Date.now()) {
      throw new Error("snoozeUntil må være i fremtiden.")
    }

    const updated = await prisma.actorVerificationTask.update({
      where: { id: taskId },
      data: {
        status: ActorVerificationTaskStatus.snoozed,
        snoozeUntil: input.snoozeUntil,
        resolutionNote: input.note ?? null,
        resolvedAt: null,
        resolvedById: null,
      },
      include: {
        actor: {
          select: adminActorReviewSelect,
        },
      },
    })

    return serializeTask(updated)
  }

  const resolvedAt = new Date()
  const updated = await prisma.actorVerificationTask.update({
    where: { id: taskId },
    data: {
      status: ActorVerificationTaskStatus.resolved,
      resolvedAt,
      resolvedById: input.resolvedById ?? null,
      resolutionNote: input.note ?? null,
      snoozeUntil: null,
    },
    include: {
      actor: {
        select: adminActorReviewSelect,
      },
    },
  })

  return serializeTask(updated)
}

export const resolveVerificationTasksForActor = async (
  actorId: string,
  options?: {
    resolvedById?: string | null
    resolutionNote?: string | null
  },
) => {
  await resolveActiveTasks(actorId, {
    resolvedById: options?.resolvedById ?? null,
    resolutionNote: options?.resolutionNote ?? null,
  })
}
