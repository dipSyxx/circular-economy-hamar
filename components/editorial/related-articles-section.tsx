import { ArticleCard } from "@/components/editorial/article-card"
import type { ArticleDoc } from "@/lib/data"

type RelatedArticlesSectionProps = {
  title: string
  description?: string
  articles: ArticleDoc[]
}

export function RelatedArticlesSection({
  title,
  description,
  articles,
}: RelatedArticlesSectionProps) {
  if (articles.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </section>
  )
}
