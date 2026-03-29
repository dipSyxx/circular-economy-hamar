import type { ArticleDoc, EditorialTheme } from "@/lib/data"

export const editorialThemeLabels: Record<EditorialTheme, string> = {
  "local-discovery": "Lokale grep",
  "repair-economy": "Reparasjon og økonomi",
  "trust-and-quality": "Tillit og datakvalitet",
  "circular-systems": "Sirkulære systemer",
}

export const editorialHubCopy = {
  badge: "Redaksjonelle artikler",
  title: "Analyse, forklaringer og lokale mønstre bak sirkulære valg",
  description:
    "Les korte artikler som kobler guides, fylker, kategorier og aktører sammen. Målet er ikke nyhetsstøy, men bedre forståelse av hva som faktisk fungerer lokalt.",
  helper:
    "Start med en artikkel når du vil forstå hvorfor et valg er smart, og gå videre til guide, fylke eller aktør når du er klar til å handle.",
}

export const articleDocs: ArticleDoc[] = [
  {
    slug: "slik-bruker-du-katalogen-som-lokal-guide",
    title: "Slik bruker du katalogen som lokal guide",
    summary:
      "En redaksjonell gjennomgang av hvordan fylke, kommune, kategori og aktør henger sammen når du vil finne et lokalt sirkulært tilbud raskt.",
    seoTitle: "Slik bruker du katalogen som lokal guide | Sirkulær Norge",
    seoDescription:
      "Forstå hvordan du går fra behov til fylke, kommune, kategori og aktør i Sirkulær Norge.",
    publishedAt: "2026-03-29",
    readingMinutes: 4,
    theme: "local-discovery",
    relatedCategories: ["brukt", "utleie", "mottak_ombruk", "gjenvinning"],
    relatedCounties: ["innlandet", "oslo", "akershus", "vestland"],
    bodySections: [
      {
        title: "Begynn med geografi når behovet er lokalt",
        body: [
          "Når du trenger et sted du faktisk kan besøke i løpet av kort tid, er fylke og kommune ofte bedre startpunkt enn et bredt søk.",
          "Det gjør det enklere å se hvilke kategorier som faktisk finnes der du bor, og hvilke hull katalogen fortsatt har.",
        ],
        checklist: [
          "Velg fylke først hvis du vil ha bred dekning.",
          "Gå til kommune når du vil korte ned avstand og reisetid.",
          "Bruk kategori når du vet hva slags løsning du ser etter.",
        ],
        ctaLinks: [
          { label: "Utforsk fylker", href: "/fylker" },
          { label: "Se hele katalogen", href: "/aktorer" },
        ],
      },
      {
        title: "Bruk guide og aktørside sammen",
        body: [
          "Guidene forklarer hvordan du vurderer et valg. Aktørsidene gir deg åpningstider, kilder og kontaktdata.",
          "Sammen gjør de det enklere å gå fra et uklart behov til et konkret neste steg uten å hoppe mellom mange ulike nettsteder.",
        ],
        ctaLinks: [{ label: "Les guider", href: "/guider" }],
      },
    ],
  },
  {
    slug: "nar-lonner-det-seg-a-reparere-lokalt",
    title: "Når lønner det seg å reparere lokalt?",
    summary:
      "Reparasjon handler ikke bare om pris. Denne artikkelen forklarer når lokale verksteder faktisk slår både nyttkjøp og bruktkjøp på tid, klima og total nytte.",
    seoTitle: "Når lønner det seg å reparere lokalt? | Sirkulær Norge",
    seoDescription:
      "Forstå når reparasjon er smartest, og hvordan du vurderer tid, pris og lokal tilgjengelighet.",
    publishedAt: "2026-03-29",
    readingMinutes: 5,
    theme: "repair-economy",
    relatedCategories: ["reparasjon", "reparasjon_sko_klar", "mobelreparasjon", "sykkelverksted", "ombruksverksted"],
    relatedCounties: ["oslo", "akershus", "innlandet", "rogaland"],
    bodySections: [
      {
        title: "Reparasjon vinner når delen er kjent og verkstedet er nært",
        body: [
          "Mange reparasjoner blir dyre først når diagnose, transport eller reservedeler er usikre. Når verkstedet kjenner problemet og ligger i rimelig nærhet, er regnestykket ofte bedre enn folk tror.",
          "Det gjelder særlig telefon, laptop, sykkel og mindre tekstil- eller skoreparasjoner.",
        ],
        checklist: [
          "Sjekk om problemet er vanlig og lett å beskrive.",
          "Sammenlign reparasjon mot brukt før du vurderer nytt.",
          "Velg lokale verksteder når rask levering betyr mye.",
        ],
        ctaLinks: [
          { label: "Prøv beslutningsmotoren", href: "/decide" },
          { label: "Finn reparasjon", href: "/kategori/reparasjon" },
        ],
      },
      {
        title: "Tiden din er en del av kostnaden",
        body: [
          "Et verksted som ligger nær og har tydelige priser kan være mer verdifullt enn et billigere alternativ som krever ekstra koordinering eller lang ventetid.",
          "Derfor gir lokal matching og reiseestimat mer mening enn en ren prisliste alene.",
        ],
      },
    ],
  },
  {
    slug: "hva-gjor-et-ombrukstilbud-tillitsverdig",
    title: "Hva gjør et ombrukstilbud tillitsverdig?",
    summary:
      "Ikke alle katalogoppføringer er like sterke. Denne artikkelen forklarer hvorfor kilder, friskhet og verifisering betyr noe når du skal stole på et lokalt tilbud.",
    seoTitle: "Hva gjør et ombrukstilbud tillitsverdig? | Sirkulær Norge",
    seoDescription:
      "Lær hvordan kilder, verifisering og datakvalitet påvirker hvor trygg en aktøroppføring er.",
    publishedAt: "2026-03-29",
    readingMinutes: 4,
    theme: "trust-and-quality",
    relatedCategories: ["brukt", "mottak_ombruk", "gjenvinning", "utleie"],
    relatedCounties: ["innlandet", "oslo", "akershus"],
    bodySections: [
      {
        title: "Kvalitet er mer enn bare en lenke",
        body: [
          "To like URL-er fra samme domene gir ikke nødvendigvis bedre trygghet. Vi ser etter variasjon i kilder, styrke i kildetypen og hvor nylig posten er gjennomgått.",
          "Det gjør det lettere å skille mellom oppføringer som bare eksisterer, og oppføringer som fortsatt er operative og nyttige.",
        ],
        checklist: [
          "Se etter flere kilder, ikke bare én lenke.",
          "Prioriter aktører med redaksjonell verifisering.",
          "Vær ekstra oppmerksom på oppføringer som trenger ny verifisering.",
        ],
        ctaLinks: [{ label: "Utforsk aktører", href: "/aktorer" }],
      },
      {
        title: "Korreksjoner er en del av produktet",
        body: [
          "Et godt katalogprodukt må tåle at åpningstider, adresser og kontaktdata endrer seg. Derfor er forslag til korrigering og re-verifisering en viktig del av driften.",
        ],
      },
    ],
  },
  {
    slug: "slik-henger-ombruk-gjenvinning-og-utleie-sammen",
    title: "Slik henger ombruk, gjenvinning og utleie sammen",
    summary:
      "Et sterkt sirkulært tilbud handler om mer enn bruktbutikk alene. Her ser vi på hvordan flere kategorier må spille sammen for at et fylke skal fungere godt.",
    seoTitle: "Slik henger ombruk, gjenvinning og utleie sammen | Sirkulær Norge",
    seoDescription:
      "Forstå hvorfor reuse, repair, recycling og access/redistribution må henge sammen i et fylke.",
    publishedAt: "2026-03-29",
    readingMinutes: 5,
    theme: "circular-systems",
    relatedCategories: ["brukt", "gjenvinning", "utleie", "mottak_ombruk", "reparasjon"],
    relatedCounties: ["innlandet", "oslo", "akershus", "vestfold"],
    bodySections: [
      {
        title: "Ett godt fylke trenger flere typer tilbud",
        body: [
          "Brukt alene er ikke nok. Hvis et fylke mangler reparasjon eller mottak for ombruk, brytes flyten mellom å beholde, gi videre og til slutt gjenvinne riktig.",
          "Det er derfor rollout-boardet vurderer fylker etter service clusters og ikke bare etter hvor mange aktører som finnes totalt.",
        ],
        checklist: [
          "Reuse: steder å kjøpe brukt.",
          "Repair: steder som kan forlenge levetiden.",
          "Recycling: steder som håndterer reststrømmen riktig.",
          "Access/redistribution: utlån, leie eller mottak for ombruk.",
        ],
        ctaLinks: [
          { label: "Se pilotfylker", href: "/fylker" },
          { label: "Les lokal guide", href: "/guider/slik-finner-du-lokale-sirkulaere-tilbud" },
        ],
      },
      {
        title: "Det er her lokal prioritering blir viktig",
        body: [
          "Når et fylke mangler én av klyngene, er det et tydelig signal til import, verifisering og videre katalogarbeid. Det gir en mer ærlig rollout enn å late som om landet er jevnt dekket.",
        ],
      },
    ],
  },
]
