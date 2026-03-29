import type { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { ArticleCard } from "@/components/editorial/article-card"
import { getArticlesGroupedByTheme, getEditorialHubCopy } from "@/lib/editorial"
import { getSiteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Artikler | Sirkulær Norge",
  description:
    "Redaksjonelle artikler om lokale sirkulære tilbud, reparasjon, datakvalitet og hvordan katalogen brukes smartere i Norge.",
  alternates: { canonical: `${getSiteUrl()}/artikler` },
}

export default async function ArticlesHubPage() {
  const hubCopy = getEditorialHubCopy()
  const articleGroups = await getArticlesGroupedByTheme()

  return (
    <div className="container mx-auto space-y-10 px-4 py-10">
      <section className="max-w-4xl space-y-4">
        <Badge variant="secondary">{hubCopy.badge}</Badge>
        <h1 className="text-4xl font-bold">{hubCopy.title}</h1>
        <p className="text-lg text-muted-foreground">{hubCopy.description}</p>
        <p className="text-sm text-muted-foreground">{hubCopy.helper}</p>
      </section>

      <section className="grid items-start gap-8 lg:grid-cols-2">
        {articleGroups.map((group) => (
          <div key={group.theme} className="flex min-w-0 flex-col gap-3 self-start">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {group.themeLabel}
              </p>
            </div>
            {group.articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ))}
      </section>
    </div>
  )
}
