import { ActorCard } from "@/components/actor-card"
import { actors } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { pageCopy } from "@/content/no"

export default function ActorsPage() {
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
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {actors.map((actor) => (
              <ActorCard key={actor.id} actor={actor} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
