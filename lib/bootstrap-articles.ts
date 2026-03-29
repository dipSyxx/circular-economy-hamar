import type { Prisma, PrismaClient } from "@prisma/client"
import { articleDocs } from "@/content/editorial/no"
import { articleSeedDocsToPersist } from "@/lib/article-write"

export async function upsertBootstrapArticles(prisma: PrismaClient) {
  const articles = articleSeedDocsToPersist(articleDocs)

  for (const article of articles) {
    const data = {
      ...article,
      bodySections: article.bodySections as unknown as Prisma.InputJsonValue,
    }

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: data,
      create: data,
    })
  }
}
