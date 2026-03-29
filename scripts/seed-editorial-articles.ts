import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { upsertBootstrapArticles } from "../lib/bootstrap-articles"

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
})

async function main() {
  await upsertBootstrapArticles(prisma)
}

main()
  .catch((error) => {
    console.error("Seeding editorial articles failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
