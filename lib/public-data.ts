import "server-only"

import { cookies, headers } from "next/headers"
import type {
  Actor,
  ActorCategory,
  Challenge,
  Co2eSource,
  Co2eSourceItem,
  DetailedFact,
  Fact,
  QuizLevel,
  QuizQuestion,
  QuizResult,
  RepairData,
  RepairEstimate,
  RepairService,
  Source,
  SourceType,
} from "@/lib/data"
import type { ItemType, ProblemType } from "@/lib/decision-engine"

type ActorRecord = {
  id: string
  name: string
  slug: string
  category: ActorCategory
  description: string
  longDescription: string
  address: string
  lat: number
  lng: number
  phone: string | null
  email: string | null
  website: string | null
  instagram: string | null
  openingHours: string[]
  openingHoursOsm: string | null
  tags: string[]
  benefits: string[]
  howToUse: string[]
  image: string | null
}

type ActorSourceRecord = {
  id: string
  actorId: string
  type: SourceType
  title: string
  url: string
  capturedAt: string | null
  note: string | null
}

type ActorRepairServiceRecord = {
  id: string
  actorId: string
  problemType: ProblemType
  itemTypes: ItemType[]
  priceMin: number
  priceMax: number
  etaDays: number | null
}

type ChallengeRecord = {
  id: string
  key: string
  title: string
  description: string
  points: number
  icon: string
  category: ActorCategory
}

type QuizQuestionRecord = {
  id: string
  key: string
  question: string
  sortOrder: number
}

type QuizOptionRecord = {
  id: string
  questionId: string
  text: string
  points: number
  sortOrder: number
}

type QuizResultRecord = {
  id: string
  level: QuizLevel
  title: string
  description: string
  tips: string[]
  badge: string
}

type RepairEstimateRecord = RepairEstimate & {
  id: string
  itemType: ItemType
  problemType: ProblemType
}

type FactRecord = Fact & {
  id: string
  key: string
  sortOrder: number
}

type DetailedFactRecord = Omit<DetailedFact, "sources"> & {
  id: string
  key: string
  sortOrder: number
}

type DetailedFactSourceRecord = {
  id: string
  detailedFactId: string
  name: string
  url: string
  sortOrder: number
}

type Co2eSourceRecord = {
  id: string
  key: string
  title: string
  url: string
  capturedAt: string | null
  anchors: string[]
}

type Co2eSourceItemRecord = {
  id: string
  sourceId: string
  itemType: ItemType
}

const getBaseUrl = async () => {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL
  if (envUrl) {
    return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`
  }

  const headerList = await headers()
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
  const proto = headerList.get("x-forwarded-proto") ?? "http"
  if (host) {
    return `${proto}://${host}`
  }

  return "http://localhost:3000"
}

const formatDate = (value: string | null) => {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().slice(0, 10)
}

const fetchPublic = async <T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> => {
  const baseUrl = await getBaseUrl()
  const url = new URL(path, baseUrl)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const cookieHeader = (await cookies()).toString()
  const response = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  })
  if (!response.ok) {
    throw new Error(`Public API request failed: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}

const groupBy = <T extends Record<string, any>>(items: T[], key: keyof T) => {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const groupKey = String(item[key] ?? "")
    if (!groupKey) continue
    const bucket = map.get(groupKey)
    if (bucket) {
      bucket.push(item)
    } else {
      map.set(groupKey, [item])
    }
  }
  return map
}

const mapSource = (source: ActorSourceRecord): Source => ({
  type: source.type,
  title: source.title,
  url: source.url,
  capturedAt: formatDate(source.capturedAt),
  note: source.note ?? undefined,
})

const mapService = (service: ActorRepairServiceRecord): RepairService => ({
  problemType: service.problemType,
  itemTypes: service.itemTypes.length ? service.itemTypes : undefined,
  priceMin: service.priceMin,
  priceMax: service.priceMax,
  etaDays: service.etaDays ?? undefined,
})

const mapActor = (
  actor: ActorRecord,
  sources: ActorSourceRecord[],
  services: ActorRepairServiceRecord[],
): Actor => ({
  ...actor,
  sources: sources.map(mapSource),
  repairServices: services.map(mapService),
})

export const getActors = async (): Promise<Actor[]> => {
  const [actors, sources, services] = await Promise.all([
    fetchPublic<ActorRecord[]>("/api/public/actors"),
    fetchPublic<ActorSourceRecord[]>("/api/public/actor-sources"),
    fetchPublic<ActorRepairServiceRecord[]>("/api/public/actor-repair-services"),
  ])
  const sourcesByActor = groupBy(sources, "actorId")
  const servicesByActor = groupBy(services, "actorId")

  return actors.map((actor) =>
    mapActor(actor, sourcesByActor.get(actor.id) ?? [], servicesByActor.get(actor.id) ?? []),
  )
}

export const getActorBySlug = async (slug: string): Promise<Actor | null> => {
  const actors = await fetchPublic<ActorRecord[]>("/api/public/actors", { slug })
  const actor = actors[0]
  if (!actor) return null

  const [sources, services] = await Promise.all([
    fetchPublic<ActorSourceRecord[]>("/api/public/actor-sources", { actorId: actor.id }),
    fetchPublic<ActorRepairServiceRecord[]>("/api/public/actor-repair-services", { actorId: actor.id }),
  ])

  return mapActor(actor, sources, services)
}

export const getChallenges = async (): Promise<Challenge[]> => {
  const challenges = await fetchPublic<ChallengeRecord[]>("/api/public/challenges")
  return challenges.map((challenge) => ({
    id: challenge.id,
    key: challenge.key,
    title: challenge.title,
    description: challenge.description,
    points: challenge.points,
    icon: challenge.icon,
    category: challenge.category,
  }))
}

export const getQuizData = async (): Promise<{
  quizQuestions: QuizQuestion[]
  quizResults: Record<QuizLevel, QuizResult>
}> => {
  const [questions, options, results] = await Promise.all([
    fetchPublic<QuizQuestionRecord[]>("/api/public/quiz-questions"),
    fetchPublic<QuizOptionRecord[]>("/api/public/quiz-options"),
    fetchPublic<QuizResultRecord[]>("/api/public/quiz-results"),
  ])

  const optionsByQuestion = groupBy(options, "questionId")
  const quizQuestions = [...questions]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((question) => ({
      id: question.id,
      question: question.question,
      options: (optionsByQuestion.get(question.id) ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((option) => ({ text: option.text, points: option.points })),
    }))

  const quizResults = results.reduce(
    (acc, result) => {
      acc[result.level] = {
        level: result.level,
        title: result.title,
        description: result.description,
        tips: result.tips,
        badge: result.badge,
      }
      return acc
    },
    {} as Record<QuizLevel, QuizResult>,
  )

  return { quizQuestions, quizResults }
}

export const getRepairData = async (): Promise<RepairData> => {
  const items = await fetchPublic<RepairEstimateRecord[]>("/api/public/repair-estimates")
  const data: RepairData = {}

  for (const item of items) {
    if (!data[item.itemType]) {
      data[item.itemType] = {}
    }
    data[item.itemType][item.problemType] = {
      itemType: item.itemType,
      problemType: item.problemType,
      deviceType: item.deviceType,
      issue: item.issue,
      repairCostMin: item.repairCostMin,
      repairCostMax: item.repairCostMax,
      repairDays: item.repairDays,
      usedPriceMin: item.usedPriceMin,
      usedPriceMax: item.usedPriceMax,
      newPrice: item.newPrice,
      co2Saved: item.co2Saved,
    }
  }

  return data
}

export const getFacts = async (): Promise<Fact[]> => {
  const facts = await fetchPublic<FactRecord[]>("/api/public/facts")
  return facts.map((fact) => ({
    title: fact.title,
    stat: fact.stat,
    description: fact.description,
    icon: fact.icon,
  }))
}

export const getDetailedFacts = async (): Promise<DetailedFact[]> => {
  const [facts, sources] = await Promise.all([
    fetchPublic<DetailedFactRecord[]>("/api/public/detailed-facts"),
    fetchPublic<DetailedFactSourceRecord[]>("/api/public/detailed-fact-sources"),
  ])
  const sourcesByFact = groupBy(sources, "detailedFactId")

  return facts.map((fact) => ({
    category: fact.category,
    icon: fact.icon,
    title: fact.title,
    content: fact.content,
    tips: fact.tips,
    sources: (sourcesByFact.get(fact.id) ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((source) => ({ name: source.name, url: source.url })),
  }))
}

export const getCo2eSources = async (): Promise<Co2eSource[]> => {
  const sources = await fetchPublic<Co2eSourceRecord[]>("/api/public/co2e-sources")
  return sources.map((source) => ({
    id: source.id,
    key: source.key,
    title: source.title,
    url: source.url,
    capturedAt: formatDate(source.capturedAt),
    anchors: source.anchors ?? [],
  }))
}

export const getCo2eSourceItems = async (): Promise<Co2eSourceItem[]> => {
  const items = await fetchPublic<Co2eSourceItemRecord[]>("/api/public/co2e-source-items")
  return items.map((item) => ({
    id: item.id,
    sourceId: item.sourceId,
    itemType: item.itemType,
  }))
}
