import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { ArticleDoc } from "@/lib/data"
import { getArticleHref, getEditorialThemeLabel } from "@/lib/editorial"

type ArticleCardProps = {
  article: ArticleDoc
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="h-full border-border/70">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{getEditorialThemeLabel(article.theme)}</Badge>
          <span className="text-xs text-muted-foreground">
            {article.readingMinutes} min lesing
          </span>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl leading-tight">
            <Link href={getArticleHref(article.slug)} className="hover:text-primary">
              {article.title}
            </Link>
          </CardTitle>
          <CardDescription>{article.summary}</CardDescription>
        </div>
      </CardHeader>
      <CardFooter>
        <Link
          href={getArticleHref(article.slug)}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Les artikkelen
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  )
}
