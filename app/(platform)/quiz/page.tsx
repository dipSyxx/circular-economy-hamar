import { Quiz } from "@/components/quiz"
import { pageCopy } from "@/content/no"

export default function QuizPage() {
  return (
    <div>
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">{pageCopy.quiz.title}</h1>
            <p className="text-lg text-muted-foreground">{pageCopy.quiz.description}</p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <Quiz />
        </div>
      </section>
    </div>
  )
}
