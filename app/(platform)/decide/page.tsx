import { DecisionWizard } from "@/components/decision-wizard"
import { pageCopy } from "@/content/no"
import { getActors, getCo2eSourceItems, getCo2eSources } from "@/lib/public-data"

export default async function DecidePage() {
  const [actors, co2eSources, co2eSourceItems] = await Promise.all([
    getActors(),
    getCo2eSources(),
    getCo2eSourceItems(),
  ])

  return (
    <div>
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">{pageCopy.decide.title}</h1>
            <p className="text-lg text-muted-foreground">{pageCopy.decide.description}</p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <DecisionWizard actors={actors} co2eSources={co2eSources} co2eSourceItems={co2eSourceItems} />
        </div>
      </section>
    </div>
  )
}
