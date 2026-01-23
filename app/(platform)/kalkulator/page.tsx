import { Calculator } from "@/components/calculator"
import { pageCopy } from "@/content/no"
import { getActors, getRepairData } from "@/lib/public-data"

export default async function CalculatorPage() {
  const [actors, repairData] = await Promise.all([getActors(), getRepairData()])

  return (
    <div>
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">{pageCopy.calculator.title}</h1>
            <p className="text-lg text-muted-foreground">{pageCopy.calculator.description}</p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <Calculator actors={actors} repairData={repairData} />
        </div>
      </section>
    </div>
  )
}
