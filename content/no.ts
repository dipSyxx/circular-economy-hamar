import type { Actor, Challenge } from "@/lib/data";

export const site = {
  name: "SirkulærHamar",
  title: "SirkulærHamar - Gjenbruk, Reparasjon, Bærekraft",
  description:
    "Din guide til sirkulære tilbud i Hamar. Finn bruktbutikker, reparatører og lær hvordan du kan leve mer bærekraftig.",
  keywords: [
    "sirkulær",
    "gjenbruk",
    "hamar",
    "bærekraft",
    "reparasjon",
    "brukt",
  ],
};

export const navigation = [
  { href: "/", label: "Hjem" },
  { href: "/aktorer", label: "Aktører" },
  { href: "/decide", label: "Decide" },
  { href: "/kart", label: "Kart" },
  { href: "/quiz", label: "Quiz" },
  { href: "/fakta", label: "Fakta" },
];

export const co2eSources = [
  {
    id: "apple-per-iphone-16-pro",
    title: "Apple Product Environmental Report - iPhone 16 Pro / 16 Pro Max",
    url: "https://www.apple.com/environment/pdf/products/iphone/iPhone_16_Pro_PER_Sept2024.pdf",
    capturedAt: "2026-01-16",
    anchors: [
      "Carbon footprint: ~61 kg CO2e (iPhone 16 Pro)",
      "Life-cycle split: Production ~81% (dominant stage)",
    ],
  },
  {
    id: "apple-per-iphone-15",
    title: "Apple Product Environmental Report - iPhone 15",
    url: "https://www.apple.com/environment/pdf/products/iphone/iPhone_15_PER_June2025.pdf",
    capturedAt: "2026-01-16",
    anchors: [
      "Carbon footprint: ~66 kg CO2e (iPhone 15)",
      "Life-cycle split shows production/manufacturing as dominant share (model-specific)",
    ],
  },
  {
    id: "apple-per-iphone-16e",
    title: "Apple Product Environmental Report - iPhone 16e",
    url: "https://www.apple.com/environment/pdf/products/iphone/iPhone_16e_PER_Feb2025.pdf",
    capturedAt: "2026-01-16",
    anchors: [
      "Carbon footprint: ~43 kg CO2e (iPhone 16e)",
      "Life-cycle split: Production ~82%",
    ],
  },
  {
    id: "apple-per-macbook-air-2017",
    title: "Apple Product Environmental Report - 13-inch MacBook Air (2017)",
    url: "https://www.apple.com/environment/pdf/products/notebooks/13-inch_MacBookAir_PER_June2017.pdf",
    capturedAt: "2026-01-16",
    anchors: [
      "Total GHG: ~339 kg CO2e (model report)",
      "Life-cycle split: Production ~83% (dominant stage)",
    ],
  },
  {
    id: "foxway-handprint-2021",
    title: "Foxway - Carbon Handprint Report (2021)",
    url: "https://www.foxway.com/hubfs/ESG2021/Foxway%20Carbon%20Handprint%20Report%202021.pdf",
    capturedAt: "2026-01-16",
    anchors: [
      "Refurbished laptop footprint: ~6.65 kg CO2-eq (per device, report example)",
      "Avoided emissions example: ~258 kg CO2-eq (new vs refurbished comparison framing)",
    ],
  },
  {
    id: "levis-501-lca-2015",
    title: "Levi Strauss - Full LCA Results Deck (501 jeans)",
    url: "http://levistrauss.com/wp-content/uploads/2015/03/Full-LCA-Results-Deck-FINAL.pdf",
    capturedAt: "2026-01-16",
    anchors: ["Total climate change impact: ~33.4 kg CO2-e (501 jeans, study result)"],
  },
  {
    id: "global-ewaste-monitor-2024-pdf",
    title: "Global E-waste Monitor 2024 (UNITAR/ITU partnership) - PDF",
    url: "https://api.globalewaste.org/publications/file/297/Global-E-waste-Monitor-2024.pdf",
    capturedAt: "2026-01-16",
    anchors: ["Use for e-waste scale/context stats and citation block on /fakta"],
  },
  {
    id: "global-ewaste-monitor-2024-landing",
    title: "Global E-waste Monitor 2024 - landing page",
    url: "https://ewastemonitor.info/gem-2024/",
    capturedAt: "2026-01-16",
    anchors: ["Public overview page + links to report/materials"],
  },
] as const

export const bottomNavCopy = {
  items: [
    { href: "/", label: "Hjem", key: "home" },
    { href: "/decide", label: "Decide", key: "decide" },
    { href: "/kart", label: "Kart", key: "map" },
    { href: "/challenges", label: "Oppdrag", key: "challenges" },
    { href: "/profile", label: "Profil", key: "profile" },
  ],
};

export const navigationCopy = {
  openMenuLabel: "Åpne meny",
};

export const themeCopy = {
  toggleLabel: "Bytt tema",
  light: "Lys",
  dark: "Mørk",
  system: "System",
};

export const heroContent = {
  badge: "Lokale sirkulære tilbud i Hamar",
  title: {
    lead: "Kjøp brukt. Reparer.",
    highlight: "Spar penger og miljøet.",
  },
  description:
    "Finn de beste bruktbutikkene, reparatørene og gjenvinningsstedene i Hamar. Vi gjør det enkelt å ta sirkulære valg.",
  primaryCta: { label: "Start beslutning", href: "/decide" },
  secondaryCta: { label: "Utforsk aktører", href: "/aktorer" },
  quickLinks: [
    {
      title: "Finn på kartet",
      description: "Se alle steder nær deg",
      href: "/kart",
      icon: "map",
    },
    {
      title: "Ta et valg",
      description: "Reparer vs brukt vs resirkuler",
      href: "/decide",
      icon: "decide",
    },
    {
      title: "Test deg selv",
      description: "Hvor sirkulær er du?",
      href: "/quiz",
      icon: "quiz",
    },
  ],
};

export const homeContent = {
  actorsTitle: "Sirkulære aktører i Hamar",
  actorsDescription:
    "Disse lokale aktørene hjelper deg med å handle mer bærekraftig. Kjøp brukt, få ting reparert, og gi ting nytt liv.",
};

export const sectionContent = {
  facts: {
    title: "Fakta om bærekraft",
    description: "Visste du dette om gjenbruk, e-avfall og reparasjon?",
  },
};

export const pageCopy = {
  actors: {
    title: "Sirkulære aktører i Hamar",
    description:
      "Utforsk lokale bruktbutikker, reparatører og gjenvinningssteder. Hver aktør bidrar til en mer bærekraftig by.",
    badges: ["Brukt", "Reparasjon", "Gjenvinning"],
  },
  facts: {
    title: "Fakta om bærekraft",
    description:
      "Lær mer om hvorfor gjenbruk, reparasjon og riktig avfallshåndtering er viktig - for deg, for miljøet og for fremtiden.",
    tipsTitle: "Tips for deg:",
    sourcesLabel: "Kilder:",
    co2eSourcesTitle: "CO2e-kilder",
    co2eSourcesDescription: "Kilder bak CO2e-estimatene i beslutningsmotoren.",
    co2eSourcesToggleLabel: "Vis CO2e-kilder",
    ctaTitle: "Klar til å gjøre en forskjell?",
    ctaDescription:
      "Nå som du vet mer om hvorfor sirkulær økonomi er viktig, er det på tide å sette kunnskapen ut i praksis!",
    ctaPrimary: { label: "Finn aktører i Hamar", href: "/aktorer" },
    ctaSecondary: { label: "Ta sirkulærquizen", href: "/quiz" },
  },
  quiz: {
    title: "Sirkulær Quiz",
    description:
      "Test kunnskapen din om gjenbruk og bærekraft. Få personlige tips basert på svarene dine!",
  },
  calculator: {
    title: "Reparasjonskalkulator",
    description:
      "Lurer du på om du bør reparere eller kjøpe nytt? Vår kalkulator hjelper deg å ta det smarteste valget for lommeboka og miljøet.",
  },
  map: {
    title: "Sirkulært kart over Hamar",
    description:
      "Finn bruktbutikker, reparatører og gjenvinningssteder nær deg.",
  },
  decide: {
    title: "Beslutningsmotor",
    description:
      "Svar på noen raske spørsmål og få et smart, sirkulært valg - med lokale aktører som neste steg.",
  },
  challenges: {
    title: "Oppdrag",
    description:
      "Fullfør oppdrag og samle poeng for å bygge din sirkulære streak.",
  },
  profile: {
    title: "Profil",
    description: "Se poeng, historikk og hvilke utfordringer du har fullført.",
  },
};

export const profileCopy = {
  stats: {
    scoreLabel: "Poeng",
    streakLabel: "Streak",
    decisionsLabel: "Beslutninger",
    challengesLabel: "Oppdrag",
    daysLabel: "dager",
  },
  metaLabels: {
    impactLabel: "Klimaeffekt",
    savingsLabel: "Besparelse",
  },
  sections: {
    recentDecisionsTitle: "Siste beslutninger",
    recentDecisionsDescription: "Siste resultater fra beslutningsmotoren.",
    recentActionsTitle: "Siste handlinger",
    recentActionsDescription: "Sporer handlinger for streaks og oppdrag.",
    emptyDecisions: "Ingen beslutninger ennå.",
    emptyActions: "Ingen handlinger ennå.",
  },
  itemLabels: {
    phone: "Telefon",
    laptop: "PC/Laptop",
    clothing: "Klær",
    other: "Annet",
  },
  problemLabels: {
    screen: "Skjerm",
    battery: "Batteri",
    slow: "Treg",
    no_power: "Starter ikke",
    water: "Vannskade",
    zipper: "Glidelås",
    seam: "Søm",
    other: "Annet",
  },
  recommendationLabels: {
    repair: "Reparer",
    buy_used: "Kjøp brukt",
    donate: "Doner",
    recycle: "Resirkuler",
  },
  actionLabels: {
    decision_complete: "Beslutning fullført",
    go_call: "Ring aktør",
    go_directions: "Åpne veibeskrivelse",
    go_website: "Åpne nettside",
    open_actor: "Åpne aktørside",
    challenge_complete: "Oppdrag fullført",
  },
};

export const challengesCopy = {
  stats: {
    scoreLabel: "Poeng",
    streakLabel: "Streak",
    completedLabel: "Fullført",
    daysLabel: "dager",
  },
  doneLabel: "Fullført",
  markCompleteLabel: "Marker som fullført",
};

export const actorPageCopy = {
  backLabel: "Tilbake til aktører",
  whyTitleTemplate: "Hvorfor {name}?",
  howToUseTitle: "Slik bruker du det",
  contactTitle: "Kontaktinfo",
  addressLabel: "Adresse",
  phoneLabel: "Telefon",
  emailLabel: "E-post",
  websiteLabel: "Nettside",
  instagramLabel: "Instagram",
  openingHoursTitle: "Åpningstider",
  mapButton: "Se på kartet",
  sourcesTitle: "Kilder",
  sourcesNoteLabel: "Notat",
  sourcesCapturedLabel: "Hentet",
};

export const actorCopy = {
  readMoreLabel: "Les mer",
  categoryLabels: {
    brukt: "Ombruk/second hand",
    reparasjon: "Reparasjon mobil/PC",
    gjenvinning: "Gjenvinning",
    utleie: "Utleie/utlån",
    reparasjon_sko_klar: "Reparasjon sko og klær",
    mottak_ombruk: "Mottak for ombruk",
    mobelreparasjon: "Møbelreparasjon",
    sykkelverksted: "Sykkelverksted",
    ombruksverksted: "Ombruksverksted",
    baerekraftig_mat: "Bærekraftig mat",
  },
  categoryLongLabels: {
    brukt: "Ombruk / second hand",
    reparasjon: "Reparasjon mobil/PC",
    gjenvinning: "Gjenvinning",
    utleie: "Utleie og utlån",
    reparasjon_sko_klar: "Reparasjon av sko og klær",
    mottak_ombruk: "Mottak for ombruk",
    mobelreparasjon: "Møbelreparasjon",
    sykkelverksted: "Sykkelverksted",
    ombruksverksted: "Ombruksverksted",
    baerekraftig_mat: "Bærekraftig mat",
  },
};

export const ctaContent = {
  title: "Klar for å gjøre en forskjell?",
  description:
    "Start med små steg. Her er fire enkle ting du kan gjøre denne uka:",
  actions: [
    "Kjøp én ting brukt denne uka",
    "Fiks én ting før du kjøper nytt",
    "Lever inn e-avfall på riktig sted",
    "Ta med en venn til bruktbutikk",
  ],
  primaryCta: { label: "Finn aktører i Hamar", href: "/aktorer" },
  secondaryCta: { label: "Ta sirkulærquizen", href: "/quiz" },
};

export const quizCopy = {
  introTitle: "Hvor sirkulær er du?",
  introDescription:
    "Ta vår quiz og finn ut hvor miljøvennlige vanene dine er. Du får personlige tips basert på svarene dine!",
  questionsLabel: "spørsmål",
  timeEstimate: "~2 minutter",
  startButton: "Start quizen",
  progressLabel: "Spørsmål",
  nextStepsTitle: "Dine neste steg:",
  pointsLabel: "poeng",
  shareLabel: "Del resultatet",
  retryLabel: "Ta quizen på nytt",
  exploreActorsLabel: "Utforsk aktører i Hamar",
  challengesTitle: "Utfordringer for deg",
  challengesDescription: "Fullfør utfordringer for å bli enda mer sirkulær!",
  shareTemplate:
    "Jeg fikk {score}/{maxScore} på SirkulærHamar-quizen og er en {title}! Ta quizen du også: ",
  copiedLabel: "Kopiert til utklippstavle!",
};

export const calculatorCopy = {
  cardTitle: "Reparer eller kjøp?",
  cardDescription:
    "Fyll inn hva du har og hva som er problemet - vi hjelper deg å ta det beste valget.",
  deviceLabel: "Hva slags enhet/ting?",
  devicePlaceholder: "Velg type...",
  issueLabel: "Hva er problemet?",
  issuePlaceholder: "Velg problem...",
  actionLabel: "Beregn anbefaling",
  recommendationBadge: "Anbefaling",
  savingsLabel: "mulig besparelse",
  co2Label: "CO2 spart",
  timeLabel: "estimert tid",
  priceComparisonLabel: "Prissammenligning:",
  priceLabels: {
    repair: "Reparasjon",
    used: "Kjøpe brukt",
    new: "Kjøpe nytt",
  },
  recommendedActorsLabel: "Anbefalt aktør i Hamar:",
  resetLabel: "Beregn på nytt",
  deviceOptions: [
    { value: "phone", label: "Telefon / Mobil" },
    { value: "laptop", label: "PC / Laptop" },
    { value: "clothing", label: "Klær" },
  ],
  issueOptions: {
    phone: [
      { value: "screen", label: "Knust skjerm" },
      { value: "battery", label: "Dårlig batteri" },
      { value: "slow", label: "Treg ytelse" },
    ],
    laptop: [
      { value: "screen", label: "Knust skjerm" },
      { value: "battery", label: "Dårlig batteri" },
      { value: "slow", label: "Treg ytelse" },
    ],
    clothing: [
      { value: "zipper", label: "Ødelagt glidelås" },
      { value: "seam", label: "Revet søm" },
    ],
  },
  decisionCopy: {
    repairTitle: "Reparer!",
    repairDescription:
      "Reparasjon er det beste valget. Du sparer penger og miljøet ved å forlenge levetiden på {device}.",
    buyUsedTitle: "Kjøp brukt!",
    buyUsedDescription:
      "Reparasjon kan bli dyrt. Vurder å kjøpe brukt i stedet - det er ofte billigere og bedre for miljøet enn å kjøpe nytt.",
    fallbackTitle: "Reparer!",
    fallbackDescription:
      "Reparasjon er fortsatt et godt valg. Du får beholde enheten din og sparer ressurser.",
  },
};

export const mapCopy = {
  filterAll: "Alle",
  filterBrukt: "Ombruk/second hand",
  filterReparasjon: "Reparasjon mobil/PC",
  filterUtleie: "Utleie/utlån",
  filterReparasjonSkoKlar: "Reparasjon sko og klær",
  filterMottakOmbruk: "Mottak for ombruk",
  filterMobelreparasjon: "Møbelreparasjon",
  filterSykkelverksted: "Sykkelverksted",
  filterOmbruksverksted: "Ombruksverksted",
  filterBaerekraftigMat: "Bærekraftig mat",
  filterGjenvinning: "Gjenvinning",
  nearMeLabel: "Nær meg",
  locationError: "Kunne ikke hente posisjon",
  distanceUnit: "km",
  listTitle: "Aktører",
  openNowLabel: "Åpent nå",
  closedNowLabel: "Stengt nå",
  closesAtLabel: "Stenger kl.",
  opensAtLabel: "Åpner kl.",
    priceRangeLabel: "Prisestimat",
    etaLabel: "Tidsbruk",
  hoursFallbackLabel: "Se nettsiden for åpningstider",
  routeTitle: "Rute-modus",
  routeDescription: "Velg opptil 3 stopp for en rask rute.",
  routeClearLabel: "Tøm",
  routeEmptyLabel: "Ingen stopp valgt ennå.",
  routeRemoveLabel: "Fjern",
  routeAddLabel: "Legg til",
  routeAddedLabel: "Lagt til",
  routeDistanceLabel: "Estimert avstand (luftlinje)",
  routeOpenLabel: "Åpne rute i Google Maps",
  categoryLabels: {
    brukt: "Ombruk/second hand",
    reparasjon: "Reparasjon mobil/PC",
    gjenvinning: "Gjenvinning",
    utleie: "Utleie/utlån",
    reparasjon_sko_klar: "Reparasjon sko og klær",
    mottak_ombruk: "Mottak for ombruk",
    mobelreparasjon: "Møbelreparasjon",
    sykkelverksted: "Sykkelverksted",
    ombruksverksted: "Ombruksverksted",
    baerekraftig_mat: "Bærekraftig mat",
  },
};

export const decideCopy = {
  stepLabel: "Steg",
  nextLabel: "Neste",
  backLabel: "Tilbake",
  finishLabel: "Se anbefaling",
  restartLabel: "Start på nytt",
  steps: ["Velg type", "Velg problem", "Budsjett og tid", "Prioritet"],
  itemTitle: "Hva gjelder det?",
  problemTitle: "Hva er problemet?",
  constraintsTitle: "Hvor mye kan du bruke og hvor raskt?",
  priorityTitle: "Hva er viktigst for deg?",
  budgetLabel: "Budsjett (NOK)",
  timeLabel: "Tid (dager)",
  itemOptions: [
    { value: "phone", label: "Telefon" },
    { value: "laptop", label: "PC/Laptop" },
    { value: "clothing", label: "Klær" },
    { value: "other", label: "Annet" },
  ],
  problemOptions: {
    phone: [
      { value: "screen", label: "Knust skjerm" },
      { value: "battery", label: "Dårlig batteri" },
      { value: "slow", label: "Treg ytelse" },
      { value: "no_power", label: "Starter ikke" },
      { value: "water", label: "Vannskade" },
      { value: "other", label: "Annet" },
    ],
    laptop: [
      { value: "screen", label: "Knust skjerm" },
      { value: "battery", label: "Dårlig batteri" },
      { value: "slow", label: "Treg ytelse" },
      { value: "no_power", label: "Starter ikke" },
      { value: "water", label: "Vannskade" },
      { value: "other", label: "Annet" },
    ],
    clothing: [
      { value: "zipper", label: "Ødelagt glidelås" },
      { value: "seam", label: "Revet søm" },
      { value: "other", label: "Annet" },
    ],
    other: [{ value: "other", label: "Annet" }],
  },
  priorityOptions: [
    { value: "save_money", label: "Spare penger" },
    { value: "save_time", label: "Spare tid" },
    { value: "save_impact", label: "Mest klimaeffekt" },
    { value: "balanced", label: "Balansert" },
  ],
  resultTitle: "Anbefalt valg",
  comparisonTitle: "Sammenligning",
  alternativesTitle: "Alternativer",
  comparisonBadges: {
    best: "Best",
    alt: "Alternativ",
  },
  matchedActorsTitle: "Lokale aktører som matcher",
  noActorsLabel: "Fant ingen aktører - se kartet for flere steder.",
  explainabilityTitle: "Hvorfor dette valget?",
  savingsLabel: "Besparelse",
  timeResultLabel: "Estimert tid",
  daysLabel: "dager",
  impactLabel: "Klima-score",
  co2eLabel: "CO2e spart",
  co2eSourcesLabel: "CO2e-kilder",
  recommendedNotFeasibleLabel: "Anbefalingen er ikke helt gjennomførbar nå.",
  bestFeasibleLabel: "Beste gjennomførbare alternativ",
  recommendationDeltaLabel: "For å gjøre anbefalingen mulig:",
  confidenceLabel: "Sikkerhet",
  confidenceLevels: {
    low: "Lav",
    medium: "Middels",
    high: "Høy",
  },
  feasibilityLabels: {
    feasible: "Gjennomførbart",
    not_fully_feasible: "Ikke helt gjennomf?rbart",
  },
  feasibilityDeltaLabel: "Nesten gjennomf?rbart",
  feasibilityDeltaBudgetLabel: "Mangler",
  feasibilityDeltaTimeLabel: "Mangler",
  whyNotTitle: "Hvorfor ikke?",
  whyNotReasons: {
    overBudget: "Over budsjettet ditt",
    tooSlow: "Tar for lang tid",
    lowerImpact: "Lavere klimaeffekt",
    lowerSavings: "Lavere besparelse",
    moreExpensive: "Dyrere enn alternativet",
  },
  planB: {
    title: "Plan B",
    description: "Dette valget passer ikke helt budsjett/tid. Pr?v dette som neste steg:",
    reasons: {
      budget: "Budsjettet ditt er lavere enn anbefalt.",
      time: "Tiden din er for kort.",
    },
    steps: {
      repair: ["Be om gratis diagnose", "Sjekk brukt som backup", "Vurder ? sette av litt mer budsjett"],
      buy_used: ["Sjekk bruktmarkedet f?rst", "Avtal henting n?r du har tid", "Selg eller lever inn det gamle"],
      donate: ["Sett av tid i kalenderen", "Sorter det som kan gis bort", "Lever til ombruk n?r du kan"],
      recycle: ["Samle e-avfall hjemme", "Planlegg en tur til gjenvinning", "Sjekk ?pningstidene f?rst"],
    },
  },
  goLabel: "Gå",
  actions: {
    call: "Ring",
    directions: "Veibeskrivelse",
    website: "Nettside",
    map: "Se kart",
  },
  matching: {
    useLocationLabel: "Bruk posisjonen min",
    locationUnavailable: "Geolokasjon er ikke tilgjengelig",
    locationError: "Kunne ikke hente posisjon",
    openNowLabel: "Åpent nå",
    closedNowLabel: "Stengt nå",
    closestLabel: "Nærmest",
    serviceMatchLabel: "Dekker problemet",
    budgetFitLabel: "Innenfor budsjett",
    distanceUnit: "km",
    hoursFallbackLabel: "Se nettsiden for åpningstider",
    closesAtLabel: "Stenger kl.",
    opensAtLabel: "Åpner kl.",
    priceRangeLabel: "Prisestimat",
    etaLabel: "Tidsbruk",
  },
  optionCopy: {
    repair: {
      title: "Reparer",
      description: "Forleng levetiden og spar ressurser.",
    },
    buy_used: {
      title: "Kjøp brukt",
      description: "Brukt gir lavere klimaavtrykk enn nytt.",
    },
    donate: {
      title: "Doner/ombruk",
      description: "Gi bort eller lever inn til ombruk.",
    },
    recycle: {
      title: "Resirkuler",
      description: "Sørg for riktig håndtering av avfall.",
    },
  },
  reasonLabels: {
    budget_ok: "Innenfor budsjett",
    fast_enough: "Rask nok",
    high_impact: "Høy klimaeffekt",
    high_risk: "Høy risiko",
    policy_right_to_repair: "Prioriterer reparasjon (rett til ? reparere)",
    best_overall: "Beste totalvalg",
  },
};

export const footerContent = {
  about:
    "Din guide til bærekraftige valg i Hamar. Gjenbruk, reparer, resirkuler.",
  navigationTitle: "Navigasjon",
  actorsTitle: "Aktører",
  sourcesTitle: "Kilder",
  actorLinks: [
    { label: "Kirppis Hamar", href: "/aktorer/kirppis-hamar" },
    { label: "Resirkula", href: "/aktorer/resirkula" },
    { label: "Mobit Hamar", href: "/aktorer/mobit-hamar" },
  ],
  sourceLinks: [
    { label: "NDLA", href: "https://ndla.no" },
    { label: "Framtiden i våre hender", href: "https://framtiden.no" },
    { label: "Miljøstatus", href: "https://miljostatus.miljodirektoratet.no" },
  ],
  copyright:
    "© 2025 SirkulærHamar. Laget som skoleprosjekt om sirkulær økonomi.",
};

export const actors = [
  {
    id: "kirppis-hamar",
    name: "Kirppis Hamar",
    slug: "kirppis-hamar",
    category: "brukt",
    description:
      "Bruktbutikk på Maxi Storsenter med skattejakt-opplevelse og standutleie.",
    longDescription:
      "Kirppis Hamar er en bruktbutikk der du kan kjøpe og selge brukte varer via standutleie. Butikken håndterer salget for deg, og utvalget endrer seg hele tiden - perfekt for en skattejakt etter klær, interiør og småmøbler.",
    address: "Aslak Bolts gate 48, 2316 Hamar",
    lat: 60.798701,
    lng: 11.04672,
    phone: "70 23 92 02",
    email: "hamar@kirppis.no",
    website: "https://www.kirppis.no/min-kirppis/",
    instagram: "https://www.instagram.com/kirppishamar/",
    openingHours: ["Man-fre: 10:00-21:00", "Lør: 10:00-18:00", "Søn: Stengt"],
    openingHoursOsm: "Mo-Fr 10:00-21:00; Sa 10:00-18:00; Su off",
    tags: ["klær", "møbler", "interiør", "stand", "vintage"],
    benefits: [
      "Spar penger på unike funn",
      "Gir brukte varer nytt liv",
      "Enkelt å selge via standutleie",
      "Nytt utvalg hver uke",
    ],
    howToUse: [
      "Stikk innom og let etter skatter",
      "Spør om standutleie hvis du vil selge",
      "Følg Instagram for oppdateringer",
      "Ta med det du vil levere til salg",
    ],
    image: "/thrift-store-interior-with-vintage-clothes-and-fur.jpg",
    sources: [
      {
        type: "website",
        title: "Kirppis Hamar - Min Kirppis",
        url: "https://www.kirppis.no/min-kirppis/",
        capturedAt: "2026-01-14",
        note: "Adresse, åpningstider og kontaktinformasjon.",
      },
      {
        type: "social",
        title: "Kirppis Hamar Instagram",
        url: "https://www.instagram.com/kirppishamar/",
        capturedAt: "2026-01-14",
        note: "Bilder, tilbud og oppdateringer.",
      },
      {
        type: "map",
        title: "Kirppis Hamar på kart",
        url: "https://goo.gl/maps/5ige2e7jacAqNRgbA",
        capturedAt: "2026-01-14",
        note: "Plassering ved Maxi Storsenter.",
      },
    ],
  },
  {
    id: "resirkula",
    name: "Resirkula",
    slug: "resirkula",
    category: "brukt",
    description:
      "Gjenbrukskjøpesenter i Kretsløpsparken med ombruk og kvalitetssikrede varer.",
    longDescription:
      "Resirkula er et gjenbrukskjøpesenter i Kretsløpsparken der varer fra ombruk blir kvalitetssikret og solgt på nytt. Her finner du flere butikker under samme tak og et spesielt fokus på ombruk og redusert avfall.",
    address: "Holmefaret 16, 2320 Furnes",
    lat: 60.842008,
    lng: 11.086002,
    website: "https://www.resirkula.no/",
    instagram: "https://www.instagram.com/resirkula/",
    openingHours: [
      "Man-tors: 10:00-17:00",
      "Fre: 10:00-16:00",
      "Lør: 10:00-15:00",
      "Søn: Stengt",
    ],
    openingHoursOsm:
      "Mo-Th 10:00-17:00; Fr 10:00-16:00; Sa 10:00-15:00; Su off",
    tags: ["gjenbruk", "ombruk", "møbler", "elektronikk", "butikker"],
    benefits: [
      "Kvalitetssikrede bruktvarer",
      "Reduserer avfall lokalt",
      "Mange kategorier i ett senter",
      "Bra for møbler og elektronikk",
    ],
    howToUse: [
      "Planlegg turen med åpningstidene",
      "Sjekk flere butikker under samme tak",
      "Spør om ombruk og innlevering",
      "Ta med venner og gjør det til en runde",
    ],
    image: "/organized-secondhand-store-with-furniture-and-elec.jpg",
    sources: [
      {
        type: "website",
        title: "Resirkula",
        url: "https://www.resirkula.no/",
        capturedAt: "2026-01-14",
        note: "Beskrivelse av konsept og adresse.",
      },
      {
        type: "website",
        title: "Åpningstider Resirkula",
        url: "https://www.resirkula.no/apningstider-2/apningstider",
        capturedAt: "2026-01-14",
        note: "Oppdaterte åpningstider.",
      },
      {
        type: "social",
        title: "Resirkula Instagram",
        url: "https://www.instagram.com/resirkula/",
        capturedAt: "2026-01-14",
        note: "Bilder og kampanjer.",
      },
    ],
  },
  {
    id: "mobit-hamar",
    name: "Mobit Hamar",
    slug: "mobit-hamar",
    category: "reparasjon",
    description: "Lokal mobil- og IT-service med rådgivning og reparasjoner.",
    longDescription:
      "Mobit Hamar tilbyr service og reparasjon av mobil og IT-utstyr, samt rådgivning for å få enheten din til å vare lenger. De hjelper med feilsøking, bytte av deler og gir deg et ærlig estimat før du bestemmer deg.",
    address: "Furnesvegen 122A, 2318 Hamar",
    lat: 60.8058547,
    lng: 11.0844027,
    phone: "62 55 60 00",
    email: "hamar@mobit.no",
    website: "https://www.mobit.no/forhandlere/hamar",
    openingHours: ["Se nettsiden for åpningstider"],
    tags: ["mobil", "PC", "service", "reparasjon", "IT"],
    benefits: [
      "Forlenger levetiden på elektronikk",
      "Reduserer e-avfall",
      "Lokal og rask service",
      "Får et prisoverslag før du bestemmer deg",
    ],
    howToUse: [
      "Beskriv problemet og be om vurdering",
      "Få prisestimat og tidsbruk",
      "Lever inn enheten",
      "Hent ferdig reparert - eller få råd om brukt",
    ],
    repairServices: [
      { problemType: "screen", itemTypes: ["phone", "laptop"], priceMin: 900, priceMax: 1800, etaDays: 2 },
      { problemType: "battery", itemTypes: ["phone", "laptop"], priceMin: 500, priceMax: 1200, etaDays: 1 },
      { problemType: "slow", itemTypes: ["phone", "laptop"], priceMin: 400, priceMax: 900, etaDays: 1 },
      { problemType: "no_power", itemTypes: ["phone", "laptop"], priceMin: 900, priceMax: 2000, etaDays: 3 },
      { problemType: "water", itemTypes: ["phone", "laptop"], priceMin: 1200, priceMax: 3000, etaDays: 4 },
    ],
    image: "/electronics-repair-shop-with-technician-fixing-sma.jpg",
    sources: [
      {
        type: "website",
        title: "Mobit Hamar",
        url: "https://www.mobit.no/forhandlere/hamar",
        capturedAt: "2026-01-14",
        note: "Adresse, telefon og kontaktinformasjon.",
      },
      {
        type: "social",
        title: "Mobit Hamar Facebook",
        url: "https://www.facebook.com/mobithamar",
        capturedAt: "2026-01-14",
        note: "Lokale oppdateringer og kundedialog.",
      },
      {
        type: "social",
        title: "Mobit Hamar LinkedIn",
        url: "https://www.linkedin.com/company/mobit-hamar-og-gj%C3%B8vik/",
        capturedAt: "2026-01-14",
        note: "Bakgrunn og bedriftsinfo.",
      },
    ],
  },
  {
    id: "kretslopsparken-gjenvinning",
    name: "Kretsløpsparken gjenvinningsstasjon",
    slug: "kretslopsparken-gjenvinning",
    category: "gjenvinning",
    description:
      "Gjenvinningsstasjon i Kretsløpsparken for sortering av avfall og e-avfall.",
    longDescription:
      "Kretsløpsparken er Sirkula sin gjenvinningsstasjon i Hamar-området. Her leverer du e-avfall og andre fraksjoner riktig, og Resirkula ligger i samme område for ombruk før gjenvinning.",
    address: "Arnkvernvegen 169, 2320 Furnes",
    lat: 60.84291,
    lng: 11.085123,
    phone: "62 54 37 00",
    email: "post@sirkula.no",
    website: "https://www.sirkula.no/gjenvinningsstasjoner/kretslopsparken/",
    openingHours: ["Se nettsiden for åpningstider"],
    tags: ["e-avfall", "gjenvinning", "sortering", "ombruk"],
    benefits: [
      "Hjelper deg å sortere riktig",
      "Reduserer farlig avfall i restavfall",
      "Kobler ombruk og gjenvinning i samme område",
      "Lokal leveringsplass for Hamar-regionen",
    ],
    howToUse: [
      "Sorter hjemme før du drar",
      "Sjekk åpningstider på nettsiden",
      "Lever e-avfall og andre fraksjoner riktig",
      "Besøk Resirkula hvis noe kan ombrukes",
    ],
    image:
      "https://www.sirkula.no/getfile.php/132780-1731567328/1.%20Sirkula.no/Sider/Bildearkiv%20Sirkula/Gjenvinningstasjoner/Kretsl%C3%B8psparken/SirkulaKretslopspark_26.jpg%20%28extra_large%29.webp",
    sources: [
      {
        type: "website",
        title: "Kretsløpsparken gjenvinningsstasjon",
        url: "https://www.sirkula.no/gjenvinningsstasjoner/kretslopsparken/",
        capturedAt: "2026-01-14",
        note: "Adresse og beskrivelse av stasjonen.",
      },
      {
        type: "map",
        title: "Kretsløpsparken på kart",
        url: "https://www.google.com/maps/search/?api=1&query=Arnkvernvegen+169+2320+Furnes",
        capturedAt: "2026-01-14",
        note: "Plassering i Kretsløpsparken.",
      },
      {
        type: "website",
        title: "Gjenvinningsstasjoner - Sirkula",
        url: "https://www.sirkula.no/gjenvinningsstasjoner/",
        capturedAt: "2026-01-14",
        note: "Oversikt over Sirkula sine stasjoner.",
      },
    ],
  },
] satisfies Actor[];

export const quizQuestions = [
  {
    id: 1,
    question: "Hva gjør du med klær du ikke bruker lenger?",
    options: [
      { text: "Kaster dem i søpla", points: 0 },
      { text: "Gir dem til venner eller familie", points: 1 },
      { text: "Leverer til bruktbutikk eller gjenvinning", points: 2 },
      { text: "Selger på Finn/Tise", points: 2 },
    ],
  },
  {
    id: 2,
    question: "Telefonen din er treg - hva gjør du?",
    options: [
      { text: "Kjøper ny telefon med en gang", points: 0 },
      { text: "Venter til den slutter å fungere", points: 1 },
      { text: "Prøver å fikse selv eller tar den til reparatør", points: 2 },
      { text: "Sjekker om problemet kan løses med oppdatering", points: 2 },
    ],
  },
  {
    id: 3,
    question: "Du trenger noe til helga - hva sjekker du først?",
    options: [
      { text: "Går rett til butikken og kjøper nytt", points: 0 },
      { text: "Sjekker om noen kan låne meg det", points: 1 },
      { text: "Sjekker bruktbutikk eller Finn først", points: 2 },
      { text: "Vurderer om jeg virkelig trenger det", points: 2 },
    ],
  },
  {
    id: 4,
    question: "Hva gjør du med småelektronikk som ikke funker?",
    options: [
      { text: "Kaster i vanlig søppel", points: 0 },
      { text: "Legger i en skuff og glemmer det", points: 0 },
      { text: "Leverer på gjenvinningsstasjon", points: 2 },
      { text: "Prøver å få det reparert først", points: 2 },
    ],
  },
  {
    id: 5,
    question: "Hvor ofte kjøper du noe bare fordi det er billig?",
    options: [
      { text: "Hele tiden - tilbud er tilbud!", points: 0 },
      { text: "Ganske ofte", points: 1 },
      { text: "Sjelden - jeg tenker meg om", points: 2 },
      { text: "Aldri - jeg kjøper bare det jeg trenger", points: 2 },
    ],
  },
  {
    id: 6,
    question: "Hva vet du om e-avfall og gjenvinning?",
    options: [
      { text: "Ikke så mye, ærlig talt", points: 0 },
      { text: "Litt - vet at det bør sorteres", points: 1 },
      { text: "Ganske mye - vet hvor jeg leverer", points: 2 },
      { text: "Masse - prøver å spre kunnskap", points: 2 },
    ],
  },
];

export const quizResults = {
  starter: {
    title: "Sirkulær Starter",
    description:
      "Du er på begynnelsen av din sirkulære reise! Det er et flott utgangspunkt - her er noen enkle steg for å komme i gang.",
    tips: [
      "Prøv å besøke en bruktbutikk denne uka",
      'Før du kjøper noe nytt, spør deg selv: "Trenger jeg dette?"',
      "Lær hvor du leverer e-avfall i Hamar",
    ],
    badge: "🌱",
  },
  pa_vei: {
    title: "På god vei",
    description:
      "Du gjør allerede mye bra! Med noen små justeringer kan du bli en ekte gjenbrukshelt.",
    tips: [
      "Utfordring: Få noe reparert i stedet for å kjøpe nytt",
      "Del dine bruktfunn med venner",
      "Prøv å selge ting du ikke bruker på Finn eller Tise",
    ],
    badge: "♻️",
  },
  gjenbrukshelt: {
    title: "Gjenbrukshelt!",
    description:
      "Wow! Du er en inspirasjon. Nå kan du hjelpe andre å bli mer sirkulære!",
    tips: [
      "Ta med en venn til bruktbutikk",
      "Del tips på sosiale medier",
      'Vurder å bli en "sirkulær ambassadør" blant vennene dine',
    ],
    badge: "🏆",
  },
};

export const challenges = [
  {
    id: "brukt-1",
    title: "Første bruktfunn",
    description: "Kjøp én ting brukt denne uka",
    points: 10,
    icon: "🛍️",
    category: "brukt",
  },
  {
    id: "brukt-2",
    title: "Skattejeger",
    description: "Besøk en bruktbutikk i Hamar",
    points: 15,
    icon: "🧭",
    category: "brukt",
  },
  {
    id: "repair-1",
    title: "Reparasjonssjekk",
    description: "Sjekk om noe du eier kan repareres",
    points: 10,
    icon: "🛠️",
    category: "reparasjon",
  },
  {
    id: "repair-2",
    title: "Fiks det!",
    description: "Få noe reparert i stedet for å kjøpe nytt",
    points: 25,
    icon: "🔧",
    category: "reparasjon",
  },
  {
    id: "recycle-1",
    title: "E-avfall ekspert",
    description: "Lever inn e-avfall på riktig sted",
    points: 15,
    icon: "🔋",
    category: "gjenvinning",
  },
  {
    id: "social-1",
    title: "Sirkulær venn",
    description: "Ta med en venn til bruktbutikk",
    points: 20,
    icon: "🤝",
    category: "brukt",
  },
] satisfies Challenge[];

export const repairData = {
  phone: {
    screen: {
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
    battery: {
      deviceType: "Telefon",
      issue: "Dårlig batteri",
      repairCostMin: 500,
      repairCostMax: 1000,
      repairDays: 1,
      usedPriceMin: 2000,
      usedPriceMax: 5000,
      newPrice: 8000,
      co2Saved: 45,
    },
    slow: {
      deviceType: "Telefon",
      issue: "Treg ytelse",
      repairCostMin: 300,
      repairCostMax: 800,
      repairDays: 1,
      usedPriceMin: 2000,
      usedPriceMax: 5000,
      newPrice: 8000,
      co2Saved: 45,
    },
  },
  laptop: {
    screen: {
      deviceType: "PC/Laptop",
      issue: "Knust skjerm",
      repairCostMin: 1500,
      repairCostMax: 4000,
      repairDays: 3,
      usedPriceMin: 3000,
      usedPriceMax: 8000,
      newPrice: 12000,
      co2Saved: 300,
    },
    battery: {
      deviceType: "PC/Laptop",
      issue: "Dårlig batteri",
      repairCostMin: 800,
      repairCostMax: 2000,
      repairDays: 2,
      usedPriceMin: 3000,
      usedPriceMax: 8000,
      newPrice: 12000,
      co2Saved: 300,
    },
    slow: {
      deviceType: "PC/Laptop",
      issue: "Treg ytelse",
      repairCostMin: 500,
      repairCostMax: 1500,
      repairDays: 2,
      usedPriceMin: 3000,
      usedPriceMax: 8000,
      newPrice: 12000,
      co2Saved: 300,
    },
  },
  clothing: {
    zipper: {
      deviceType: "Klær",
      issue: "Ødelagt glidelås",
      repairCostMin: 100,
      repairCostMax: 300,
      repairDays: 3,
      usedPriceMin: 100,
      usedPriceMax: 500,
      newPrice: 800,
      co2Saved: 10,
    },
    seam: {
      deviceType: "Klær",
      issue: "Revet søm",
      repairCostMin: 50,
      repairCostMax: 200,
      repairDays: 2,
      usedPriceMin: 100,
      usedPriceMax: 500,
      newPrice: 800,
      co2Saved: 10,
    },
  },
};

export const facts = [
  {
    title: "E-avfall",
    stat: "50 millioner tonn",
    description:
      "e-avfall produseres globalt hvert år. Bare 20 % blir resirkulert.",
    icon: "🔌",
  },
  {
    title: "Klær",
    stat: "92 millioner tonn",
    description: "tekstilavfall havner på søppelfyllinger hvert år.",
    icon: "👕",
  },
  {
    title: "Reparasjon",
    stat: "70 %",
    description: "av elektronikk kan repareres i stedet for å kastes.",
    icon: "🛠️",
  },
  {
    title: "Gjenbruk",
    stat: "95 %",
    description: "mindre energi brukes ved gjenbruk av tekstiler.",
    icon: "♻️",
  },
];

export const detailedFacts = [
  {
    category: "E-avfall",
    icon: "🔌",
    title: "E-avfall er et voksende problem",
    content: [
      "Globalt produseres over 50 millioner tonn e-avfall hvert år, og det øker med 3-5 % årlig.",
      "Bare 20 % av e-avfall blir resirkulert på riktig måte. Resten havner på søppelfyllinger eller eksporteres.",
      "E-avfall inneholder verdifulle materialer som gull, sølv og kobber, men også giftige stoffer.",
      "Ved å levere inn e-avfall riktig, sikrer du at materialene kan gjenvinnes og at farlige stoffer håndteres forsvarlig.",
    ],
    tips: [
      "Lever inn gammel elektronikk på gjenvinningsstasjon eller i butikker som tar imot",
      "Vurder å reparere før du kjøper nytt",
      "Kjøp kvalitetsprodukter som varer lenger",
    ],
    sources: [
      { name: "Global E-waste Monitor", url: "https://globalewaste.org" },
      { name: "WEEE Forum", url: "https://weee-forum.org" },
    ],
  },
  {
    category: "Tekstiler",
    icon: "👕",
    title: "Fast fashion skader miljøet",
    content: [
      "Klesindustrien står for rundt 10 % av globale CO2-utslipp - mer enn fly og shipping til sammen.",
      "92 millioner tonn tekstilavfall produseres globalt hvert år. Det meste havner på søppelfyllinger.",
      "Det kreves rundt 2700 liter vann å produsere én t-skjorte - nok til drikkevann for én person i 2,5 år.",
      "Ved å kjøpe brukt sparer du i gjennomsnitt 95 % av energien som trengs for å produsere noe nytt.",
    ],
    tips: [
      "Kjøp brukt - bruktbutikker har ofte unike funn",
      "Reparer klær i stedet for å kaste dem",
      "Velg kvalitet over kvantitet",
      "Doner eller selg klær du ikke bruker",
    ],
    sources: [
      {
        name: "Ellen MacArthur Foundation",
        url: "https://ellenmacarthurfoundation.org",
      },
      { name: "WRAP", url: "https://wrap.org.uk" },
    ],
  },
  {
    category: "Reparasjon",
    icon: "🛠️",
    title: "Reparasjon forlenger levetiden",
    content: [
      "Opptil 70 % av elektronikk som kastes kunne vært reparert.",
      "EU har innført nye regler som gir deg rett til å reparere - produsenter må tilby reservedeler.",
      "Å reparere i stedet for å kjøpe nytt kan spare deg tusenvis av kroner.",
      "Reparasjon skaper lokale arbeidsplasser og holder penger i lokalsamfunnet.",
    ],
    tips: [
      "Sjekk alltid om noe kan repareres før du kjøper nytt",
      "Finn lokale reparatører - de er ofte billigere enn du tror",
      "Lær enkle reparasjoner selv (YouTube er din venn!)",
      "Velg produkter som er laget for å kunne repareres",
    ],
    sources: [
      { name: "European Right to Repair", url: "https://repair.eu" },
      { name: "iFixit", url: "https://www.ifixit.com" },
    ],
  },
  {
    category: "Sirkulær økonomi",
    icon: "♻️",
    title: "Hva er sirkulær økonomi?",
    content: [
      "I en sirkulær økonomi holder vi ressurser i bruk så lenge som mulig.",
      "Det handler om å redusere, gjenbruke, reparere og resirkulere - i den rekkefølgen.",
      "Norge har som mål å bli et foregangsland innen sirkulær økonomi innen 2030.",
      "Lokale initiativer som bruktbutikker og reparasjonsverksteder er viktige brikker i dette.",
    ],
    tips: [
      "Tenk 'trenger jeg dette?' før du kjøper",
      "Velg brukt eller lånt fremfor nytt",
      "Del ting med venner og naboer",
      "Støtt lokale sirkulære bedrifter",
    ],
    sources: [
      { name: "Framtiden i våre hender", url: "https://www.framtiden.no" },
      {
        name: "Miljødirektoratet",
        url: "https://miljostatus.miljodirektoratet.no",
      },
    ],
  },
];
