import { pageCopy } from "@/content/no"
import { MapClient } from "@/components/map-client"
import { getActors } from "@/lib/public-data"

export default async function MapPage() {
  const actors = await getActors()

  return (
    <div>
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">{pageCopy.map.title}</h1>
          <p className="text-muted-foreground">{pageCopy.map.description}</p>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <MapClient actors={actors} />
        </div>
      </section>
    </div>
  )
}
