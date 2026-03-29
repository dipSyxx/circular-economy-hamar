import { categoryOrder } from "@/lib/categories"
import { EDITORIAL_THEMES, type ActorCategory, type ArticleDoc, type EditorialTheme, type GuideSection } from "@/lib/data"
import { getCountyBySlug } from "@/lib/geo"

type ArticleSectionInput = {
  title?: unknown
  body?: unknown
  checklist?: unknown
  ctaLinks?: unknown
}

type ArticleCtaInput = {
  label?: unknown
  href?: unknown
}

const isEditorialTheme = (value: unknown): value is EditorialTheme =>
  typeof value === "string" && EDITORIAL_THEMES.includes(value as EditorialTheme)

const normalizeStringList = (value: unknown) =>
  Array.isArray(value)
    ? value.map((entry) => String(entry).trim()).filter(Boolean)
    : []

const normalizeCtaLinks = (value: unknown) => {
  if (!Array.isArray(value)) return undefined

  const links = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const input = entry as ArticleCtaInput
      const label = typeof input.label === "string" ? input.label.trim() : ""
      const href = typeof input.href === "string" ? input.href.trim() : ""
      if (!label || !href) return null
      return { label, href }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  return links.length > 0 ? links : undefined
}

const normalizeBodySections = (value: unknown): GuideSection[] => {
  if (!Array.isArray(value)) {
    throw new Error("bodySections må være en liste med seksjoner.")
  }

  const sections = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const input = entry as ArticleSectionInput
      const title = typeof input.title === "string" ? input.title.trim() : ""
      const body = normalizeStringList(input.body)
      if (!title || body.length === 0) return null

      const checklist = normalizeStringList(input.checklist)
      const ctaLinks = normalizeCtaLinks(input.ctaLinks)

      return {
        title,
        body,
        ...(checklist.length > 0 ? { checklist } : {}),
        ...(ctaLinks ? { ctaLinks } : {}),
      }
    })
    .filter((entry): entry is GuideSection => entry !== null)

  if (sections.length === 0) {
    throw new Error("Artikkelen må ha minst én gyldig seksjon.")
  }

  return sections
}

const normalizeRelatedCategories = (value: unknown): ActorCategory[] => {
  const categories = normalizeStringList(value).filter((entry): entry is ActorCategory =>
    categoryOrder.includes(entry as ActorCategory),
  )

  if (categories.length === 0) {
    throw new Error("relatedCategories må inneholde minst én gyldig kategori.")
  }

  return Array.from(new Set(categories))
}

const normalizeRelatedCounties = (value: unknown) => {
  const counties = normalizeStringList(value)
    .map((slug) => slug.toLowerCase())
    .filter((slug) => Boolean(getCountyBySlug(slug)))

  return Array.from(new Set(counties))
}

const normalizePublishedAt = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  throw new Error("publishedAt må være en gyldig dato.")
}

const normalizeReadingMinutes = (value: unknown) => {
  const minutes = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error("readingMinutes må være et positivt tall.")
  }
  return Math.round(minutes)
}

const normalizeSlug = (value: unknown) => {
  const slug = typeof value === "string" ? value.trim() : ""
  if (!slug) throw new Error("slug er påkrevd.")
  return slug
}

const normalizeText = (value: unknown, field: string) => {
  const text = typeof value === "string" ? value.trim() : ""
  if (!text) throw new Error(`${field} er påkrevd.`)
  return text
}

export const prepareArticlePersistData = (payload: Record<string, unknown>) => {
  const slug = normalizeSlug(payload.slug)
  const title = normalizeText(payload.title, "title")
  const summary = normalizeText(payload.summary, "summary")
  const seoTitle = typeof payload.seoTitle === "string" && payload.seoTitle.trim() ? payload.seoTitle.trim() : title
  const seoDescription =
    typeof payload.seoDescription === "string" && payload.seoDescription.trim()
      ? payload.seoDescription.trim()
      : summary
  const theme = payload.theme
  if (!isEditorialTheme(theme)) {
    throw new Error("theme må være en gyldig redaksjonell kategori.")
  }

  return {
    slug,
    title,
    summary,
    seoTitle,
    seoDescription,
    publishedAt: normalizePublishedAt(payload.publishedAt),
    readingMinutes: normalizeReadingMinutes(payload.readingMinutes),
    theme,
    relatedCategories: normalizeRelatedCategories(payload.relatedCategories),
    relatedCounties: normalizeRelatedCounties(payload.relatedCounties),
    bodySections: normalizeBodySections(payload.bodySections),
  }
}

export const articleSeedDocsToPersist = (articles: ArticleDoc[]) =>
  articles.map((article) =>
    prepareArticlePersistData({
      ...article,
      publishedAt: article.publishedAt,
      bodySections: article.bodySections,
    }),
  )
