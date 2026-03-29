import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { actorCopy } from "@/content/no"
import type { GuideDoc } from "@/lib/data"
import { getGuideHref, getGuideIntentLabel } from "@/lib/guides"

type GuideCardProps = {
  guide: GuideDoc
}

export function GuideCard({ guide }: GuideCardProps) {
  return (
    <Card className="h-full transition-colors hover:border-primary/40">
      <CardHeader className="space-y-3">
        <Badge variant="secondary" className="w-fit">
          {getGuideIntentLabel(guide.primaryIntent)}
        </Badge>
        <div className="space-y-2">
          <CardTitle className="text-xl">
            <Link href={getGuideHref(guide.slug)} className="hover:text-primary">
              {guide.title}
            </Link>
          </CardTitle>
          <CardDescription>{guide.summary}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex h-full flex-col justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {guide.relatedCategories.slice(0, 3).map((category) => (
            <Badge key={category} variant="outline">
              {actorCopy.categoryLongLabels[category]}
            </Badge>
          ))}
        </div>
        <Link
          href={getGuideHref(guide.slug)}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          Les guiden
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}
