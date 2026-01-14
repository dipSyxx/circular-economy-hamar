import {
  actors as contentActors,
  challenges as contentChallenges,
  detailedFacts as contentDetailedFacts,
  facts as contentFacts,
  quizQuestions as contentQuizQuestions,
  quizResults as contentQuizResults,
  repairData as contentRepairData,
} from "@/content/no"

export type ActorCategory = "brukt" | "reparasjon" | "gjenvinning"

export type SourceType = "website" | "social" | "google_reviews" | "article" | "map"

export interface Source {
  type: SourceType
  title: string
  url: string
  capturedAt?: string
  note?: string
}

export interface Actor {
  id: string
  name: string
  slug: string
  category: ActorCategory
  description: string
  longDescription: string
  address: string
  lat: number
  lng: number
  phone?: string
  email?: string
  website?: string
  instagram?: string
  openingHours: string[]
  tags: string[]
  benefits: string[]
  howToUse: string[]
  image: string
  sources: Source[]
}

export interface QuizQuestion {
  id: number
  question: string
  options: {
    text: string
    points: number
  }[]
}

export interface Challenge {
  id: string
  title: string
  description: string
  points: number
  icon: string
  category: ActorCategory
}

export interface RepairEstimate {
  deviceType: string
  issue: string
  repairCostMin: number
  repairCostMax: number
  repairDays: number
  usedPriceMin: number
  usedPriceMax: number
  newPrice: number
  co2Saved: number
}

export type RepairData = Record<string, Record<string, RepairEstimate>>

export const actors: Actor[] = contentActors
export const quizQuestions: QuizQuestion[] = contentQuizQuestions
export const quizResults = contentQuizResults
export const challenges: Challenge[] = contentChallenges
export const repairData: RepairData = contentRepairData
export const facts = contentFacts
export const detailedFacts = contentDetailedFacts
