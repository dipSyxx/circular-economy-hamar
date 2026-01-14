import type { DecisionInput, Recommendation, ItemType, ProblemType, Priority } from "@/lib/decision-engine"

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

  profile.actions.unshift({
    id: crypto.randomUUID(),
    type,
    createdAt: new Date().toISOString(),
    meta,
    points,
  })

  profile.actions = profile.actions.slice(0, maxActions)
}

export const recordAction = (type: ActionType, meta?: Record<string, string>, points?: number) => {
  const profile = loadProfile()
  applyAction(profile, type, points, meta)
  saveProfile(profile)
  return profile
}

export const recordDecision = (input: DecisionInput, recommendation: Recommendation, impactScore: number, savings: [number, number]) => {
  const profile = loadProfile()
  const entry: DecisionEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    itemType: input.itemType,
    problemType: input.problemType,
    recommendation,
    budgetNok: input.budgetNok,
    timeDays: input.timeDays,
    priority: input.priority,
    impactScore,
    savingsMin: savings[0],
    savingsMax: savings[1],
  }

  profile.decisionHistory.unshift(entry)
  profile.decisionHistory = profile.decisionHistory.slice(0, maxDecisions)

  applyAction(profile, "decision_complete")
  saveProfile(profile)

  return profile
}

export const completeChallenge = (challengeId: string, points: number) => {
  const profile = loadProfile()
  if (!profile.completedChallenges.includes(challengeId)) {
    profile.completedChallenges.push(challengeId)
    applyAction(profile, "challenge_complete", points, { challengeId })
    saveProfile(profile)
  }

  return profile
}

export const resetProfile = () => {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STORAGE_KEY)
}
