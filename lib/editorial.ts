import "server-only"

import { articleDocs, editorialHubCopy, editorialThemeLabels } from "@/content/editorial/no"
import { getActorGeographyMatchPriority } from "@/lib/actor-scope"
import { categoryOrder } from "@/lib/categories"
import type { Actor, ActorCategory, ArticleDoc, EditorialTheme, GuideDoc } from "@/lib/data"
import { getCountyBySlug } from "@/lib/geo"
import { getGuidesForCategory } from "@/lib/guides"
import { getActors } from "@/lib/public-data"

const articleBySlug = new Map(articleDocs.map((article) => [article.slug, article]))
const compareByPublishedDate = (left: ArticleDoc, right: ArticleDoc) => {
  const dateDelta = new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime()
  if (dateDelta !== 0) return dateDelta
  return left.title.localeCompare(right.title, "no-NO")
}

const freshnessRank = (actor: Actor) => {
  switch (actor.freshnessStatus) {
    case "fresh":
      return 0
    case "aging":
      return 1
    case "stale":
      return 2
    default:
      return 3
  }
}

const dedupeArticles = (articles: ArticleDoc[]) => {
  const seen = new Set<string>()
  return articles.filter((article) => {
    if (seen.has(article.slug)) return false
    seen.add(article.slug)
    return true
  })
}

const dedupeGuides = (guides: GuideDoc[]) => {
  const seen = new Set<string>()
  return guides.filter((guide) => {
    if (seen.has(guide.slug)) return false
    seen.add(guide.slug)
    return true
  })
}

const articleMatchesCounty = (article: ArticleDoc, countySlug?: string | null) =>
  Boolean(countySlug && article.relatedCounties.includes(countySlug))

const articleMatchesCategory = (article: ArticleDoc, category: ActorCategory) =>
  article.relatedCategories.includes(category)

const getBestCountyPriority = (actor: Actor, countySlugs: string[]) => {
  let bestPriority = 99

  for (const countySlug of countySlugs) {
    const priority = getActorGeographyMatchPriority(actor, countySlug)
    if (priority !== null && priority < bestPriority) {
      bestPriority = priority
    }
  }

  return bestPriority
}

export const getEditorialHubCopy = () => editorialHubCopy

export const getArticles = () => articleDocs

export const getArticleBySlug = (slug: string) => articleBySlug.get(slug) ?? null

export const getArticleHref = (slug: string) => `/artikler/${slug}`

export const getEditorialThemeLabel = (theme: EditorialTheme) => editorialThemeLabels[theme]

export const getArticlesGroupedByTheme = () => {
  const groups = new Map<EditorialTheme, ArticleDoc[]>()

  for (const article of articleDocs) {
    const bucket = groups.get(article.theme) ?? []
    bucket.push(article)
    groups.set(article.theme, bucket)
  }

  return Array.from(groups.entries())
    .map(([theme, articles]) => ({
      theme,
      themeLabel: editorialThemeLabels[theme],
      articles: [...articles].sort(compareByPublishedDate),
    }))
    .sort((left, right) => left.themeLabel.localeCompare(right.themeLabel, "no-NO"))
}

export const getArticlesForActor = (actor: Actor, limit = 3) => {
  const articles = articleDocs
    .map((article) => ({
      article,
      categoryMatch: articleMatchesCategory(article, actor.category) ? 1 : 0,
      countyMatch: articleMatchesCounty(article, actor.countySlug) ? 1 : 0,
    }))
    .filter(({ categoryMatch, countyMatch }) => categoryMatch || countyMatch)
    .sort((left, right) => {
      if (left.categoryMatch !== right.categoryMatch) return right.categoryMatch - left.categoryMatch
      if (left.countyMatch !== right.countyMatch) return right.countyMatch - left.countyMatch
      return compareByPublishedDate(left.article, right.article)
    })
    .map(({ article }) => article)

  return dedupeArticles(articles).slice(0, limit)
}

export const getArticlesForCounty = (countySlug: string, limit = 4) =>
  dedupeArticles(
    articleDocs
      .filter((article) => articleMatchesCounty(article, countySlug))
      .sort(compareByPublishedDate),
  ).slice(0, limit)

export const getArticlesForMunicipality = (countySlug: string, limit = 4) =>
  getArticlesForCounty(countySlug, limit)

export const getArticlesForCategory = (
  category: ActorCategory,
  countySlug?: string | null,
  limit = 4,
) =>
  dedupeArticles(
    articleDocs
      .filter((article) => articleMatchesCategory(article, category))
      .sort((left, right) => {
        const leftCountyMatch = articleMatchesCounty(left, countySlug) ? 1 : 0
        const rightCountyMatch = articleMatchesCounty(right, countySlug) ? 1 : 0
        if (leftCountyMatch !== rightCountyMatch) return rightCountyMatch - leftCountyMatch
        return compareByPublishedDate(left, right)
      }),
  ).slice(0, limit)

export const getArticlesForGuide = (guide: GuideDoc, limit = 3) =>
  dedupeArticles(
    articleDocs
      .map((article) => ({
        article,
        categoryOverlap: article.relatedCategories.filter((category) =>
          guide.relatedCategories.includes(category),
        ).length,
        countyOverlap: article.relatedCounties.filter((county) =>
          guide.relatedCounties.includes(county),
        ).length,
      }))
      .filter(({ categoryOverlap, countyOverlap }) => categoryOverlap > 0 || countyOverlap > 0)
      .sort((left, right) => {
        if (left.categoryOverlap !== right.categoryOverlap) {
          return right.categoryOverlap - left.categoryOverlap
        }
        if (left.countyOverlap !== right.countyOverlap) {
          return right.countyOverlap - left.countyOverlap
        }
        return compareByPublishedDate(left.article, right.article)
      })
      .map(({ article }) => article),
  ).slice(0, limit)

export const getRelatedArticlesForArticle = (slug: string, limit = 4) => {
  const article = getArticleBySlug(slug)
  if (!article) return []

  return [...articleDocs]
    .filter((candidate) => candidate.slug !== slug)
    .sort((left, right) => {
      const leftCategoryOverlap = left.relatedCategories.filter((category) =>
        article.relatedCategories.includes(category),
      ).length
      const rightCategoryOverlap = right.relatedCategories.filter((category) =>
        article.relatedCategories.includes(category),
      ).length
      if (leftCategoryOverlap !== rightCategoryOverlap) return rightCategoryOverlap - leftCategoryOverlap

      const leftCountyOverlap = left.relatedCounties.filter((county) =>
        article.relatedCounties.includes(county),
      ).length
      const rightCountyOverlap = right.relatedCounties.filter((county) =>
        article.relatedCounties.includes(county),
      ).length
      if (leftCountyOverlap !== rightCountyOverlap) return rightCountyOverlap - leftCountyOverlap

      return compareByPublishedDate(left, right)
    })
    .slice(0, limit)
}

export const getRelatedActorsForArticle = async (article: ArticleDoc, limit = 6) => {
  const actors = await getActors()
  const relatedCategorySet = new Set<ActorCategory>(article.relatedCategories)
  const relatedCountySet = new Set(article.relatedCounties)

  const categoryFiltered = actors.filter((actor) => relatedCategorySet.has(actor.category))
  const candidates = categoryFiltered.length > 0 ? categoryFiltered : actors

  return [...candidates]
    .sort((left, right) => {
      const leftCountyMatch =
        left.countySlug && relatedCountySet.has(left.countySlug)
          ? 1
          : (left.serviceAreaCountySlugs ?? []).some((slug) => relatedCountySet.has(slug))
            ? 1
            : 0
      const rightCountyMatch =
        right.countySlug && relatedCountySet.has(right.countySlug)
          ? 1
          : (right.serviceAreaCountySlugs ?? []).some((slug) => relatedCountySet.has(slug))
            ? 1
            : 0
      if (leftCountyMatch !== rightCountyMatch) return rightCountyMatch - leftCountyMatch

      const leftPriority = getBestCountyPriority(left, article.relatedCounties)
      const rightPriority = getBestCountyPriority(right, article.relatedCounties)
      if (leftPriority !== rightPriority) return leftPriority - rightPriority

      const leftTrust = left.isTrusted ? 1 : 0
      const rightTrust = right.isTrusted ? 1 : 0
      if (leftTrust !== rightTrust) return rightTrust - leftTrust

      const freshnessDelta = freshnessRank(left) - freshnessRank(right)
      if (freshnessDelta !== 0) return freshnessDelta

      return left.name.localeCompare(right.name, "no-NO")
    })
    .slice(0, limit)
}

export const getGuidesForArticle = (article: ArticleDoc, limit = 3) => {
  const fromCategories = article.relatedCategories.flatMap((category) =>
    getGuidesForCategory(category, article.relatedCounties[0] ?? null, limit),
  )
  return dedupeGuides(
    fromCategories.sort((left, right) => left.title.localeCompare(right.title, "no-NO")),
  ).slice(0, limit)
}

export const getArticleCountyLinks = (article: ArticleDoc) =>
  article.relatedCounties
    .map((countySlug) => {
      const county = getCountyBySlug(countySlug)
      if (!county) return null
      return { slug: county.slug, label: county.name, href: `/${county.slug}` }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

export const getArticleCategoryLinks = (article: ArticleDoc) =>
  categoryOrder
    .filter((category) => article.relatedCategories.includes(category))
    .map((category) => ({ category, href: `/kategori/${category}` }))
