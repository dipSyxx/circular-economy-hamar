import { ActorSubmissionDialog } from "@/components/actor-submission-dialog"
import { ActorsExplorer } from "@/components/actors-explorer"
import { Badge } from "@/components/ui/badge"
import { pageCopy } from "@/content/no"
import { getActors } from "@/lib/public-data"

export default async function ActorsPage() {
  const actors = await getActors()

  return (
    <div>
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">{pageCopy.actors.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{pageCopy.actors.description}</p>
            <div className="flex flex-wrap gap-2">
              {pageCopy.actors.badges.map((badge) => (
                <Badge key={badge} variant="secondary">
                  {badge}
                </Badge>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ActorSubmissionDialog />
              <span className="text-sm text-muted-foreground">
                Foreslå en ny aktør som bør være med i oversikten.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <ActorsExplorer actors={actors} />
        </div>
      </section>
    </div>
  )
}
