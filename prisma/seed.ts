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
const seedAdminId = "6e241a14-726c-41d8-bc50-0dfc24c5dea1"

const co2eSourcesByItem = {
  phone: ["apple-per-iphone-16-pro", "apple-per-iphone-15", "apple-per-iphone-16e"],
  laptop: ["apple-per-macbook-air-2017", "foxway-handprint-2021"],
  clothing: ["levis-501-lca-2015"],
  other: ["global-ewaste-monitor-2024-pdf", "global-ewaste-monitor-2024-landing"],
} as const

const parseDate = (value?: string) => (value ? new Date(value) : null)

async function seedActors() {
  for (const actor of actors) {
    await prisma.actor.upsert({
      where: { id: actor.id },
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
        id: actor.id,
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

    await prisma.actorRepairService.deleteMany({ where: { actorId: actor.id } })
    if (actor.repairServices?.length) {
      await prisma.actorRepairService.createMany({
        data: actor.repairServices.map((service) => ({
          actorId: actor.id,
          problemType: service.problemType,
          itemTypes: service.itemTypes ?? [],
          priceMin: service.priceMin,
          priceMax: service.priceMax,
          etaDays: service.etaDays ?? null,
        })),
      })
    }

    await prisma.actorSource.deleteMany({ where: { actorId: actor.id } })
    if (actor.sources?.length) {
      await prisma.actorSource.createMany({
        data: actor.sources.map((source) => ({
          actorId: actor.id,
          type: source.type,
          title: source.title,
          url: source.url,
          capturedAt: parseDate(source.capturedAt) ?? undefined,
          note: source.note ?? null,
        })),
      })
    }
  }
}

async function seedChallenges() {
  for (const [index, challenge] of challenges.entries()) {
    await prisma.challenge.upsert({
      where: { id: challenge.id },
      update: {
        title: challenge.title,
        description: challenge.description,
        points: challenge.points,
        icon: challenge.icon,
        category: challenge.category,
        sortOrder: index,
      },
      create: {
        id: challenge.id,
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
  for (const question of quizQuestions) {
    await prisma.quizQuestion.upsert({
      where: { id: question.id },
      update: { question: question.question },
      create: { id: question.id, question: question.question },
    })

    await prisma.quizOption.deleteMany({ where: { questionId: question.id } })
    await prisma.quizOption.createMany({
      data: question.options.map((option, index) => ({
        questionId: question.id,
        text: option.text,
        points: option.points,
        sortOrder: index,
      })),
    })
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
    const id = `fact-${index + 1}`
    await prisma.fact.upsert({
      where: { id },
      update: {
        title: fact.title,
        stat: fact.stat,
        description: fact.description,
        icon: fact.icon,
        sortOrder: index,
      },
      create: {
        id,
        title: fact.title,
        stat: fact.stat,
        description: fact.description,
        icon: fact.icon,
        sortOrder: index,
      },
    })
  }

  for (const [index, section] of detailedFacts.entries()) {
    const id = `detailed-fact-${index + 1}`
    await prisma.detailedFact.upsert({
      where: { id },
      update: {
        category: section.category,
        title: section.title,
        icon: section.icon,
        content: section.content,
        tips: section.tips,
        sortOrder: index,
      },
      create: {
        id,
        category: section.category,
        title: section.title,
        icon: section.icon,
        content: section.content,
        tips: section.tips,
        sortOrder: index,
      },
    })

    await prisma.detailedFactSource.deleteMany({ where: { detailedFactId: id } })
    if (section.sources?.length) {
      await prisma.detailedFactSource.createMany({
        data: section.sources.map((source, sourceIndex) => ({
          detailedFactId: id,
          name: source.name,
          url: source.url,
          sortOrder: sourceIndex,
        })),
      })
    }
  }
}

async function seedCo2eSources() {
  for (const source of co2eSources) {
    await prisma.co2eSource.upsert({
      where: { id: source.id },
      update: {
        title: source.title,
        url: source.url,
        capturedAt: parseDate(source.capturedAt) ?? undefined,
        anchors: [...source.anchors],
      },
      create: {
        id: source.id,
        title: source.title,
        url: source.url,
        capturedAt: parseDate(source.capturedAt) ?? undefined,
        anchors: [...source.anchors],
      },
    })
  }

  await prisma.co2eSourceItem.deleteMany()
  const co2eItems = Object.entries(co2eSourcesByItem).flatMap(([itemType, ids]) =>
    ids.map((sourceId) => ({
      sourceId,
      itemType: itemType as keyof typeof co2eSourcesByItem,
    })),
  )
  if (co2eItems.length > 0) {
    await prisma.co2eSourceItem.createMany({ data: co2eItems })
  }
}

async function main() {
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
