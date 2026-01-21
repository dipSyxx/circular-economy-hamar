import "server-only"

export type AdminResourceConfig = {
  model: string
  orderBy?: unknown
}

export const adminResourceConfig: Record<string, AdminResourceConfig> = {
  actors: { model: "actor", orderBy: { updatedAt: "desc" } },
  "actor-repair-services": { model: "actorRepairService", orderBy: [{ actorId: "asc" }, { priceMin: "asc" }] },
  "actor-sources": { model: "actorSource", orderBy: [{ actorId: "asc" }, { title: "asc" }] },
  challenges: { model: "challenge", orderBy: [{ category: "asc" }, { sortOrder: "asc" }] },
  "quiz-questions": { model: "quizQuestion", orderBy: [{ sortOrder: "asc" }, { question: "asc" }] },
  "quiz-options": { model: "quizOption", orderBy: [{ questionId: "asc" }, { sortOrder: "asc" }] },
  "quiz-results": { model: "quizResult", orderBy: { level: "asc" } },
  "repair-estimates": { model: "repairEstimate", orderBy: [{ itemType: "asc" }, { problemType: "asc" }] },
  facts: { model: "fact", orderBy: [{ sortOrder: "asc" }, { title: "asc" }] },
  "detailed-facts": { model: "detailedFact", orderBy: [{ sortOrder: "asc" }, { title: "asc" }] },
  "detailed-fact-sources": { model: "detailedFactSource", orderBy: [{ detailedFactId: "asc" }, { sortOrder: "asc" }] },
  "co2e-sources": { model: "co2eSource", orderBy: { title: "asc" } },
  "co2e-source-items": { model: "co2eSourceItem", orderBy: [{ itemType: "asc" }, { sourceId: "asc" }] },
}
