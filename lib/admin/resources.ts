export type AdminResourceGroupKey = "actors" | "tasks" | "quiz" | "facts" | "co2e" | "users"

export type AdminResourceGroupMeta = {
  key: AdminResourceGroupKey
  label: string
  description?: string
}

export type AdminResourceMeta = {
  key: string
  label: string
  description?: string
  group: AdminResourceGroupKey
}

export const adminResourceGroups: AdminResourceGroupMeta[] = [
  {
    key: "actors",
    label: "Aktører",
    description: "Aktører og tilknyttede tjenester og kilder.",
  },
  {
    key: "tasks",
    label: "Oppdrag",
    description: "Oppdrag og fullføringer.",
  },
  {
    key: "quiz",
    label: "Quiz",
    description: "Spørsmål, alternativer og resultater.",
  },
  {
    key: "facts",
    label: "Fakta",
    description: "Fakta og kilder.",
  },
  {
    key: "co2e",
    label: "CO2e & kalkulator",
    description: "CO2e-kilder og reparasjonsdata.",
  },
  {
    key: "users",
    label: "Brukere & aktivitet",
    description: "Brukerdata, handlinger og beslutninger.",
  },
]

export const adminResources: AdminResourceMeta[] = [
  {
    key: "actors",
    label: "Aktører",
    description: "Lokale aktører med kontaktinfo, tags og åpningstider.",
    group: "actors",
  },
  {
    key: "actor-repair-services",
    label: "Reparasjons-tjenester",
    description: "Pris og omfang for aktørenes tjenester.",
    group: "actors",
  },
  {
    key: "actor-sources",
    label: "Aktørkilder",
    description: "Kilder og referanser per aktør.",
    group: "actors",
  },
  {
    key: "challenges",
    label: "Oppdrag",
    description: "Oppdragene i appen (poeng og kategori).",
    group: "tasks",
  },
  {
    key: "challenge-completions",
    label: "Oppdrag fullført",
    description: "Fullførte oppdrag per bruker.",
    group: "tasks",
  },
  {
    key: "quiz-questions",
    label: "Quizspørsmål",
    description: "Spørsmål og rekkefølge.",
    group: "quiz",
  },
  {
    key: "quiz-options",
    label: "Quizalternativer",
    description: "Svaralternativer for hvert spørsmål.",
    group: "quiz",
  },
  {
    key: "quiz-results",
    label: "Quizresultater",
    description: "Resultatnivåer og tips.",
    group: "quiz",
  },
  {
    key: "quiz-attempts",
    label: "Quiz forsøk",
    description: "Resultater og svar fra quiz.",
    group: "quiz",
  },
  {
    key: "facts",
    label: "Fakta (kort)",
    description: "Kortfakta-kort på /fakta.",
    group: "facts",
  },
  {
    key: "detailed-facts",
    label: "Fakta (detalj)",
    description: "Detaljseksjoner på /fakta.",
    group: "facts",
  },
  {
    key: "detailed-fact-sources",
    label: "Faktakilder",
    description: "Kilder for detaljfakta.",
    group: "facts",
  },
  {
    key: "repair-estimates",
    label: "Reparasjonsdata",
    description: "Kostnad og CO2 for kalkulatoren.",
    group: "co2e",
  },
  {
    key: "co2e-sources",
    label: "CO2e-kilder",
    description: "Kilder brukt i beslutningsmotoren.",
    group: "co2e",
  },
  {
    key: "co2e-source-items",
    label: "CO2e-kildekoblinger",
    description: "Koblinger mellom CO2e-kilder og itemType.",
    group: "co2e",
  },
  {
    key: "users",
    label: "Brukere",
    description: "Brukere og roller fra Neon Auth.",
    group: "users",
  },
  {
    key: "user-profiles",
    label: "Brukerprofiler",
    description: "Poeng, streaks og status per bruker.",
    group: "users",
  },
  {
    key: "user-actions",
    label: "Brukerhandlinger",
    description: "Handlinger og poenglogg.",
    group: "users",
  },
  {
    key: "decisions",
    label: "Beslutninger",
    description: "Beslutningsmotorens logg.",
    group: "users",
  },
]

export const adminResourceDefaults: Record<string, object> = {
  actors: {
    name: "Eksempel aktør",
    slug: "eksempel-aktor",
    category: "brukt",
    description: "Kort beskrivelse",
    longDescription: "Lang beskrivelse",
    address: "Gate 1, 2318 Hamar",
    lat: 60.79,
    lng: 11.07,
    openingHours: ["Man-fre: 10:00-17:00"],
    tags: [],
    benefits: [],
    howToUse: [],
    status: "pending",
  },
  "actor-repair-services": {
    actorId: "<actor-id>",
    problemType: "screen",
    itemTypes: ["phone"],
    priceMin: 500,
    priceMax: 1500,
    etaDays: 2,
  },
  "actor-sources": {
    actorId: "<actor-id>",
    type: "website",
    title: "Nettside",
    url: "https://example.com",
    capturedAt: "2026-01-01",
    note: "Valgfri merknad",
  },
  challenges: {
    key: "brukt-1",
    title: "Første bruktfunn",
    description: "Kjøp en ting brukt denne uka",
    points: 10,
    icon: "*",
    category: "brukt",
    sortOrder: 0,
  },
  "quiz-questions": {
    key: "question-1",
    question: "Hva gjør du med klær du ikke bruker lenger?",
    sortOrder: 0,
  },
  "quiz-options": {
    questionId: "<question-id>",
    text: "Leverer til bruktbutikk",
    points: 2,
    sortOrder: 0,
  },
  "quiz-results": {
    level: "starter",
    title: "Sirkulær Starter",
    description: "Du er i gang!",
    tips: ["Besøk en bruktbutikk", "Reparer før du kjøper nytt"],
    badge: "*",
  },
  "repair-estimates": {
    itemType: "phone",
    problemType: "screen",
    deviceType: "Telefon",
    issue: "Knust skjerm",
    repairCostMin: 800,
    repairCostMax: 2000,
    repairDays: 1,
    usedPriceMin: 2000,
    usedPriceMax: 5000,
    newPrice: 8000,
    co2Saved: 45,
  },
  facts: {
    key: "fact-1",
    title: "E-avfall",
    stat: "50 millioner tonn",
    description: "e-avfall produseres globalt hvert år.",
    icon: "*",
    sortOrder: 0,
  },
  "detailed-facts": {
    key: "detailed-fact-1",
    category: "E-avfall",
    title: "E-avfall er et voksende problem",
    icon: "*",
    content: ["Fakta 1", "Fakta 2"],
    tips: ["Tips 1", "Tips 2"],
    sortOrder: 0,
  },
  "detailed-fact-sources": {
    detailedFactId: "<detailed-fact-id>",
    name: "Global E-waste Monitor",
    url: "https://globalewaste.org",
    sortOrder: 0,
  },
  "co2e-sources": {
    key: "apple-per-iphone-16-pro",
    title: "Apple Product Environmental Report - iPhone 16 Pro",
    url: "https://www.apple.com/environment/",
    capturedAt: "2026-01-16",
    anchors: ["Carbon footprint: ~61 kg CO2e"],
  },
  "co2e-source-items": {
    sourceId: "<co2e-source-id>",
    itemType: "phone",
  },
  users: {
    id: "<user-id>",
    email: "user@example.com",
    name: "Eksempel bruker",
    role: "user",
    imageUrl: null,
  },
  "user-profiles": {
    userId: "<user-id>",
    score: 0,
    streakDays: 0,
    lastActionDate: "2026-01-01",
  },
  "user-actions": {
    userId: "<user-id>",
    type: "decision_complete",
    points: 5,
    meta: {},
  },
  decisions: {
    userId: "<user-id>",
    itemType: "phone",
    problemType: "screen",
    recommendation: "repair",
    priority: "balanced",
    status: "feasible",
    confidence: "medium",
    budgetNok: 1500,
    timeDays: 7,
    impactScore: 0.5,
    savingsMin: 500,
    savingsMax: 2000,
    co2eSavedMin: 10,
    co2eSavedMax: 30,
    explainability: {},
    options: [],
    planB: {},
  },
  "challenge-completions": {
    userId: "<user-id>",
    challengeId: "<challenge-id>",
    points: 10,
  },
  "quiz-attempts": {
    userId: "<user-id>",
    score: 4,
    maxScore: 10,
    level: "starter",
    answers: {},
  },
}
