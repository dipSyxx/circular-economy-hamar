export interface Actor {
  id: string
  name: string
  slug: string
  category: "brukt" | "reparasjon" | "gjenvinning"
  description: string
  longDescription: string
  address: string
  lat: number
  lng: number
  phone?: string
  website?: string
  instagram?: string
  openingHours: string[]
  tags: string[]
  benefits: string[]
  howToUse: string[]
  image: string
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
  category: "brukt" | "reparasjon" | "gjenvinning"
}

export const actors: Actor[] = [
  {
    id: "1",
    name: "Kirppis",
    slug: "kirppis",
    category: "brukt",
    description: "Finsk-inspirert bruktbutikk med unike funn og vintage-skatter.",
    longDescription:
      'Kirppis er en populær bruktbutikk i Hamar som tilbyr et bredt utvalg av brukte klær, møbler, bøker og mye mer. Med sin finske inspirasjon skaper butikken en unik "skattejakt"-opplevelse hvor du aldri vet hva du finner.',
    address: "Strandgata 55, 2317 Hamar",
    lat: 60.7945,
    lng: 11.068,
    phone: "+47 62 52 00 00",
    website: "https://kirppis.no",
    instagram: "@kirppishamar",
    openingHours: ["Man-Fre: 10:00-18:00", "Lør: 10:00-16:00", "Søn: Stengt"],
    tags: ["klær", "møbler", "vintage", "bøker", "interiør"],
    benefits: [
      "Spar penger på unike funn",
      "Reduser tekstilavfall",
      "Støtt lokal sirkulær økonomi",
      "Finn vintage-perler ingen andre har",
    ],
    howToUse: [
      "Besøk butikken og ta deg tid til å lete",
      "Sjekk nye varer ukentlig",
      "Lever inn ting du ikke bruker",
      "Følg Instagram for spesialtilbud",
    ],
    image: "/thrift-store-interior-with-vintage-clothes-and-fur.jpg",
  },
  {
    id: "2",
    name: "Resirkula",
    slug: "resirkula",
    category: "brukt",
    description: "Organisert gjenbruksbutikk med fokus på kvalitet og bærekraft.",
    longDescription:
      "Resirkula er en profesjonelt drevet gjenbruksbutikk som fokuserer på kvalitetsvarer. Her finner du alt fra møbler til elektronikk, klær og sportsutstyr. Butikken samarbeider med lokale organisasjoner for å sikre at gode ting får nytt liv.",
    address: "Vangsvegen 100, 2317 Hamar",
    lat: 60.789,
    lng: 11.075,
    phone: "+47 62 53 00 00",
    website: "https://resirkula.no",
    instagram: "@resirkula",
    openingHours: ["Man-Fre: 09:00-17:00", "Lør: 10:00-15:00", "Søn: Stengt"],
    tags: ["møbler", "elektronikk", "sportsutstyr", "klær", "kvalitet"],
    benefits: [
      "Kvalitetssikrede produkter",
      "Profesjonell service",
      "Bidrar til lokale veldedige formål",
      "Bredt utvalg i én butikk",
    ],
    howToUse: [
      "Besøk butikken eller sjekk nettsiden",
      "Spør personalet om spesifikke behov",
      "Doner ting du ikke trenger",
      "Meld deg på nyhetsbrev for tilbud",
    ],
    image: "/organized-secondhand-store-with-furniture-and-elec.jpg",
  },
  {
    id: "3",
    name: "TeknikFiks Hamar",
    slug: "teknikfiks",
    category: "reparasjon",
    description: "Lokale eksperter på reparasjon av mobiler, PC-er og elektronikk.",
    longDescription:
      "TeknikFiks er Hamars ledende reparasjonsverksted for elektronikk. De reparerer alt fra knuste mobilskjermer til trege datamaskiner. Med erfarne teknikere og rimelige priser er de førstevalget for ungdom som vil forlenge levetiden på elektronikken sin.",
    address: "Torggata 22, 2317 Hamar",
    lat: 60.792,
    lng: 11.07,
    phone: "+47 62 54 00 00",
    website: "https://teknikfiks.no",
    instagram: "@teknikfiks",
    openingHours: ["Man-Fre: 10:00-18:00", "Lør: 11:00-15:00", "Søn: Stengt"],
    tags: ["mobil", "PC", "nettbrett", "skjermbytte", "batteri"],
    benefits: [
      "Spar tusenvis på reparasjon vs nytt",
      "Reduser e-avfall",
      "Rask service (ofte samme dag)",
      "Garanti på reparasjoner",
    ],
    howToUse: [
      "Ring eller kom innom for pristilbud",
      "Beskriv problemet",
      "Få estimert tid og pris",
      "Hent ferdig reparert enhet",
    ],
    image: "/electronics-repair-shop-with-technician-fixing-sma.jpg",
  },
]

export const quizQuestions: QuizQuestion[] = [
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
    question: "Telefonen din er treg – hva gjør du?",
    options: [
      { text: "Kjøper ny telefon med en gang", points: 0 },
      { text: "Venter til den slutter å fungere", points: 1 },
      { text: "Prøver å fikse selv eller tar den til reparatør", points: 2 },
      { text: "Sjekker om problemet kan løses med oppdatering", points: 2 },
    ],
  },
  {
    id: 3,
    question: "Du trenger noe til helga – hva sjekker du først?",
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
      { text: "Hele tiden – tilbud er tilbud!", points: 0 },
      { text: "Ganske ofte", points: 1 },
      { text: "Sjelden – jeg tenker meg om", points: 2 },
      { text: "Aldri – jeg kjøper bare det jeg trenger", points: 2 },
    ],
  },
  {
    id: 6,
    question: "Hva vet du om e-avfall og gjenvinning?",
    options: [
      { text: "Ikke så mye, ærlig talt", points: 0 },
      { text: "Litt – vet at det bør sorteres", points: 1 },
      { text: "Ganske mye – vet hvor jeg leverer", points: 2 },
      { text: "Masse – prøver å spre kunnskap", points: 2 },
    ],
  },
]

export const challenges: Challenge[] = [
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
    icon: "🗺️",
    category: "brukt",
  },
  {
    id: "repair-1",
    title: "Reparasjonssjekk",
    description: "Sjekk om noe du eier kan repareres",
    points: 10,
    icon: "🔧",
    category: "reparasjon",
  },
  {
    id: "repair-2",
    title: "Fiks det!",
    description: "Få noe reparert i stedet for å kjøpe nytt",
    points: 25,
    icon: "⚡",
    category: "reparasjon",
  },
  {
    id: "recycle-1",
    title: "E-avfall ekspert",
    description: "Lever inn e-avfall på riktig sted",
    points: 15,
    icon: "♻️",
    category: "gjenvinning",
  },
  {
    id: "social-1",
    title: "Sirkulær venn",
    description: "Ta med en venn til bruktbutikk",
    points: 20,
    icon: "👥",
    category: "brukt",
  },
]

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

export const repairData: Record<string, Record<string, RepairEstimate>> = {
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
}

export const facts = [
  {
    title: "E-avfall",
    stat: "50 millioner tonn",
    description: "e-avfall produseres globalt hvert år. Bare 20% blir resirkulert.",
    icon: "📱",
  },
  {
    title: "Klær",
    stat: "92 millioner tonn",
    description: "tekstilavfall havner på søppelfyllinger årlig.",
    icon: "👕",
  },
  {
    title: "Reparasjon",
    stat: "70%",
    description: "av elektronikk kan repareres i stedet for å kastes.",
    icon: "🔧",
  },
  {
    title: "Gjenbruk",
    stat: "95%",
    description: "mindre energi brukes ved gjenbruk vs. ny produksjon av tekstiler.",
    icon: "♻️",
  },
]
