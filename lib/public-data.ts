import "server-only"

import { unstable_cache } from "next/cache"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getActorTrustState } from "@/lib/actor-trust"
import { getActorQualitySummary } from "@/lib/source-quality"
import {
  filterActorsByCountyScope,
  filterActorsByMunicipalityScope,
} from "@/lib/actor-scope"
import type {
  Actor,
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
} from "@/lib/data"

const formatDate = (value?: Date | null) => {
  if (!value) return undefined
  return value.toISOString().slice(0, 10)
}

const actorPublicInclude = {
  baseCounty: true,
  baseMunicipality: {
    include: {
      county: true,
    },
  },
  serviceAreas: {
    include: {
      county: true,
      municipality: {
        include: {
          county: true,
        },
      },
    },
  },
  repairServices: true,
  sources: true,
} as const satisfies Prisma.ActorInclude

const fetchApprovedActorRows = (orderBy: Prisma.ActorFindManyArgs["orderBy"]) =>
  prisma.actor.findMany({
    where: { status: "approved" },
    include: actorPublicInclude,
    orderBy,
  })

type PublicActorRecord = Awaited<ReturnType<typeof fetchApprovedActorRows>>[number]

const mapActorRecord = (actor: PublicActorRecord): Actor => {
  const qualitySummary = getActorQualitySummary({
    verificationStatus: actor.verificationStatus,
    verifiedAt: actor.verifiedAt,
    sources: actor.sources.map((source) => ({
      type: source.type,
      title: source.title,
      url: source.url,
      capturedAt: source.capturedAt,
      note: source.note,
    })),
  })
  const sourceCount = qualitySummary.uniqueSourceCount
  const trustState = getActorTrustState({
    verificationStatus: actor.verificationStatus,
    verifiedAt: actor.verifiedAt,
    sourceCount,
    qualitySummary,
  })
  const countyName = actor.baseCounty?.name ?? actor.baseMunicipality?.county.name ?? actor.county ?? undefined
  const countySlug = actor.baseCounty?.slug ?? actor.baseMunicipality?.county.slug ?? actor.countySlug ?? undefined
  const municipalityName = actor.baseMunicipality?.name ?? actor.municipality ?? undefined
  const municipalitySlug = actor.baseMunicipality?.slug ?? actor.municipalitySlug ?? undefined
  const serviceAreaCountySlugs = Array.from(
    new Set(
      actor.serviceAreas.flatMap((serviceArea) => {
        if (serviceArea.county?.slug) return [serviceArea.county.slug]
        if (serviceArea.municipality?.county.slug) return [serviceArea.municipality.county.slug]
        return []
      }),
    ),
  )
  const serviceAreaMunicipalitySlugs = Array.from(
    new Set(
      actor.serviceAreas.flatMap((serviceArea) =>
        serviceArea.municipality?.slug ? [serviceArea.municipality.slug] : [],
      ),
    ),
  )

  return {
    id: actor.id,
    name: actor.name,
    slug: actor.slug,
    category: actor.category,
    description: actor.description,
    longDescription: actor.longDescription,
    address: actor.address,
    postalCode: actor.postalCode,
    country: actor.country ?? undefined,
    county: countyName,
    countySlug,
    municipality: municipalityName,
    municipalitySlug,
    city: actor.city ?? undefined,
    area: actor.area,
    lat: actor.lat,
    lng: actor.lng,
    phone: actor.phone,
    email: actor.email,
    website: actor.website,
    instagram: actor.instagram,
    openingHours: actor.openingHours,
    openingHoursOsm: actor.openingHoursOsm,
    tags: actor.tags,
    benefits: actor.benefits,
    howToUse: actor.howToUse,
    image: actor.image,
    nationwide: actor.nationwide,
    serviceAreaCountySlugs,
    serviceAreaMunicipalitySlugs,
    verificationStatus: actor.verificationStatus,
    verifiedAt: formatDate(actor.verifiedAt),
    freshnessStatus: trustState.freshnessStatus,
    isTrusted: trustState.isTrusted,
    sourceCount,
    dueState: qualitySummary.dueState,
    qualitySummary,
    repairServices: actor.repairServices.map((service) => ({
      problemType: service.problemType,
      itemTypes: service.itemTypes.length ? service.itemTypes : undefined,
      priceMin: service.priceMin,
      priceMax: service.priceMax,
      etaDays: service.etaDays ?? undefined,
    })),
    sources: actor.sources.map((source) => ({
      type: source.type,
      title: source.title,
      url: source.url,
      capturedAt: formatDate(source.capturedAt),
      note: source.note ?? undefined,
    })),
  }
}

const getActorsCached = unstable_cache(
  async (): Promise<Actor[]> => {
    const actors = await fetchApprovedActorRows([
        { nationwide: "desc" },
        { county: "asc" },
        { municipality: "asc" },
        { name: "asc" },
      ])

    return actors.map(mapActorRecord)
  },
  ["public-actors"],
  { revalidate: 300, tags: ["public-actors"] },
)

const getLatestActorsCached = unstable_cache(
  async (limit: number): Promise<Actor[]> => {
    const actors = await fetchApprovedActorRows([
      { createdAt: "desc" },
      { updatedAt: "desc" },
      { name: "asc" },
    ])

    return actors.slice(0, limit).map(mapActorRecord)
  },
  ["public-latest-actors"],
  { revalidate: 300, tags: ["public-actors"] },
)

const getChallengesCached = unstable_cache(
  async (): Promise<Challenge[]> => {
    const challenges = await prisma.challenge.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    })

    return challenges.map((challenge) => ({
      id: challenge.id,
      key: challenge.key,
      title: challenge.title,
      description: challenge.description,
      points: challenge.points,
      icon: challenge.icon,
      category: challenge.category,
    }))
  },
  ["public-challenges"],
  { revalidate: 300, tags: ["public-challenges"] },
)

const getQuizDataCached = unstable_cache(
  async (): Promise<{
    quizQuestions: QuizQuestion[]
    quizResults: Record<QuizLevel, QuizResult>
  }> => {
    const [questions, results] = await Promise.all([
      prisma.quizQuestion.findMany({
        include: { options: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.quizResult.findMany({ orderBy: { level: "asc" } }),
    ])

    const quizQuestions = questions.map((question) => ({
      id: question.id,
      question: question.question,
      options: question.options.map((option) => ({
        text: option.text,
        points: option.points,
      })),
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
  },
  ["public-quiz"],
  { revalidate: 300, tags: ["public-quiz"] },
)

const getRepairDataCached = unstable_cache(
  async (): Promise<RepairData> => {
    const items = await prisma.repairEstimate.findMany({
      orderBy: [{ itemType: "asc" }, { problemType: "asc" }],
    })
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
  },
  ["public-repair-data"],
  { revalidate: 300, tags: ["public-repair-data"] },
)

const getFactsCached = unstable_cache(
  async (): Promise<Fact[]> => {
    const facts = await prisma.fact.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    })

    return facts.map((fact) => ({
      title: fact.title,
      stat: fact.stat,
      description: fact.description,
      icon: fact.icon,
    }))
  },
  ["public-facts"],
  { revalidate: 300, tags: ["public-facts"] },
)

const getDetailedFactsCached = unstable_cache(
  async (): Promise<DetailedFact[]> => {
    const facts = await prisma.detailedFact.findMany({
      include: {
        sources: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    })

    return facts.map((fact) => ({
      category: fact.category,
      icon: fact.icon,
      title: fact.title,
      content: fact.content,
      tips: fact.tips,
      sources: fact.sources.map((source) => ({
        name: source.name,
        url: source.url,
      })),
    }))
  },
  ["public-detailed-facts"],
  { revalidate: 300, tags: ["public-detailed-facts"] },
)

const getCo2eSourcesCached = unstable_cache(
  async (): Promise<Co2eSource[]> => {
    const sources = await prisma.co2eSource.findMany({ orderBy: { title: "asc" } })
    return sources.map((source) => ({
      id: source.id,
      key: source.key,
      title: source.title,
      url: source.url,
      capturedAt: formatDate(source.capturedAt),
      anchors: source.anchors,
    }))
  },
  ["public-co2e-sources"],
  { revalidate: 300, tags: ["public-co2e-sources"] },
)

const getCo2eSourceItemsCached = unstable_cache(
  async (): Promise<Co2eSourceItem[]> => {
    const items = await prisma.co2eSourceItem.findMany({
      orderBy: [{ itemType: "asc" }, { sourceId: "asc" }],
    })
    return items.map((item) => ({
      id: item.id,
      sourceId: item.sourceId,
      itemType: item.itemType,
    }))
  },
  ["public-co2e-source-items"],
  { revalidate: 300, tags: ["public-co2e-source-items"] },
)

export const getActors = async (): Promise<Actor[]> => {
  return getActorsCached()
}

export const getLatestActors = async (limit = 6): Promise<Actor[]> => {
  return getLatestActorsCached(limit)
}

export const getActorBySlug = async (slug: string): Promise<Actor | null> => {
  const actors = await getActorsCached()
  return actors.find((actor) => actor.slug === slug) ?? null
}

export const getChallenges = async (): Promise<Challenge[]> => {
  return getChallengesCached()
}

export const getQuizData = async () => {
  return getQuizDataCached()
}

export const getRepairData = async (): Promise<RepairData> => {
  return getRepairDataCached()
}

export const getFacts = async (): Promise<Fact[]> => {
  return getFactsCached()
}

export const getDetailedFacts = async (): Promise<DetailedFact[]> => {
  return getDetailedFactsCached()
}

export const getCo2eSources = async (): Promise<Co2eSource[]> => {
  return getCo2eSourcesCached()
}

export const getCo2eSourceItems = async (): Promise<Co2eSourceItem[]> => {
  return getCo2eSourceItemsCached()
}

export const getActorsByCounty = async (countySlug: string) => {
  const actors = await getActorsCached()
  return filterActorsByCountyScope(actors, countySlug)
}

export const getActorsByMunicipality = async (countySlug: string, municipalitySlug: string) => {
  const actors = await getActorsCached()
  return filterActorsByMunicipalityScope(actors, countySlug, municipalitySlug)
}

export const getActorsByCategory = async (category: Actor["category"]) => {
  const actors = await getActorsCached()
  return actors.filter((actor) => actor.category === category)
}

export const getActorsByCountyAndCategory = async (
  countySlug: string,
  category: Actor["category"],
) => {
  const actors = await getActorsCached()
  return filterActorsByCountyScope(actors, countySlug).filter((actor) => actor.category === category)
}

export const getActorsByMunicipalityAndCategory = async (
  countySlug: string,
  municipalitySlug: string,
  category: Actor["category"],
) => {
  const actors = await getActorsCached()
  return filterActorsByMunicipalityScope(actors, countySlug, municipalitySlug).filter(
    (actor) => actor.category === category,
  )
}

export const getRepairEstimateEntries = async (): Promise<RepairEstimate[]> => {
  const data = await getRepairDataCached()
  return Object.values(data).flatMap((problems) => Object.values(problems))
}
