"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { quizQuestions, challenges } from "@/lib/data"
import { CheckCircle2, ArrowRight, Share2, RotateCcw, Trophy, Target } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

type QuizState = "intro" | "playing" | "result"

interface QuizResult {
  score: number
  maxScore: number
  level: "starter" | "på_vei" | "gjenbrukshelt"
  title: string
  description: string
  tips: string[]
  badge: string
}

export function Quiz() {
  const [state, setState] = useState<QuizState>("intro")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<QuizResult | null>(null)

  const startQuiz = () => {
    setState("playing")
    setCurrentQuestion(0)
    setAnswers([])
  }

  const selectAnswer = (points: number) => {
    const newAnswers = [...answers, points]
    setAnswers(newAnswers)

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateResult(newAnswers)
    }
  }

  const calculateResult = (finalAnswers: number[]) => {
    const score = finalAnswers.reduce((sum, pts) => sum + pts, 0)
    const maxScore = quizQuestions.length * 2

    let level: QuizResult["level"]
    let title: string
    let description: string
    let tips: string[]
    let badge: string

    if (score <= 4) {
      level = "starter"
      title = "Sirkulær Starter"
      description =
        "Du er på begynnelsen av din sirkulære reise! Det er et flott utgangspunkt – her er noen enkle steg for å komme i gang."
      tips = [
        "Prøv å besøke en bruktbutikk denne uka",
        'Før du kjøper noe nytt, spør deg selv: "Trenger jeg dette?"',
        "Lær hvor du leverer e-avfall i Hamar",
      ]
      badge = "🌱"
    } else if (score <= 8) {
      level = "på_vei"
      title = "På God Vei"
      description = "Du gjør allerede mye bra! Med noen små justeringer kan du bli en ekte gjenbrukshelt."
      tips = [
        "Utfordring: Få noe reparert i stedet for å kjøpe nytt",
        "Del dine bruktfunn med venner",
        "Prøv å selge ting du ikke bruker på Finn eller Tise",
      ]
      badge = "♻️"
    } else {
      level = "gjenbrukshelt"
      title = "Gjenbrukshelt!"
      description = "Wow! Du er en inspirasjon. Nå kan du hjelpe andre å bli mer sirkulære!"
      tips = [
        "Ta med en venn til bruktbutikk",
        "Del tips på sosiale medier",
        'Vurder å bli "sirkulær ambassadør" blant vennene dine',
      ]
      badge = "🏆"
    }

    setResult({ score, maxScore, level, title, description, tips, badge })
    setState("result")
  }

  const resetQuiz = () => {
    setState("intro")
    setCurrentQuestion(0)
    setAnswers([])
    setResult(null)
  }

  const shareResult = () => {
    if (!result) return
    const text = `Jeg fikk ${result.score}/${result.maxScore} på SirkulærHamar-quizen og er en ${result.title}! Ta quizen du også: `
    if (navigator.share) {
      navigator.share({ title: "Min Sirkulær Score", text })
    } else {
      navigator.clipboard.writeText(text + window.location.href)
      alert("Kopiert til utklippstavle!")
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {state === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-3xl">Hvor sirkulær er du?</CardTitle>
                <CardDescription className="text-base">
                  Ta vår quiz og finn ut hvor miljøvennlige vanene dine er. Du får personlige tips basert på svarene
                  dine!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center gap-4 text-sm text-muted-foreground">
                  <span>{quizQuestions.length} spørsmål</span>
                  <span>•</span>
                  <span>~2 minutter</span>
                </div>
                <Button onClick={startQuiz} size="lg" className="gap-2">
                  Start quizen
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {state === "playing" && (
          <motion.div
            key={`question-${currentQuestion}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="secondary">
                    Spørsmål {currentQuestion + 1} av {quizQuestions.length}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}%
                  </span>
                </div>
                <Progress value={((currentQuestion + 1) / quizQuestions.length) * 100} className="mb-4" />
                <CardTitle className="text-xl">{quizQuestions[currentQuestion].question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quizQuestions[currentQuestion].options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto py-4 px-4 text-left bg-transparent"
                    onClick={() => selectAnswer(option.points)}
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-sm mr-3">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option.text}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {state === "result" && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <Card className="text-center border-2 border-primary">
              <CardHeader>
                <div className="text-6xl mb-4">{result.badge}</div>
                <Badge className="mx-auto mb-2">
                  {result.score}/{result.maxScore} poeng
                </Badge>
                <CardTitle className="text-3xl text-primary">{result.title}</CardTitle>
                <CardDescription className="text-base">{result.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-3 flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Dine neste steg:
                  </h4>
                  <ul className="space-y-2 text-left">
                    {result.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary font-bold">{index + 1}.</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={shareResult} variant="outline" className="flex-1 gap-2 bg-transparent">
                    <Share2 className="h-4 w-4" />
                    Del resultatet
                  </Button>
                  <Button onClick={resetQuiz} variant="outline" className="flex-1 gap-2 bg-transparent">
                    <RotateCcw className="h-4 w-4" />
                    Ta quizen på nytt
                  </Button>
                </div>

                <Button asChild className="w-full" size="lg">
                  <Link href="/aktorer">
                    Utforsk aktører i Hamar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-accent" />
                  Utfordringer for deg
                </CardTitle>
                <CardDescription>Fullfør utfordringer for å bli enda mer sirkulær!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {challenges.slice(0, 4).map((challenge) => (
                    <div key={challenge.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="text-2xl">{challenge.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{challenge.title}</p>
                        <p className="text-xs text-muted-foreground">{challenge.description}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto">
                        +{challenge.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
