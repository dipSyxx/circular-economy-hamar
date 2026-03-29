import type { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { GuideCard } from "@/components/guides/guide-card"
import { getGuidesGroupedByIntent, getGuideHubCopy } from "@/lib/guides"
import { getSiteUrl } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Guider | Sirkulær Norge",
  description:
    "Praktiske guider for reparasjon, bruktkjøp, ombruk, gjenvinning, utleie og lokale sirkulære tjenester i Norge.",
  alternates: { canonical: `${getSiteUrl()}/guider` },
}

export default function GuidesHubPage() {
  const hubCopy = getGuideHubCopy()
  const guideGroups = getGuidesGroupedByIntent()

  return (
    <div className="container mx-auto space-y-10 px-4 py-10">
      <section className="max-w-4xl space-y-4">
        <Badge variant="secondary">{hubCopy.badge}</Badge>
        <h1 className="text-4xl font-bold">{hubCopy.title}</h1>
        <p className="text-lg text-muted-foreground">{hubCopy.description}</p>
        <p className="text-sm text-muted-foreground">{hubCopy.helper}</p>
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-2">
        {guideGroups.map((group) => (
          <div key={group.intent} className="flex min-w-0 flex-col gap-3 self-start">
            <div className="space-y-1">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {group.intentLabel}
              </p>
              <h2 className="text-2xl font-semibold">{group.guides[0]?.title}</h2>
            </div>
            {group.guides.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        ))}
      </section>
    </div>
  )
}
