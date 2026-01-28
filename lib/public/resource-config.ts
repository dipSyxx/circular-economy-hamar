import "server-only"

type OwnerCheck =
  | { type: "user"; field: string; statusField?: string; allowedStatuses?: string[] }
  | { type: "actor"; actorIdField: string; allowedStatuses?: string[] }

export type PublicResourceConfig = {
  model: string
  orderBy?: unknown
  allowUnauthenticatedRead?: boolean
  readUsesUser?: boolean
  listWhere?: (context: { userId?: string | null; searchParams: URLSearchParams }) => Record<string, unknown>
  detailWhere?: (context: { userId?: string | null; id: string }) => Record<string, unknown>
  create?: {
    fields: string[]
    ownerCheck?: OwnerCheck
    transform?: (data: Record<string, unknown>, context: { userId: string }) => Record<string, unknown>
  }
  update?: {
    fields: string[]
    ownerCheck?: OwnerCheck
    transform?: (data: Record<string, unknown>, context: { userId: string }) => Record<string, unknown>
  }
  remove?: {
    ownerCheck?: OwnerCheck
  }
}

const pickFields = (payload: Record<string, unknown>, fields: string[]) => {
  const data: Record<string, unknown> = {}
  for (const field of fields) {
    if (payload[field] !== undefined) {
      data[field] = payload[field]
    }
  }
  return data
}

const parseDate = (value: unknown) => {
  if (typeof value !== "string" || !value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const actorFields = [
  "name",
  "slug",
  "category",
  "description",
  "longDescription",
  "address",
  "lat",
  "lng",
  "phone",
  "email",
  "website",
  "instagram",
  "openingHours",
  "openingHoursOsm",
  "tags",
  "benefits",
  "howToUse",
  "image",
]

export const publicResourceConfig: Record<string, PublicResourceConfig> = {
  actors: {
    model: "actor",
    orderBy: { updatedAt: "desc" },
    allowUnauthenticatedRead: true,
    readUsesUser: true,
    listWhere: ({ searchParams }) => {
      const category = searchParams.get("category")
      const slug = searchParams.get("slug")
      const id = searchParams.get("id")
      const idsParam = searchParams.get("ids")
      const ids = idsParam
        ? idsParam
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : []
      const base = { status: "approved" }
      const filters = []
      if (category) filters.push({ category })
      if (slug) filters.push({ slug })
      if (id) filters.push({ id })
      if (ids.length) filters.push({ id: { in: ids } })
      return filters.length ? { AND: [base, ...filters] } : base
    },
    detailWhere: ({ userId, id }) => {
      const base = userId
        ? { OR: [{ status: "approved" }, { createdById: userId }] }
        : { status: "approved" }
      return { AND: [base, { id }] }
    },
    create: {
      fields: actorFields,
      ownerCheck: { type: "user", field: "createdById" },
      transform: (data, context) => ({
        ...data,
        status: "pending",
        createdById: context.userId,
        reviewedById: null,
        reviewedAt: null,
      }),
    },
    update: {
      fields: actorFields,
      ownerCheck: { type: "user", field: "createdById", statusField: "status", allowedStatuses: ["pending", "rejected"] },
      transform: (data) => ({ ...data, status: "pending", reviewedById: null, reviewedAt: null }),
    },
    remove: {
      ownerCheck: { type: "user", field: "createdById", statusField: "status", allowedStatuses: ["pending", "rejected"] },
    },
  },
  "actor-repair-services": {
    model: "actorRepairService",
    orderBy: [{ actorId: "asc" }, { priceMin: "asc" }],
    allowUnauthenticatedRead: true,
    readUsesUser: true,
    listWhere: ({ userId, searchParams }) => {
      const actorId = searchParams.get("actorId")
      const base = userId
        ? { OR: [{ actor: { status: "approved" } }, { actor: { createdById: userId } }] }
        : { actor: { status: "approved" } }
      if (actorId) {
        return { AND: [base, { actorId }] }
      }
      return base
    },
    detailWhere: ({ userId, id }) => {
      const base = userId
        ? { OR: [{ actor: { status: "approved" } }, { actor: { createdById: userId } }] }
        : { actor: { status: "approved" } }
      return { AND: [base, { id }] }
    },
    create: {
      fields: ["actorId", "problemType", "itemTypes", "priceMin", "priceMax", "etaDays"],
      ownerCheck: { type: "actor", actorIdField: "actorId", allowedStatuses: ["pending", "rejected"] },
    },
    update: {
      fields: ["problemType", "itemTypes", "priceMin", "priceMax", "etaDays"],
      ownerCheck: { type: "actor", actorIdField: "actorId", allowedStatuses: ["pending", "rejected"] },
    },
    remove: {
      ownerCheck: { type: "actor", actorIdField: "actorId", allowedStatuses: ["pending", "rejected"] },
    },
  },
  "actor-sources": {
    model: "actorSource",
    orderBy: [{ actorId: "asc" }, { title: "asc" }],
    allowUnauthenticatedRead: true,
    readUsesUser: true,
    listWhere: ({ userId, searchParams }) => {
      const actorId = searchParams.get("actorId")
      const base = userId
        ? { OR: [{ actor: { status: "approved" } }, { actor: { createdById: userId } }] }
        : { actor: { status: "approved" } }
      if (actorId) {
        return { AND: [base, { actorId }] }
      }
      return base
    },
    detailWhere: ({ userId, id }) => {
      const base = userId
        ? { OR: [{ actor: { status: "approved" } }, { actor: { createdById: userId } }] }
        : { actor: { status: "approved" } }
      return { AND: [base, { id }] }
    },
    create: {
      fields: ["actorId", "type", "title", "url", "capturedAt", "note"],
      ownerCheck: { type: "actor", actorIdField: "actorId", allowedStatuses: ["pending", "rejected"] },
      transform: (data) => ({
        ...data,
        ...(data.capturedAt ? { capturedAt: parseDate(data.capturedAt) } : {}),
      }),
    },
    update: {
      fields: ["type", "title", "url", "capturedAt", "note"],
      ownerCheck: { type: "actor", actorIdField: "actorId", allowedStatuses: ["pending", "rejected"] },
      transform: (data) => ({
        ...data,
        ...(data.capturedAt ? { capturedAt: parseDate(data.capturedAt) } : {}),
      }),
    },
    remove: {
      ownerCheck: { type: "actor", actorIdField: "actorId", allowedStatuses: ["pending", "rejected"] },
    },
  },
  challenges: {
    model: "challenge",
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    allowUnauthenticatedRead: true,
  },
  "quiz-questions": {
    model: "quizQuestion",
    orderBy: [{ sortOrder: "asc" }, { question: "asc" }],
    allowUnauthenticatedRead: true,
  },
  "quiz-options": {
    model: "quizOption",
    orderBy: [{ questionId: "asc" }, { sortOrder: "asc" }],
    allowUnauthenticatedRead: true,
    listWhere: ({ searchParams }) => {
      const questionId = searchParams.get("questionId")
      return questionId ? { questionId } : {}
    },
  },
  "quiz-results": {
    model: "quizResult",
    orderBy: { level: "asc" },
    allowUnauthenticatedRead: true,
  },
  "repair-estimates": {
    model: "repairEstimate",
    orderBy: [{ itemType: "asc" }, { problemType: "asc" }],
    allowUnauthenticatedRead: true,
    listWhere: ({ searchParams }) => {
      const itemType = searchParams.get("itemType")
      const problemType = searchParams.get("problemType")
      const filters: Record<string, unknown> = {}
      if (itemType) filters.itemType = itemType
      if (problemType) filters.problemType = problemType
      return filters
    },
  },
  facts: {
    model: "fact",
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    allowUnauthenticatedRead: true,
  },
  "detailed-facts": {
    model: "detailedFact",
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    allowUnauthenticatedRead: true,
  },
  "detailed-fact-sources": {
    model: "detailedFactSource",
    orderBy: [{ detailedFactId: "asc" }, { sortOrder: "asc" }],
    allowUnauthenticatedRead: true,
    listWhere: ({ searchParams }) => {
      const detailedFactId = searchParams.get("detailedFactId")
      return detailedFactId ? { detailedFactId } : {}
    },
  },
  "co2e-sources": {
    model: "co2eSource",
    orderBy: { title: "asc" },
    allowUnauthenticatedRead: true,
  },
  "co2e-source-items": {
    model: "co2eSourceItem",
    orderBy: [{ itemType: "asc" }, { sourceId: "asc" }],
    allowUnauthenticatedRead: true,
    listWhere: ({ searchParams }) => {
      const itemType = searchParams.get("itemType")
      return itemType ? { itemType } : {}
    },
  },
  users: {
    model: "user",
    orderBy: { createdAt: "desc" },
    listWhere: ({ userId }) => ({ id: userId ?? "" }),
    detailWhere: ({ userId, id }) => ({ id, ...(userId ? { id: userId } : {}) }),
    update: {
      fields: ["name", "imageUrl"],
      ownerCheck: { type: "user", field: "id" },
    },
  },
  "user-profiles": {
    model: "userProfile",
    orderBy: { createdAt: "desc" },
    listWhere: ({ userId }) => ({ userId: userId ?? "" }),
    create: {
      fields: ["score", "streakDays", "lastActionDate"],
      ownerCheck: { type: "user", field: "userId" },
      transform: (data, context) => ({
        ...data,
        userId: context.userId,
        ...(data.lastActionDate ? { lastActionDate: parseDate(data.lastActionDate) } : {}),
      }),
    },
    update: {
      fields: ["score", "streakDays", "lastActionDate"],
      ownerCheck: { type: "user", field: "userId" },
      transform: (data) => ({
        ...data,
        ...(data.lastActionDate ? { lastActionDate: parseDate(data.lastActionDate) } : {}),
      }),
    },
    remove: { ownerCheck: { type: "user", field: "userId" } },
  },
  "user-actions": {
    model: "userAction",
    orderBy: { createdAt: "desc" },
    listWhere: ({ userId }) => ({ userId: userId ?? "" }),
    create: {
      fields: ["type", "points", "meta"],
      ownerCheck: { type: "user", field: "userId" },
      transform: (data, context) => ({ ...data, userId: context.userId }),
    },
    update: {
      fields: ["type", "points", "meta"],
      ownerCheck: { type: "user", field: "userId" },
    },
    remove: { ownerCheck: { type: "user", field: "userId" } },
  },
  decisions: {
    model: "decision",
    orderBy: { createdAt: "desc" },
    listWhere: ({ userId }) => ({ userId: userId ?? "" }),
    create: {
      fields: [
        "itemType",
        "problemType",
        "recommendation",
        "priority",
        "status",
        "confidence",
        "recommendedFeasible",
        "bestFeasibleOption",
        "budgetNok",
        "timeDays",
        "modelRepairabilityScore",
        "impactScore",
        "savingsMin",
        "savingsMax",
        "co2eSavedMin",
        "co2eSavedMax",
        "explainability",
        "options",
        "planB",
      ],
      ownerCheck: { type: "user", field: "userId" },
      transform: (data, context) => ({ ...data, userId: context.userId }),
    },
    update: {
      fields: [
        "itemType",
        "problemType",
        "recommendation",
        "priority",
        "status",
        "confidence",
        "recommendedFeasible",
        "bestFeasibleOption",
        "budgetNok",
        "timeDays",
        "modelRepairabilityScore",
        "impactScore",
        "savingsMin",
        "savingsMax",
        "co2eSavedMin",
        "co2eSavedMax",
        "explainability",
        "options",
        "planB",
      ],
      ownerCheck: { type: "user", field: "userId" },
    },
    remove: { ownerCheck: { type: "user", field: "userId" } },
  },
  "challenge-completions": {
    model: "challengeCompletion",
    orderBy: { createdAt: "desc" },
    listWhere: ({ userId }) => ({ userId: userId ?? "" }),
    create: {
      fields: ["challengeId", "points"],
      ownerCheck: { type: "user", field: "userId" },
      transform: (data, context) => ({ ...data, userId: context.userId }),
    },
    update: {
      fields: ["points"],
      ownerCheck: { type: "user", field: "userId" },
    },
    remove: { ownerCheck: { type: "user", field: "userId" } },
  },
  "quiz-attempts": {
    model: "quizAttempt",
    orderBy: { createdAt: "desc" },
    listWhere: ({ userId }) => ({ userId: userId ?? "" }),
    create: {
      fields: ["score", "maxScore", "level", "answers"],
      ownerCheck: { type: "user", field: "userId" },
      transform: (data, context) => ({ ...data, userId: context.userId }),
    },
    update: {
      fields: ["score", "maxScore", "level", "answers"],
      ownerCheck: { type: "user", field: "userId" },
    },
    remove: { ownerCheck: { type: "user", field: "userId" } },
  },
}

export const publicResourceUtils = {
  pickFields,
}
