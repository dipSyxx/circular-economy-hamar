import type {
  ConfidenceLevel,
  DecisionInput,
  DecisionOption,
  DecisionOutput,
  DecisionStatus,
  ItemType,
  PlanB,
  ProblemType,
  Priority,
  Recommendation,
  ReasonKey,
} from "@/lib/decision-system"
import { deriveDecisionOutcomeMetrics } from "@/lib/decision-system"

export type ActionType =
  | "decision_complete"
  | "go_call"
  | "go_directions"
  | "go_website"
  | "open_actor"
  | "challenge_complete"

export interface UserAction {
  id: string
  type: ActionType
  createdAt: string
  meta?: Record<string, string>
  points: number
}

export interface DecisionEntry {
  id: string
  createdAt: string
  itemType: ItemType
  problemType: ProblemType
  recommendation: Recommendation
  budgetNok: number
  timeDays: number
  priority?: Priority
  impactScore: number
  savingsMin: number
  savingsMax: number
  status?: DecisionStatus
  confidence?: ConfidenceLevel
  recommendedFeasible?: boolean
  bestFeasibleOption?: Recommendation | null
  modelRepairabilityScore?: number
  co2eSavedMin?: number
  co2eSavedMax?: number
  explainability?: ReasonKey[]
  options?: DecisionOption[]
  planB?: PlanB | null
}

export interface ProfileData {
  score: number
  streakDays: number
  lastActionDate?: string
  completedChallenges: string[]
  decisionHistory: DecisionEntry[]
  actions: UserAction[]
}

const STORAGE_KEY = "sirkulaer_profile_v1"

const DEFAULT_PROFILE: ProfileData = {
  score: 0,
  streakDays: 0,
  completedChallenges: [],
  decisionHistory: [],
  actions: [],
}

const actionPoints: Record<ActionType, number> = {
  decision_complete: 5,
  go_call: 3,
  go_directions: 2,
  go_website: 1,
  open_actor: 1,
  challenge_complete: 0,
}

const maxActions = 20
const maxDecisions = 10
let remoteProfileId: string | null | undefined

const getDateKey = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const parts = formatter.formatToParts(date)
  const year = parts.find((part) => part.type === "year")?.value ?? "1970"
  const month = parts.find((part) => part.type === "month")?.value ?? "01"
  const day = parts.find((part) => part.type === "day")?.value ?? "01"
  return `${year}-${month}-${day}`
}

const diffInDays = (current: string, previous: string) => {
  const [currentYear, currentMonth, currentDay] = current.split("-").map(Number)
  const [previousYear, previousMonth, previousDay] = previous.split("-").map(Number)
  const currentDate = Date.UTC(currentYear, currentMonth - 1, currentDay)
  const previousDate = Date.UTC(previousYear, previousMonth - 1, previousDay)
  const diffMs = currentDate - previousDate
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

const updateStreak = (profile: ProfileData, dateKey: string) => {
  if (!profile.lastActionDate) {
    profile.streakDays = 1
    profile.lastActionDate = dateKey
    return
  }

  if (profile.lastActionDate === dateKey) {
    return
  }

  const dayDiff = diffInDays(dateKey, profile.lastActionDate)
  profile.streakDays = dayDiff === 1 ? profile.streakDays + 1 : 1
  profile.lastActionDate = dateKey
}

const resolveRemoteProfileId = async () => {
  if (remoteProfileId !== undefined) return remoteProfileId

  try {
    const response = await fetch("/api/public/user-profiles", { cache: "no-store" })
    if (!response.ok) {
      remoteProfileId = null
      return remoteProfileId
    }
    const profiles = (await response.json()) as Array<{ id: string }>
    remoteProfileId = profiles[0]?.id ?? null
    return remoteProfileId
  } catch {
    remoteProfileId = null
    return remoteProfileId
  }
}

const syncRemoteProfile = async (profile: ProfileData) => {
  try {
    const id = await resolveRemoteProfileId()
    const payload = {
      score: profile.score,
      streakDays: profile.streakDays,
      lastActionDate: profile.lastActionDate ?? null,
    }

    if (id) {
      await fetch(`/api/public/user-profiles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      return
    }

    const response = await fetch("/api/public/user-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!response.ok) return
    const created = (await response.json()) as { id?: string }
    remoteProfileId = created.id ?? null
  } catch {
    // ignore optional remote sync failures
  }
}

const persistRemoteAction = async (action: UserAction) => {
  try {
    await fetch("/api/public/user-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: action.type,
        points: action.points,
        meta: action.meta ?? {},
      }),
    })
  } catch {
    // ignore optional remote sync failures
  }
}

const persistRemoteDecision = async (decision: DecisionEntry) => {
  try {
    await fetch("/api/public/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemType: decision.itemType,
        problemType: decision.problemType,
        recommendation: decision.recommendation,
        priority: decision.priority,
        status: decision.status,
        confidence: decision.confidence,
        recommendedFeasible: decision.recommendedFeasible,
        bestFeasibleOption: decision.bestFeasibleOption,
        budgetNok: decision.budgetNok,
        timeDays: decision.timeDays,
        modelRepairabilityScore: decision.modelRepairabilityScore,
        impactScore: decision.impactScore,
        savingsMin: decision.savingsMin,
        savingsMax: decision.savingsMax,
        co2eSavedMin: decision.co2eSavedMin,
        co2eSavedMax: decision.co2eSavedMax,
        explainability: decision.explainability,
        options: decision.options,
        planB: decision.planB,
      }),
    })
  } catch {
    // ignore optional remote sync failures
  }
}

const persistChallengeCompletion = async (challengeId: string, points: number) => {
  try {
    await fetch("/api/user/challenge-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, points }),
    })
  } catch {
    // ignore optional remote sync failures
  }
}

export const recordQuizAttempt = async (payload: {
  score: number
  maxScore: number
  level: string
  answers: number[]
}) => {
  try {
    await fetch("/api/user/quiz-attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch {
    // ignore optional remote sync failures
  }
}

export const loadProfile = (): ProfileData => {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE }
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return { ...DEFAULT_PROFILE }

  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PROFILE }
  }
}

const saveProfile = (profile: ProfileData) => {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

const applyAction = (profile: ProfileData, type: ActionType, points = actionPoints[type], meta?: Record<string, string>) => {
  const dateKey = getDateKey()
  updateStreak(profile, dateKey)
  profile.score += points

  const action: UserAction = {
    id: crypto.randomUUID(),
    type,
    createdAt: new Date().toISOString(),
    meta,
    points,
  }

  profile.actions.unshift(action)
  profile.actions = profile.actions.slice(0, maxActions)

  void persistRemoteAction(action)
}

export const recordAction = (type: ActionType, meta?: Record<string, string>, points?: number) => {
  const profile = loadProfile()
  applyAction(profile, type, points, meta)
  saveProfile(profile)
  void syncRemoteProfile(profile)
  return profile
}

export const recordDecision = (
  input: DecisionInput,
  decision: DecisionOutput,
) => {
  const profile = loadProfile()
  const metrics = deriveDecisionOutcomeMetrics(decision)
  const entry: DecisionEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    itemType: input.itemType,
    problemType: input.problemType,
    recommendation: decision.recommendation,
    budgetNok: input.budgetNok,
    timeDays: input.timeDays,
    priority: input.priority,
    impactScore: metrics.impactScore,
    savingsMin: metrics.savingsMin,
    savingsMax: metrics.savingsMax,
    status: decision.status,
    confidence: decision.confidence,
    recommendedFeasible: decision.recommendedFeasible,
    bestFeasibleOption: decision.bestFeasibleOption,
    modelRepairabilityScore: input.modelRepairabilityScore,
    co2eSavedMin: metrics.co2eSavedMin,
    co2eSavedMax: metrics.co2eSavedMax,
    explainability: decision.explainability,
    options: decision.options,
    planB: decision.planB,
  }

  profile.decisionHistory.unshift(entry)
  profile.decisionHistory = profile.decisionHistory.slice(0, maxDecisions)

  applyAction(profile, "decision_complete")
  saveProfile(profile)
  void persistRemoteDecision(entry)
  void syncRemoteProfile(profile)

  return profile
}

export const completeChallenge = (challengeId: string, points: number) => {
  const profile = loadProfile()
  if (!profile.completedChallenges.includes(challengeId)) {
    profile.completedChallenges.push(challengeId)
    applyAction(profile, "challenge_complete", points, { challengeId })
    saveProfile(profile)
    void persistChallengeCompletion(challengeId, points)
    void syncRemoteProfile(profile)
  }

  return profile
}

export const resetProfile = () => {
  if (typeof window === "undefined") return
  remoteProfileId = undefined
  window.localStorage.removeItem(STORAGE_KEY)
}

export const mergeRemoteProfile = (remote: ProfileData) => {
  const local = loadProfile()

  const mergedDecisionIds = new Set<string>()
  const mergedDecisions: DecisionEntry[] = []
  for (const entry of [...local.decisionHistory, ...remote.decisionHistory]) {
    if (!mergedDecisionIds.has(entry.id)) {
      mergedDecisionIds.add(entry.id)
      mergedDecisions.push(entry)
    }
  }

  const mergedActionIds = new Set<string>()
  const mergedActions: UserAction[] = []
  for (const action of [...local.actions, ...remote.actions]) {
    if (!mergedActionIds.has(action.id)) {
      mergedActionIds.add(action.id)
      mergedActions.push(action)
    }
  }

  const mergedChallenges = Array.from(
    new Set([...local.completedChallenges, ...remote.completedChallenges]),
  )

  const remoteLastDate = remote.lastActionDate ?? null
  const localLastDate = local.lastActionDate ?? null
  const lastActionDate =
    remoteLastDate && localLastDate
      ? remoteLastDate >= localLastDate
        ? remoteLastDate
        : localLastDate
      : remoteLastDate ?? localLastDate ?? undefined

  const merged: ProfileData = {
    score: Math.max(local.score, remote.score),
    streakDays: remote.streakDays,
    lastActionDate,
    completedChallenges: mergedChallenges,
    decisionHistory: mergedDecisions.slice(0, maxDecisions),
    actions: mergedActions.slice(0, maxActions),
  }

  saveProfile(merged)
}
