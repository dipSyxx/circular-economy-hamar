import "dotenv/config"
import { PrismaClient, QuizLevel } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import {
  actors,
  challenges,
  co2eSources,
  detailedFacts,
  facts,
  quizQuestions,
  quizResults,
  repairData,
} from "../content/no"

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
})
const seedAdminId = "c87051d5-fd03-43a5-bfed-a1bb1d691154"

const co2eSourcesByItem = {
  phone: ["apple-per-iphone-16-pro", "apple-per-iphone-15", "apple-per-iphone-16e"],
  laptop: ["apple-per-macbook-air-2017", "foxway-handprint-2021"],
  clothing: ["levis-501-lca-2015"],
  other: ["global-ewaste-monitor-2024-pdf", "global-ewaste-monitor-2024-landing"],
} as const

const parseDate = (value?: string) => (value ? new Date(value) : null)

async function seedActors() {
  for (const actor of actors) {
    const actorRecord = await prisma.actor.upsert({
      where: { slug: actor.slug },
      update: {
        name: actor.name,
        slug: actor.slug,
        category: actor.category,
        description: actor.description,
        longDescription: actor.longDescription,
        address: actor.address,
        lat: actor.lat,
        lng: actor.lng,
        phone: actor.phone ?? null,
        email: actor.email ?? null,
        website: actor.website ?? null,
        instagram: actor.instagram ?? null,
        openingHours: actor.openingHours,
        openingHoursOsm: actor.openingHoursOsm ?? null,
        tags: actor.tags,
        benefits: actor.benefits,
        howToUse: actor.howToUse,
        image: actor.image ?? null,
        status: "approved",
        createdById: seedAdminId,
        reviewedById: seedAdminId,
        reviewedAt: new Date(),
      },
      create: {
        name: actor.name,
        slug: actor.slug,
        category: actor.category,
        description: actor.description,
        longDescription: actor.longDescription,
        address: actor.address,
        lat: actor.lat,
        lng: actor.lng,
        phone: actor.phone ?? null,
        email: actor.email ?? null,
        website: actor.website ?? null,
        instagram: actor.instagram ?? null,
        openingHours: actor.openingHours,
        openingHoursOsm: actor.openingHoursOsm ?? null,
        tags: actor.tags,
        benefits: actor.benefits,
        howToUse: actor.howToUse,
        image: actor.image ?? null,
        status: "approved",
        createdById: seedAdminId,
        reviewedById: seedAdminId,
        reviewedAt: new Date(),
      },
    })

    await prisma.actorRepairService.deleteMany({ where: { actorId: actorRecord.id } })
    if (actor.repairServices?.length) {
      for (const service of actor.repairServices) {
        await prisma.actorRepairService.create({
          data: {
            actorId: actorRecord.id,
            problemType: service.problemType,
            itemTypes: service.itemTypes ?? [],
            priceMin: service.priceMin,
            priceMax: service.priceMax,
            etaDays: service.etaDays ?? null,
          },
        })
      }
    }

    await prisma.actorSource.deleteMany({ where: { actorId: actorRecord.id } })
    if (actor.sources?.length) {
      for (const source of actor.sources) {
        await prisma.actorSource.create({
          data: {
            actorId: actorRecord.id,
            type: source.type,
            title: source.title,
            url: source.url,
            note: source.note ?? null,
            ...(source.capturedAt ? { capturedAt: new Date(source.capturedAt) } : {}),
          },
        })
      }
    }
  }
}

async function seedChallenges() {
  for (const [index, challenge] of challenges.entries()) {
    const key = challenge.id
    await prisma.challenge.upsert({
      where: { key },
      update: {
        key,
        title: challenge.title,
        description: challenge.description,
        points: challenge.points,
        icon: challenge.icon,
        category: challenge.category,
        sortOrder: index,
      },
      create: {
        key,
        title: challenge.title,
        description: challenge.description,
        points: challenge.points,
        icon: challenge.icon,
        category: challenge.category,
        sortOrder: index,
      },
    })
  }
}

async function seedQuiz() {
  for (const [questionIndex, question] of quizQuestions.entries()) {
    const key = `question-${question.id}`
    const questionRecord = await prisma.quizQuestion.upsert({
      where: { key },
      update: { key, question: question.question, sortOrder: questionIndex },
      create: { key, question: question.question, sortOrder: questionIndex },
    })

    await prisma.quizOption.deleteMany({ where: { questionId: questionRecord.id } })
    for (const [optionIndex, option] of question.options.entries()) {
      await prisma.quizOption.create({
        data: {
          questionId: questionRecord.id,
          text: option.text,
          points: option.points,
          sortOrder: optionIndex,
        },
      })
    }
  }

  for (const [level, result] of Object.entries(quizResults)) {
    const quizLevel = level as QuizLevel
    await prisma.quizResult.upsert({
      where: { level: quizLevel },
      update: {
        title: result.title,
        description: result.description,
        tips: result.tips,
        badge: result.badge,
      },
      create: {
        level: quizLevel,
        title: result.title,
        description: result.description,
        tips: result.tips,
        badge: result.badge,
      },
    })
  }
}

async function seedRepairEstimates() {
  for (const [itemType, problems] of Object.entries(repairData)) {
    for (const [problemType, estimate] of Object.entries(problems)) {
      await prisma.repairEstimate.upsert({
        where: {
          itemType_problemType: {
            itemType: itemType as keyof typeof repairData,
            problemType: problemType as keyof (typeof repairData)[keyof typeof repairData],
          },
        },
        update: {
          deviceType: estimate.deviceType,
          issue: estimate.issue,
          repairCostMin: estimate.repairCostMin,
          repairCostMax: estimate.repairCostMax,
          repairDays: estimate.repairDays,
          usedPriceMin: estimate.usedPriceMin,
          usedPriceMax: estimate.usedPriceMax,
          newPrice: estimate.newPrice,
          co2Saved: estimate.co2Saved,
        },
        create: {
          itemType: itemType as keyof typeof repairData,
          problemType: problemType as keyof (typeof repairData)[keyof typeof repairData],
          deviceType: estimate.deviceType,
          issue: estimate.issue,
          repairCostMin: estimate.repairCostMin,
          repairCostMax: estimate.repairCostMax,
          repairDays: estimate.repairDays,
          usedPriceMin: estimate.usedPriceMin,
          usedPriceMax: estimate.usedPriceMax,
          newPrice: estimate.newPrice,
          co2Saved: estimate.co2Saved,
        },
      })
    }
  }
}

async function seedFacts() {
  for (const [index, fact] of facts.entries()) {
    const key = `fact-${index + 1}`
    await prisma.fact.upsert({
      where: { key },
      update: {
        key,
        title: fact.title,
        stat: fact.stat,
        description: fact.description,
        icon: fact.icon,
        sortOrder: index,
      },
      create: {
        key,
        title: fact.title,
        stat: fact.stat,
        description: fact.description,
        icon: fact.icon,
        sortOrder: index,
      },
    })
  }

  for (const [index, section] of detailedFacts.entries()) {
    const key = `detailed-fact-${index + 1}`
    const detailedFactRecord = await prisma.detailedFact.upsert({
      where: { key },
      update: {
        key,
        category: section.category,
        title: section.title,
        icon: section.icon,
        content: section.content,
        tips: section.tips,
        sortOrder: index,
      },
      create: {
        key,
        category: section.category,
        title: section.title,
        icon: section.icon,
        content: section.content,
        tips: section.tips,
        sortOrder: index,
      },
    })

    await prisma.detailedFactSource.deleteMany({ where: { detailedFactId: detailedFactRecord.id } })
    if (section.sources?.length) {
      for (const [sourceIndex, source] of section.sources.entries()) {
        await prisma.detailedFactSource.create({
          data: {
            detailedFactId: detailedFactRecord.id,
            name: source.name,
            url: source.url,
            sortOrder: sourceIndex,
          },
        })
      }
    }
  }
}

async function seedCo2eSources() {
  const sourceIdsByKey = new Map<string, string>()
  for (const source of co2eSources) {
    const key = source.id
    const sourceRecord = await prisma.co2eSource.upsert({
      where: { key },
      update: {
        key,
        title: source.title,
        url: source.url,
        capturedAt: parseDate(source.capturedAt) ?? undefined,
        anchors: [...source.anchors],
      },
      create: {
        key,
        title: source.title,
        url: source.url,
        capturedAt: parseDate(source.capturedAt) ?? undefined,
        anchors: [...source.anchors],
      },
    })
    sourceIdsByKey.set(key, sourceRecord.id)
  }

  await prisma.co2eSourceItem.deleteMany()
  const co2eItems = Object.entries(co2eSourcesByItem).flatMap(([itemType, keys]) =>
    keys.flatMap((key) => {
      const sourceId = sourceIdsByKey.get(key)
      if (!sourceId) return []
      return [
        {
          sourceId,
          itemType: itemType as keyof typeof co2eSourcesByItem,
        },
      ]
    }),
  )
  for (const item of co2eItems) {
    await prisma.co2eSourceItem.create({ data: item })
  }
}

async function clearSeedData() {
  await prisma.actorRepairService.deleteMany()
  await prisma.actorSource.deleteMany()
  await prisma.challengeCompletion.deleteMany()
  await prisma.challenge.deleteMany()
  await prisma.quizOption.deleteMany()
  await prisma.quizQuestion.deleteMany()
  await prisma.quizResult.deleteMany()
  await prisma.repairEstimate.deleteMany()
  await prisma.detailedFactSource.deleteMany()
  await prisma.detailedFact.deleteMany()
  await prisma.fact.deleteMany()
  await prisma.co2eSourceItem.deleteMany()
  await prisma.co2eSource.deleteMany()
  await prisma.actor.deleteMany()
}

async function main() {
  await clearSeedData()
  await seedActors()
  await seedChallenges()
  await seedQuiz()
  await seedRepairEstimates()
  await seedFacts()
  await seedCo2eSources()
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
