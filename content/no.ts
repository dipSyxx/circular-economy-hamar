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
    brukt: "Brukt",
    reparasjon: "Reparasjon",
    gjenvinning: "Gjenvinning",
  },
  categoryLongLabels: {
    brukt: "Brukthandel",
    reparasjon: "Reparasjon",
    gjenvinning: "Gjenvinning",
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
  filterBrukt: "Brukt",
  filterReparasjon: "Reparasjon",
  filterGjenvinning: "Gjenvinning",
  nearMeLabel: "Nær meg",
  locationError: "Kunne ikke hente posisjon",
  distanceUnit: "km",
  listTitle: "Aktører",
  openNowLabel: "Åpent nå",
  closedNowLabel: "Stengt nå",
  closesAtLabel: "Stenger kl.",
  opensAtLabel: "Åpner kl.",
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
    brukt: "Brukt",
    reparasjon: "Reparasjon",
    gjenvinning: "Gjenvinning",
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
  impactLabel: "Klima-score",
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
    distanceUnit: "km",
    hoursFallbackLabel: "Se nettsiden for åpningstider",
    closesAtLabel: "Stenger kl.",
    opensAtLabel: "Åpner kl.",
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
  // -------------------------
  // Brukt / Ombruk (Hamar)
  // -------------------------
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
    tags: ["klær", "møbler", "interiør", "stand", "vintage", "ombruk"],
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
        note: "Adresse, info.",
      },
      {
        type: "social",
        title: "Kirppis Hamar Instagram",
        url: "https://www.instagram.com/kirppishamar/",
        capturedAt: "2026-01-14",
        note: "Bilder/oppdateringer.",
      },
      {
        type: "map",
        title: "Kirppis Hamar (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Aslak%20Bolts%20gate%2048%2C%202316%20Hamar",
        capturedAt: "2026-01-14",
        note: "Plassering.",
      },
    ],
  },

  {
    id: "resirkula",
    name: "Resirkula",
    slug: "resirkula",
    category: "brukt",
    description:
      "Ombruks-/gjenbrukssenter i Kretsløpsparken med flere butikker og tjenester.",
    longDescription:
      "Resirkula er et ombruks-/gjenbrukssenter i Kretsløpsparken der varer får nytt liv gjennom salg, redesign og reparasjon via ulike aktører under samme tak.",
    address: "Holmefaret 16, 2320 Furnes",
    lat: 60.842008,
    lng: 11.086002,
    phone: "62 54 37 00",
    email: "post@sirkula.no",
    website: "https://www.resirkula.no/",
    instagram: "https://www.instagram.com/resirkula/",
    openingHours: ["Se nettsiden for åpningstider"],
    openingHoursOsm: "",
    tags: ["gjenbruk", "ombruk", "møbler", "elektronikk", "butikker"],
    benefits: [
      "Kvalitetssikrede bruktvarer",
      "Reduserer avfall lokalt",
      "Mange kategorier i ett senter",
      "Kobler ombruk og reparasjon",
    ],
    howToUse: [
      "Planlegg turen",
      "Sjekk butikkene",
      "Spør om innlevering/ombruk",
      "Ta med venner - gjør det til en runde",
    ],
    image: "/organized-secondhand-store-with-furniture-and-elec.jpg",
    sources: [
      {
        type: "website",
        title: "Resirkula (offisiell)",
        url: "https://www.resirkula.no/",
        capturedAt: "2026-01-14",
        note: "Konsept, lenker til butikker.",
      },
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Resirkula listet som ombrukssenter.",
      },
      {
        type: "social",
        title: "Resirkula Instagram",
        url: "https://www.instagram.com/resirkula/",
        capturedAt: "2026-01-14",
        note: "Oppdateringer.",
      },
      {
        type: "map",
        title: "Resirkula (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Holmefaret%2016%2C%202320%20Furnes",
        capturedAt: "2026-01-14",
        note: "Plassering.",
      },
    ],
  },

  // Resirkula – under-aktører (Holmefaret 16, Furnes)
  {
    id: "gronne-saker-resirkula",
    name: "Grønne saker (Resirkula)",
    slug: "gronne-saker-resirkula",
    category: "brukt",
    description: "Interiørbutikk (ombruk) på Resirkula.",
    longDescription:
      "Grønne saker er listet som interiør-aktør i Resirkula/ombruksklyngen. Bruk som ‘buy used’ match i Decision Engine når brukte interiør-/hjemmevarer er relevant.",
    address: "Holmefaret 16, 2320 Furnes",
    lat: 60.842008,
    lng: 11.086002,
    website: "https://www.resirkula.no/",
    openingHours: ["Se nettsiden for åpningstider"],
    openingHoursOsm: "",
    tags: ["interiør", "ombruk", "brukt"],
    benefits: [
      "Gir ting nytt liv",
      "Reduserer overforbruk",
      "Lokal sirkulær handel",
    ],
    howToUse: [
      "Besøk Resirkula",
      "Sjekk utvalget",
      "Del funn med #SirkulærHamar",
    ],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Grønne saker listet under Hamar/Resirkula.",
      },
      {
        type: "map",
        title: "Grønne saker (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Holmefaret%2016%2C%202320%20Furnes",
        capturedAt: "2026-01-14",
        note: "Samme lokasjon som Resirkula.",
      },
    ],
  },

  {
    id: "melkespannet-resirkula",
    name: "Melkespannet kalkmaling og redesign (Resirkula)",
    slug: "melkespannet-resirkula",
    category: "brukt",
    description: "Interiør / redesign-aktør på Resirkula.",
    longDescription:
      "Melkespannet er listet av Sirkula som interiør-/redesign-aktør i Resirkula-klyngen. God match når brukeren vurderer å ‘upcycle’/fornye i stedet for å kjøpe nytt.",
    address: "Holmefaret 16, 2320 Furnes",
    lat: 60.842008,
    lng: 11.086002,
    website: "https://www.resirkula.no/",
    openingHours: ["Se nettsiden for åpningstider"],
    openingHoursOsm: "",
    tags: ["interiør", "redesign", "ombruk", "upcycle"],
    benefits: [
      "Forlenger levetid på ting",
      "Mindre avfall",
      "Kreativ gjenbruk",
    ],
    howToUse: [
      "Besøk Resirkula",
      "Spør om redesign-løsninger",
      "Planlegg et upcycle-prosjekt",
    ],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Melkespannet listet under Hamar/Resirkula.",
      },
      {
        type: "map",
        title: "Melkespannet (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Holmefaret%2016%2C%202320%20Furnes",
        capturedAt: "2026-01-14",
        note: "Samme lokasjon som Resirkula.",
      },
    ],
  },

  {
    id: "resport-og-fritid-resirkula",
    name: "Resport og fritid (Resirkula)",
    slug: "resport-og-fritid-resirkula",
    category: "reparasjon",
    description:
      "Sports- og fritidsutstyr + reparasjon (sykkel/ski m.m.) i Resirkula-klyngen.",
    longDescription:
      "Resport og fritid er listet som aktør for sports- og fritidsutstyr og reparasjon av sykler, ski og annet sportsutstyr. Dette er en sterk ‘repair’ match for ungdom som vil fikse framfor å kjøpe nytt.",
    address: "Holmefaret 16, 2320 Furnes",
    lat: 60.842008,
    lng: 11.086002,
    website: "https://www.resirkula.no/",
    openingHours: ["Se nettsiden for åpningstider"],
    openingHoursOsm: "",
    tags: ["sport", "friluft", "sykkel", "ski", "reparasjon", "ombruk"],
    benefits: [
      "Forlenger levetid på utstyr",
      "Mindre forbruk",
      "Lavere klimafotavtrykk",
    ],
    howToUse: [
      "Ta med utstyr som trenger fiks",
      "Be om vurdering",
      "Vurder brukt utstyr når det gir mening",
    ],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Resport og fritid listet med reparasjonstjenester.",
      },
      {
        type: "map",
        title: "Resport og fritid (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Holmefaret%2016%2C%202320%20Furnes",
        capturedAt: "2026-01-14",
        note: "Samme lokasjon som Resirkula.",
      },
    ],
  },

  // -------------------------
  // Elektronikk reparasjon (Hamar / Resirkula-klynge)
  // -------------------------
  {
    id: "reelektro-resirkula",
    name: "Re:Elektro (Resirkula)",
    slug: "reelektro-resirkula",
    category: "reparasjon",
    description: "Reparerer elektronikk (ikke hvitevarer) i Resirkula-klyngen.",
    longDescription:
      "Re:Elektro er listet som elektronikk-aktør som reparerer elektronikk (ikke hvitevarer). Bruk som primær ‘repair’ match for telefon/PC i Decision Engine.",
    address: "Holmefaret 16, 2320 Furnes",
    lat: 60.842008,
    lng: 11.086002,
    website: "https://www.resirkula.no/butikker-og-kafe/reelektro/",
    openingHours: ["Se nettsiden for åpningstider"],
    openingHoursOsm: "",
    tags: ["elektronikk", "e-avfall", "reparasjon", "mobil", "PC"],
    benefits: [
      "Reduserer e-avfall",
      "Sparer penger",
      "Forlenger levetid på elektronikk",
    ],
    howToUse: [
      "Beskriv problemet",
      "Be om vurdering",
      "Velg reparasjon når det er mulig",
    ],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Resirkula – Re:Elektro",
        url: "https://www.resirkula.no/butikker-og-kafe/reelektro/",
        capturedAt: "2026-01-14",
        note: "Tjeneste-/aktørside.",
      },
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Re:Elektro listet med reparasjonsområde.",
      },
      {
        type: "map",
        title: "Re:Elektro (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Holmefaret%2016%2C%202320%20Furnes",
        capturedAt: "2026-01-14",
        note: "Samme lokasjon som Resirkula.",
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
      "Mobit Hamar tilbyr service og reparasjon av mobil og IT-utstyr, samt rådgivning for å få enheten din til å vare lenger.",
    address: "Furnesvegen 122A, 2318 Hamar",
    lat: 60.8058547,
    lng: 11.0844027,
    phone: "62 55 60 00",
    email: "hamar@mobit.no",
    website: "https://www.mobit.no/forhandlere/hamar",
    openingHours: ["Se nettsiden for åpningstider"],
    openingHoursOsm: "",
    tags: ["mobil", "PC", "service", "reparasjon", "IT", "e-avfall"],
    benefits: [
      "Forlenger levetiden på elektronikk",
      "Reduserer e-avfall",
      "Lokal service",
      "Prisoverslag før du bestemmer deg",
    ],
    howToUse: [
      "Beskriv problemet",
      "Få estimat",
      "Lever inn",
      "Hent ferdig eller få råd om brukt",
    ],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Mobit Hamar (offisiell)",
        url: "https://www.mobit.no/forhandlere/hamar",
        capturedAt: "2026-01-14",
        note: "Adresse/kontakt.",
      },
      {
        type: "map",
        title: "Mobit Hamar (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Furnesvegen%20122A%2C%202318%20Hamar",
        capturedAt: "2026-01-14",
        note: "Plassering.",
      },
    ],
  },

  {
    id: "tki-service-hamar",
    name: "TKI Service (hos Mobit Hamar)",
    slug: "tki-service-hamar",
    category: "reparasjon",
    description: "iPhone-/mobilservice i Hamar (lokalisert hos Mobit Hamar).",
    longDescription:
      "TKI Service oppgir at de har åpnet igjen hos Mobit Hamar, og fungerer som et ekstra ‘repair’ entrypoint (spesielt relevant for iPhone).",
    address: "Furnesvegen 122A, 2318 Hamar",
    lat: 60.8058547,
    lng: 11.0844027,
    phone: "62 55 60 00",
    website: "https://tkiservice.no/",
    openingHours: ["Se nettsiden for oppdateringer/åpningstider"],
    openingHoursOsm: "",
    tags: ["mobil", "iphone", "reparasjon", "service"],
    benefits: [
      "Reparer framfor å kjøpe nytt",
      "Rask vurdering",
      "Mindre e-avfall",
    ],
    howToUse: [
      "Kontakt via telefon/nettside",
      "Lever inn",
      "Få estimat og tidsbruk",
    ],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "TKI Service (oppdatering: hos Mobit Hamar)",
        url: "https://tkiservice.no/",
        capturedAt: "2026-01-14",
        note: "Oppgir lokasjon hos Mobit Hamar.",
      },
      {
        type: "map",
        title: "TKI Service (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Furnesvegen%20122A%2C%202318%20Hamar",
        capturedAt: "2026-01-14",
        note: "Samme lokasjon som Mobit.",
      },
    ],
  },

  {
    id: "eriksen-data-hamar",
    name: "Eriksen Data",
    slug: "eriksen-data-hamar",
    category: "reparasjon",
    description: "Data-/PC-service i Hamar (reparasjon og support).",
    longDescription:
      "Eriksen Data tilbyr dataservice og kan brukes som ‘repair’ match for PC/laptop i Decision Engine, spesielt når brukeren prioriterer rask feilsøking lokalt.",
    address: "Hamar (se firmaets nettside for besøksinfo)",
    lat: 0,
    lng: 0,
    website: "https://eriksendata.no/",
    openingHours: ["Se nettsiden for åpningstider"],
    openingHoursOsm: "",
    tags: ["PC", "laptop", "dataservice", "reparasjon", "IT"],
    benefits: [
      "Forlenger levetid på elektronikk",
      "Mindre e-avfall",
      "Lokal hjelp",
    ],
    howToUse: ["Kontakt", "Beskriv problemet", "Avtal innlevering/oppmøte"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Eriksen Data (offisiell)",
        url: "https://eriksendata.no/",
        capturedAt: "2026-01-14",
        note: "Tjenester/kontakt.",
      },
    ],
  },

  // -------------------------
  // Reparasjon (sko/tekstil) – Hamar
  // -------------------------
  {
    id: "hamar-skorep",
    name: "Hamar Skorep",
    slug: "hamar-skorep",
    category: "reparasjon",
    description: "Skomaker – reparerer sko.",
    longDescription:
      "Hamar Skorep er listet av Sirkula som skomaker i Hamar. Bruk som ‘repair’ match spesielt for klær/tilbehør og for å redusere tekstilavfall.",
    address: "Storhamargata 21, 2317 Hamar",
    lat: 0,
    lng: 0,
    website: "",
    openingHours: ["Se nettsiden/oppføring for åpningstider"],
    openingHoursOsm: "",
    tags: ["sko", "skomaker", "reparasjon", "vedlikehold"],
    benefits: ["Forlenger levetid på sko", "Sparer penger", "Mindre avfall"],
    howToUse: ["Ta med sko", "Få vurdering", "Hent når ferdig"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører (Hamar Skorep)",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Oppføring med adresse.",
      },
      {
        type: "map",
        title: "Hamar Skorep (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Storhamargata%2021%2C%20Hamar",
        capturedAt: "2026-01-14",
        note: "Plassering.",
      },
    ],
  },

  {
    id: "hamar-pelssalong-buntmaker",
    name: "Hamar pelssalong og buntmaker",
    slug: "hamar-pelssalong-buntmaker",
    category: "reparasjon",
    description: "Reparerer tekstil (skinn/pels/tekstil) i Hamar.",
    longDescription:
      "Listet av Sirkula som tekstilreparatør i Hamar. Bruk som ‘repair’ match for klær/yttertøy der reparasjon gir høy miljøeffekt.",
    address: "Torggata 73, 2317 Hamar",
    lat: 0,
    lng: 0,
    website: "",
    openingHours: ["Se oppføring for åpningstider"],
    openingHoursOsm: "",
    tags: ["tekstil", "skinn", "reparasjon", "omsøm"],
    benefits: [
      "Reduserer tekstilavfall",
      "Forlenger levetid",
      "Høy effekt per reparasjon",
    ],
    howToUse: ["Ta med plagg", "Be om vurdering", "Velg reparasjon/tilpasning"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører (pelssalong/buntmaker)",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Oppføring med adresse.",
      },
      {
        type: "map",
        title: "Pelssalong/buntmaker (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Torggata%2073%2C%20Hamar",
        capturedAt: "2026-01-14",
        note: "Plassering.",
      },
    ],
  },

  {
    id: "salgsbua-hamar",
    name: "Salgsbua Hamar",
    slug: "salgsbua-hamar",
    category: "reparasjon",
    description: "Reparasjon/omsøm, skifte av glidelås m.m.",
    longDescription:
      "Listet av Sirkula som reparasjonsaktør (omsøm, glidelås osv.). Perfekt for challenges og ‘repair’ anbefalinger for klær.",
    address: "Strandgata 73, 2317 Hamar",
    lat: 0,
    lng: 0,
    website: "",
    openingHours: ["Se oppføring for åpningstider"],
    openingHoursOsm: "",
    tags: ["klær", "omsøm", "glidelås", "reparasjon"],
    benefits: [
      "Forlenger levetid på klær",
      "Billigere enn nytt",
      "Mindre tekstilavfall",
    ],
    howToUse: ["Ta med plagg", "Forklar behov", "Hent ferdig reparert"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører (Salgsbua)",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Oppføring med adresse.",
      },
      {
        type: "map",
        title: "Salgsbua (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Strandgata%2073%2C%20Hamar",
        capturedAt: "2026-01-14",
        note: "Plassering.",
      },
    ],
  },

  {
    id: "amina-ringstad-wiik",
    name: "Amina Ringstad Wiik",
    slug: "amina-ringstad-wiik",
    category: "reparasjon",
    description: "Reparasjon av klær, skifte av glidelås m.m.",
    longDescription:
      "Listet av Sirkula som reparatør i Hamar. Bruk som ‘repair’ match for klær/tekstil.",
    address: "Karl Sigurdsons gate 22, 2317 Hamar",
    lat: 0,
    lng: 0,
    website: "",
    openingHours: ["Se oppføring for åpningstider"],
    openingHoursOsm: "",
    tags: ["klær", "reparasjon", "glidelås", "omsøm"],
    benefits: ["Forlenger levetid", "Mindre avfall", "Rimelig tiltak"],
    howToUse: ["Ta kontakt", "Lever inn", "Hent når ferdig"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører (Amina Ringstad Wiik)",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Oppføring med adresse.",
      },
      {
        type: "map",
        title: "Amina Ringstad Wiik (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Karl%20Sigurdsons%20gate%2022%2C%20Hamar",
        capturedAt: "2026-01-14",
        note: "Plassering.",
      },
    ],
  },

  {
    id: "natali-systue",
    name: "Natali Systue",
    slug: "natali-systue",
    category: "reparasjon",
    description: "Reparasjon og omsøm (Maxi Storsenter).",
    longDescription:
      "Listet av Sirkula som reparatør i Hamar, lokalisert på Maxi Storsenter. Bruk som ‘repair’ match for klær/tekstil og challenges.",
    address: "Aslak Bolts gate 48, 2316 Hamar (Maxi Storsenter, 2. etasje)",
    lat: 0,
    lng: 0,
    website: "",
    openingHours: ["Se oppføring for åpningstider"],
    openingHoursOsm: "",
    tags: ["systue", "omsøm", "reparasjon", "klær"],
    benefits: [
      "Forlenger levetid på klær",
      "Mindre tekstilavfall",
      "Rask løsning",
    ],
    howToUse: ["Ta med plagg", "Forklar ønsket endring", "Hent når ferdig"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører (Natali Systue)",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Oppføring med adresse.",
      },
      {
        type: "map",
        title: "Natali Systue (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Aslak%20Bolts%20gate%2048%2C%20Hamar",
        capturedAt: "2026-01-14",
        note: "Plassering.",
      },
    ],
  },

  {
    id: "turistforeningen-anja-hekne",
    name: "Hamar og Hedemarken Turistforening / Anja Hekne",
    slug: "turistforeningen-anja-hekne",
    category: "reparasjon",
    description: "Reparerer turtøy (listet av Sirkula).",
    longDescription:
      "Listet av Sirkula som reparasjonsaktør for turtøy. Sterk ‘repair’ match når ungdom ønsker å fikse friluftsklær framfor å kjøpe nytt.",
    address: "Strandgata 21, 2317 Hamar",
    lat: 0,
    lng: 0,
    website: "",
    openingHours: ["Se oppføring for detaljer"],
    openingHoursOsm: "",
    tags: ["turtøy", "friluft", "reparasjon", "tekstil"],
    benefits: [
      "Mindre overforbruk",
      "Forlenger levetid",
      "Reduserer tekstilavfall",
    ],
    howToUse: ["Ta kontakt", "Avtal reparasjon", "Hent når ferdig"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører (Turistforeningen/Anja Hekne)",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Oppføring med adresse.",
      },
      {
        type: "map",
        title: "Turistforeningen/Anja Hekne (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Strandgata%2021%2C%20Hamar",
        capturedAt: "2026-01-14",
        note: "Plassering.",
      },
    ],
  },

  // -------------------------
  // Brukt / Vintage (Hamar sentrum)
  // -------------------------
  {
    id: "uff-second-hand-hamar",
    name: "UFF Second Hand Hamar",
    slug: "uff-second-hand-hamar",
    category: "brukt",
    description: "Second hand-butikk (UFF) i Hamar sentrum.",
    longDescription:
      "UFF Second Hand er en gjenbruks-/secondhand-aktør med butikk i Hamar. Bra fallback for ‘buy used’ innen klær og tilbehør.",
    address: "Strandgata 71, 2317 Hamar",
    lat: 0,
    lng: 0,
    email: "info@uffnorge.org",
    website: "https://uffnorge.org/",
    openingHours: ["Se oppføring for åpningstider"],
    openingHoursOsm: "",
    tags: ["klær", "secondhand", "ombruk"],
    benefits: ["Sparer penger", "Reduserer tekstilavfall", "Gir klær nytt liv"],
    howToUse: ["Stikk innom", "Finn brukt", "Del funn med #SirkulærHamar"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "UFF Norge (offisiell)",
        url: "https://uffnorge.org/",
        capturedAt: "2026-01-14",
        note: "Organisasjon/oversikt.",
      },
      {
        type: "website",
        title: "Loppetur – UFF Second Hand Hamar",
        url: "https://loppetur.no/secondhandbutikker/uff-second-hand-hamar",
        capturedAt: "2026-01-14",
        note: "Butikkoppføring med adresse.",
      },
      {
        type: "map",
        title: "UFF Hamar (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Strandgata%2071%2C%20Hamar",
        capturedAt: "2026-01-14",
        note: "Plassering.",
      },
    ],
  },

  {
    id: "icon-retro-hamar",
    name: "Icon Retro Hamar",
    slug: "icon-retro-hamar",
    category: "brukt",
    description: "Retro/vintage bruktbutikk i Hamar sentrum.",
    longDescription:
      "Icon Retro er en brukt-/vintage aktør i Hamar, relevant for ungdom som vil finne unike plagg og redusere overforbruk.",
    address: "Strandgata, 2317 Hamar (se oppføring for eksakt adresse)",
    lat: 0,
    lng: 0,
    website: "",
    openingHours: ["Se oppføring for åpningstider"],
    openingHoursOsm: "",
    tags: ["vintage", "retro", "klær", "brukt"],
    benefits: ["Unike funn", "Mindre overforbruk", "Sirkulær mote"],
    howToUse: ["Besøk butikk", "Se etter vintage", "Del funn"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Gulesider – Icon Retro Hamar",
        url: "https://www.gulesider.no/icon+retro+hamar/bedrifter",
        capturedAt: "2026-01-14",
        note: "Butikkoppføring.",
      },
      {
        type: "map",
        title: "Icon Retro (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Icon%20Retro%20Hamar",
        capturedAt: "2026-01-14",
        note: "Kart-søk.",
      },
    ],
  },

  {
    id: "fivreld-vintage-hamar",
    name: "Fivreld Vintage",
    slug: "fivreld-vintage-hamar",
    category: "brukt",
    description: "Vintage-aktør i Hamar (nett/oppføring).",
    longDescription:
      "Fivreld Vintage er en vintage-aktør som kan brukes som ‘buy used’ innen klær og stil.",
    address: "Hamar (se nettside/oppføring for detaljer)",
    lat: 0,
    lng: 0,
    website: "https://fivreldvintage.no/",
    openingHours: ["Se nettsiden"],
    openingHoursOsm: "",
    tags: ["vintage", "klær", "brukt"],
    benefits: ["Unikt utvalg", "Sirkulær mote", "Mindre tekstilavfall"],
    howToUse: ["Sjekk nettsiden", "Følg oppdateringer", "Handle brukt"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Fivreld Vintage (offisiell)",
        url: "https://fivreldvintage.no/",
        capturedAt: "2026-01-14",
        note: "Nettsted/brand.",
      },
    ],
  },

  {
    id: "gjenbruken-hamar",
    name: "Gjenbruken Hamar",
    slug: "gjenbruken-hamar",
    category: "brukt",
    description: "Bruktbutikk med mottak av gaver og salg av brukte ting.",
    longDescription:
      "Gjenbruken tar imot gaver og selger brukte varer videre. Et godt sted å levere inn ting du ikke trenger, og finne rimelige bruktskatter lokalt.",
    address: "Stormyrvegen 11, 2315 Hamar",
    lat: 0,
    lng: 0,
    phone: "40 44 34 73",
    email: "hamar@gjenbruken.no",
    website: "https://gjenbruken.no/hamar/",
    openingHours: ["Se nettsiden for åpningstider"],
    openingHoursOsm: "",
    tags: ["ombruk", "gi bort", "brukt", "donate"],
    benefits: ["Gir ting nytt liv", "Rimelige funn", "Lokal ombruksløsning"],
    howToUse: [
      "Lever inn gaver i åpningstiden",
      "Sjekk nettsiden for avvik",
      "Kom innom og finn brukt",
    ],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Gjenbruken Hamar (offisiell)",
        url: "https://gjenbruken.no/hamar/",
        capturedAt: "2026-01-14",
        note: "Adresse/åpningstider/kontakt.",
      },
      {
        type: "map",
        title: "Gjenbruken Hamar (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Stormyrvegen%2011%2C%20Hamar",
        capturedAt: "2026-01-14",
        note: "Plassering.",
      },
    ],
  },

  // -------------------------
  // Deling / utlån (Hamar)
  // -------------------------
  {
    id: "bua-hamar",
    name: "BUA Hamar",
    slug: "bua-hamar",
    category: "brukt",
    description: "Gratis utlån av sport- og friluftsutstyr i Hamar.",
    longDescription:
      "BUA lar ungdom låne utstyr i stedet for å kjøpe nytt. En konkret sirkulær løsning og perfekt som ‘buy used/donate’ alternativ i beslutningsflyten.",
    address: "Hamar (se kommunen/BUA for adresse/åpningstider)",
    lat: 0,
    lng: 0,
    website:
      "https://stiftelsencrux.no/vare-virksomheter/hamartiltakene/bua-hamar",
    openingHours: ["Se nettsiden for åpningstider"],
    openingHoursOsm: "",
    tags: ["deling", "utlån", "sport", "friluft", "ungdom"],
    benefits: [
      "Sparer penger",
      "Mindre overforbruk",
      "Lav terskel for aktivitet",
    ],
    howToUse: ["Reserver/lån utstyr", "Hent/lever", "Inviter venner på tur"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "BUA Hamar (CRUX)",
        url: "https://stiftelsencrux.no/vare-virksomheter/hamartiltakene/bua-hamar",
        capturedAt: "2026-01-14",
        note: "Tjenesteinfo.",
      },
      {
        type: "website",
        title: "Hamar kommune – BUA",
        url: "https://www.hamar.kommune.no/aktuelt/bua.45978.aspx",
        capturedAt: "2026-01-14",
        note: "Kommunal omtale.",
      },
      {
        type: "map",
        title: "BUA Hamar (kart-søk)",
        url: "https://www.google.com/maps/search/?api=1&query=BUA%20Hamar",
        capturedAt: "2026-01-14",
        note: "Kart-søk.",
      },
    ],
  },

  // -------------------------
  // Gjenvinning (Hamar / Kretsløpsparken)
  // -------------------------
  {
    id: "kretslopsparken-gjenvinning",
    name: "Kretsløpsparken gjenvinningsstasjon (Sirkula)",
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
    openingHoursOsm: "",
    tags: ["e-avfall", "gjenvinning", "sortering", "ombruk"],
    benefits: [
      "Hjelper deg å sortere riktig",
      "Reduserer farlig avfall",
      "Kobler ombruk og gjenvinning",
      "Lokal leveringsplass",
    ],
    howToUse: [
      "Sorter hjemme",
      "Sjekk åpningstider",
      "Lever e-avfall riktig",
      "Besøk Resirkula først ved ombruk",
    ],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Kretsløpsparken gjenvinningsstasjon (Sirkula)",
        url: "https://www.sirkula.no/gjenvinningsstasjoner/kretslopsparken/",
        capturedAt: "2026-01-14",
        note: "Stasjonsinfo.",
      },
      {
        type: "map",
        title: "Kretsløpsparken (kart)",
        url: "https://www.google.com/maps/search/?api=1&query=Arnkvernvegen%20169%2C%202320%20Furnes",
        capturedAt: "2026-01-14",
        note: "Plassering.",
      },
    ],
  },

  // -------------------------
  // Region (Hedmarken) – ekstra “nær Hamar” aktører fra Sirkula-listen
  // -------------------------
  {
    id: "hamar-salmakerverksted-stange",
    name: "Hamar salmakerverksted",
    slug: "hamar-salmakerverksted-stange",
    category: "reparasjon",
    description: "Reparasjon av lær/hud/skinn/tekstiler (Stange).",
    longDescription:
      "Listet av Sirkula som reparatør i Stange – relevant som ‘repair’ alternativ når Hamar-aktører er fulle/stengt.",
    address: "Stensrudvegen 10, 2335 Stange",
    lat: 0,
    lng: 0,
    website: "",
    openingHours: ["Se oppføring for detaljer"],
    openingHoursOsm: "",
    tags: ["lær", "skinn", "tekstil", "reparasjon"],
    benefits: ["Forlenger levetid", "Mindre avfall"],
    howToUse: ["Ta kontakt", "Avtal reparasjon"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører (Stange)",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Oppføring med adresse.",
      },
    ],
  },

  {
    id: "tpn-service-as-stange",
    name: "TPN Service AS",
    slug: "tpn-service-as-stange",
    category: "reparasjon",
    description: "Reparasjon av metall / sveising (Stange).",
    longDescription:
      "Listet av Sirkula som reparatør i Stange – bruk ved behov for ‘repair’ på metall/utstyr.",
    address: "Rognstadvegen 49, 2335 Stange",
    lat: 0,
    lng: 0,
    website: "",
    openingHours: ["Se oppføring for detaljer"],
    openingHoursOsm: "",
    tags: ["metall", "sveising", "reparasjon"],
    benefits: ["Reparer framfor å kjøpe nytt"],
    howToUse: ["Kontakt", "Avtal reparasjon"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Sirkula – Ombruk og reparatører (Stange)",
        url: "https://www.sirkula.no/ombruk/ombruk-og-reparatorer/",
        capturedAt: "2026-01-14",
        note: "Oppføring med adresse.",
      },
    ],
  },

  // -------------------------
  // Digital / nasjonale (brukes lokalt i Hamar)
  // -------------------------
  {
    id: "digital-finn",
    name: "FINN",
    slug: "finn",
    category: "brukt",
    description:
      "Norges største markedsplass for kjøp og salg av brukt (brukes lokalt i Hamar).",
    longDescription:
      "FINN er standard fallback i Decision Engine for ‘buy used’ når lokale butikker ikke har riktig vare.",
    address: "Online (Hamar-område)",
    lat: 0,
    lng: 0,
    website: "https://www.finn.no/",
    openingHours: ["Online – tilgjengelig hele tiden"],
    openingHoursOsm: "",
    tags: ["digital", "markedsplass", "brukt"],
    benefits: ["Stort utvalg", "Lokale søk", "Sparer penger"],
    howToUse: ["Søk i Hamar-området", "Filtrer på pris/avstand", "Hent lokalt"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "FINN",
        url: "https://www.finn.no/",
        capturedAt: "2026-01-14",
        note: "Digital markedsplass.",
      },
    ],
  },

  {
    id: "digital-tise",
    name: "Tise",
    slug: "tise",
    category: "brukt",
    description:
      "Secondhand-app for kjøp/salg av brukt mote (brukes lokalt i Hamar).",
    longDescription:
      "Tise er en stor secondhand-community/app for kjøp og salg av brukt (særlig mote). God fallback i ‘buy used’ flyten.",
    address: "Online (Hamar-område)",
    lat: 0,
    lng: 0,
    website: "https://tise.com/",
    openingHours: ["Online – tilgjengelig hele tiden"],
    openingHoursOsm: "",
    tags: ["digital", "secondhand", "klær", "mote"],
    benefits: [
      "Enkelt å kjøpe/selge brukt",
      "Reduserer tekstilavfall",
      "Stort community",
    ],
    howToUse: ["Søk etter Hamar", "Avtal frakt/henting", "Del funn"],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Tise (Google Play listing)",
        url: "https://play.google.com/store/apps/details?hl=no&id=com.tise.tise",
        capturedAt: "2026-01-14",
        note: "App-beskrivelse/oppdatering.",
      },
      {
        type: "website",
        title: "Tise (offisiell)",
        url: "https://tise.com/",
        capturedAt: "2026-01-14",
        note: "Offisiell side.",
      },
    ],
  },

  {
    id: "digital-too-good-to-go",
    name: "Too Good To Go",
    slug: "too-good-to-go",
    category: "brukt",
    description:
      "Matsvinn-app: redd overskuddsmat fra butikker og restauranter i nærheten.",
    longDescription:
      "Too Good To Go brukes lokalt for å redusere matsvinn ved å kjøpe ‘forundringsposer’ med overskuddsmat.",
    address: "Online (Hamar-område)",
    lat: 0,
    lng: 0,
    website: "https://www.toogoodtogo.com/",
    openingHours: ["Online – tilgjengelig hele tiden"],
    openingHoursOsm: "",
    tags: ["digital", "matsvinn", "mat", "sirkulær"],
    benefits: ["Reduserer matsvinn", "Sparer penger", "Enkelt å bruke"],
    howToUse: [
      "Finn steder i nærheten",
      "Reserver pose",
      "Hent til oppgitt tidspunkt",
    ],
    image: "/placeholder.jpg",
    sources: [
      {
        type: "website",
        title: "Too Good To Go (Google Play listing)",
        url: "https://play.google.com/store/apps/details?hl=no&id=com.app.tgtg",
        capturedAt: "2026-01-14",
        note: "App-beskrivelse.",
      },
      {
        type: "website",
        title: "Too Good To Go (offisiell)",
        url: "https://www.toogoodtogo.com/",
        capturedAt: "2026-01-14",
        note: "Offisiell side.",
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
