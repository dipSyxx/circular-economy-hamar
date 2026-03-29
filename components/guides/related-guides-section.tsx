import { GuideCard } from "@/components/guides/guide-card"
import type { GuideDoc } from "@/lib/data"

type RelatedGuidesSectionProps = {
  title: string
  description?: string
  guides: GuideDoc[]
}

export function RelatedGuidesSection({
  title,
  description,
  guides,
}: RelatedGuidesSectionProps) {
  if (guides.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {guides.map((guide) => (
          <GuideCard key={guide.slug} guide={guide} />
        ))}
      </div>
    </section>
  )
}
