import type { GuideDoc, GuideIntent } from "@/lib/data"
import { categoryOrder } from "@/lib/categories"

const pilotCounties = ["innlandet", "oslo", "akershus"] as const

export const guideIntentLabels: Record<GuideIntent, string> = {
  repair: "Reparer",
  "buy-used": "Kjøp brukt",
  donate: "Gi videre",
  recycle: "Gjenvinning",
  rental: "Lån og lei",
  "how-to-find-local-services": "Finn lokale tilbud",
}

export const guideHubCopy = {
  badge: "Praktiske guider",
  title: "Guider for sirkulære valg i hele Norge",
  description:
    "Korte, konkrete guider som hjelper deg å finne riktige neste steg når du vil reparere, kjøpe brukt, gi videre, resirkulere eller låne i stedet for å eie.",
  helper:
    "Start med en guide, gå videre til fylke, kategori eller aktør, og ta et valg som faktisk fungerer der du bor.",
}

export const guideDocs: GuideDoc[] = [
  {
    slug: "reparer-for-du-kjoper-nytt",
    title: "Reparer før du kjøper nytt",
    summary:
      "Bruk denne guiden når noe er ødelagt, men fortsatt kan ha mange år igjen med et smart reparasjonsvalg.",
    seoTitle: "Reparer før du kjøper nytt | Praktisk guide",
    seoDescription:
      "En praktisk guide til når du bør reparere, hva du bør sjekke først, og hvordan du finner lokale reparasjonstjenester i Norge.",
    primaryIntent: "repair",
    relatedCategories: [
      "reparasjon",
      "reparasjon_sko_klar",
      "mobelreparasjon",
      "sykkelverksted",
      "ombruksverksted",
    ],
    relatedCounties: [...pilotCounties],
    bodySections: [
      {
        title: "Start med en rask vurdering",
        body: [
          "Se etter om problemet er begrenset til én del, én søm, ett hjul eller én skjerm. Små feil betyr ofte at reparasjon fortsatt er det beste første steget.",
          "Sammenlign omtrentlig reparasjonskostnad med bruktpris før du bestemmer deg for å kjøpe noe nytt.",
        ],
        checklist: [
          "Ta bilde av skaden før du drar.",
          "Finn modellnavn eller størrelse på varen.",
          "Sjekk om feilen påvirker sikkerhet eller bare komfort.",
        ],
        ctaLinks: [
          { label: "Utforsk reparasjon", href: "/kategori/reparasjon" },
          { label: "Se alle aktører", href: "/aktorer?category=reparasjon" },
        ],
      },
      {
        title: "Når reparasjon ofte lønner seg",
        body: [
          "Elektronikk med byttbare deler, sykler, møbler og klær kan ofte repareres langt billigere enn å erstattes med nytt.",
          "Hvis varen allerede passer behovet ditt, sparer du både tid, penger og klimaavtrykk ved å forlenge levetiden.",
        ],
        checklist: [
          "Velg reparasjon når totalprisen fortsatt er lavere enn et godt bruktalternativ.",
          "Spør om prisintervall og forventet leveringstid.",
          "Be om råd om vedlikehold etter reparasjon.",
        ],
      },
      {
        title: "Finn riktig type verksted",
        body: [
          "Ulike problemer hører hjemme hos ulike typer aktører. Mobil og PC går sjelden til samme sted som sko, klær eller møbler.",
        ],
        ctaLinks: [
          { label: "Mobil og PC", href: "/kategori/reparasjon" },
          { label: "Sko og klær", href: "/kategori/reparasjon_sko_klar" },
          { label: "Møbler", href: "/kategori/mobelreparasjon" },
          { label: "Sykkel", href: "/kategori/sykkelverksted" },
        ],
      },
    ],
  },
  {
    slug: "kjop-brukt-smartere",
    title: "Kjøp brukt smartere",
    summary:
      "En enkel guide til hvordan du finner bedre bruktkjøp, stiller riktige spørsmål og sammenligner lokale alternativer.",
    seoTitle: "Kjøp brukt smartere | Praktisk guide",
    seoDescription:
      "Lær hvordan du vurderer kvalitet, pris og behov når du vil kjøpe brukt i Norge.",
    primaryIntent: "buy-used",
    relatedCategories: ["brukt"],
    relatedCounties: [...pilotCounties],
    bodySections: [
      {
        title: "Bestem deg før du går ut",
        body: [
          "Bruktkjøp blir bedre når du vet hva du faktisk trenger. Start med størrelse, kvalitet og maksimalpris i stedet for å lete tilfeldig.",
        ],
        checklist: [
          "Skriv ned hva du trenger, ikke bare hva som er fristende.",
          "Sett en makspris før du begynner.",
          "Sjekk mål, modell eller størrelse på forhånd.",
        ],
        ctaLinks: [
          { label: "Utforsk bruktaktører", href: "/kategori/brukt" },
          { label: "Finn fylker og kommuner", href: "/fylker" },
        ],
      },
      {
        title: "Se etter kvalitetstegn",
        body: [
          "Sjekk slitasje, funksjon, lukt, glidelåser, sømmer, batteri og manglende deler. Be gjerne om å teste varen før du bestemmer deg.",
          "Brukt er smartest når varen fortsatt kan brukes lenge uten store tilleggskostnader.",
        ],
        checklist: [
          "Test funksjon hvis mulig.",
          "Se etter skjulte kostnader som batteribytte eller reservedeler.",
          "Sammenlign med nypris og god bruktpris, ikke bare tilbudspris.",
        ],
      },
      {
        title: "Kombiner brukt med lokal service",
        body: [
          "Noen ganger er det beste kjøpet en brukt vare som trenger en liten justering eller enkel reparasjon etterpå.",
        ],
        ctaLinks: [
          { label: "Se reparasjonsguider", href: "/guider/reparer-for-du-kjoper-nytt" },
          { label: "Gå til alle aktører", href: "/aktorer" },
        ],
      },
    ],
  },
  {
    slug: "slik-gir-du-videre",
    title: "Slik gir du videre ting du ikke bruker",
    summary:
      "Når du vil rydde hjemme uten å skape mer avfall, hjelper denne guiden deg å velge riktig ombruksløp.",
    seoTitle: "Slik gir du videre ting du ikke bruker | Praktisk guide",
    seoDescription:
      "En praktisk guide til hva som bør gis videre, hva som bør leveres til ombruk, og hvordan du finner riktige mottak.",
    primaryIntent: "donate",
    relatedCategories: ["mottak_ombruk", "brukt"],
    relatedCounties: [...pilotCounties],
    bodySections: [
      {
        title: "Sorter før du leverer",
        body: [
          "Det som er helt, rent og brukbart bør gå til ombruk først. Det som er ødelagt eller ufullstendig bør ikke leveres som en gave til noen andre.",
        ],
        checklist: [
          "Vask klær og tekstiler.",
          "Sett sammen løse deler og kabler.",
          "Fjern personlige data fra elektronikk.",
        ],
        ctaLinks: [
          { label: "Mottak for ombruk", href: "/kategori/mottak_ombruk" },
          { label: "Brukt og ombruk", href: "/kategori/brukt" },
        ],
      },
      {
        title: "Velg riktig kanal",
        body: [
          "Noe passer best til gjenbrukssenter eller mottak for ombruk, mens annet fungerer fint i bruktbutikk eller via lokale utlåns- og delingsmiljøer.",
          "Når du velger riktig kanal første gang, øker sjansen for at tingene faktisk blir brukt videre.",
        ],
        checklist: [
          "Lever praktiske hverdagsvarer til steder som faktisk tar imot dem.",
          "Spør om åpningstider og hva som ikke tas imot.",
          "Bruk lokale aktører først når du vil at ting skal komme raskt i omløp igjen.",
        ],
      },
      {
        title: "Når du heller bør resirkulere",
        body: [
          "Hvis varen er ødelagt, uhygienisk eller mangler viktige deler, er gjenvinning ofte riktigere enn å sende problemet videre.",
        ],
        ctaLinks: [
          { label: "Se gjenvinningsguide", href: "/guider/slik-sorterer-du-til-gjenvinning" },
        ],
      },
    ],
  },
  {
    slug: "slik-sorterer-du-til-gjenvinning",
    title: "Slik sorterer du til gjenvinning",
    summary:
      "Bruk denne guiden når en ting ikke lenger kan brukes, men fortsatt må håndteres riktig for å unngå unødvendig avfall.",
    seoTitle: "Slik sorterer du til gjenvinning | Praktisk guide",
    seoDescription:
      "En praktisk guide til hva som skal til gjenvinning, hva som bør gå til ombruk først, og hvordan du finner riktige gjenvinningssteder.",
    primaryIntent: "recycle",
    relatedCategories: ["gjenvinning"],
    relatedCounties: [...pilotCounties],
    bodySections: [
      {
        title: "Ombruk først, gjenvinning etterpå",
        body: [
          "Start alltid med spørsmålet om tingen kan repareres, brukes videre eller leveres til ombruk. Gjenvinning er riktig når varen er utslitt eller uegnet for videre bruk.",
        ],
        checklist: [
          "Sjekk om varen er trygg og komplett.",
          "Vurder om en enkel reparasjon kan gi nytt liv.",
          "Velg ombruk før avfall når det er realistisk.",
        ],
      },
      {
        title: "Forbered det du leverer",
        body: [
          "Riktig sortering går raskere når du har ryddet, tømt og skilt ut det viktigste på forhånd.",
        ],
        checklist: [
          "Tøm beholdere og poser.",
          "Fjern batterier og persondata fra elektronikk.",
          "Sortér materialer hvis det gjør levering enklere.",
        ],
        ctaLinks: [
          { label: "Finn gjenvinningsaktører", href: "/kategori/gjenvinning" },
          { label: "Se alle fylker", href: "/fylker" },
        ],
      },
      {
        title: "Velg et sted som passer reisen din",
        body: [
          "Et nært sted med riktige fraksjoner er ofte bedre enn å utsette leveringen. Bruk katalogen til å finne lokale alternativer som faktisk matcher det du skal kvitte deg med.",
        ],
        ctaLinks: [
          { label: "Gå til kartet", href: "/kart" },
          { label: "Utforsk aktører", href: "/aktorer?category=gjenvinning" },
        ],
      },
    ],
  },
  {
    slug: "lan-og-lei-i-stedet-for-a-eie",
    title: "Lån og lei i stedet for å eie",
    summary:
      "Denne guiden hjelper deg å velge utlån og leie når behovet er kortvarig eller bruken er sjelden.",
    seoTitle: "Lån og lei i stedet for å eie | Praktisk guide",
    seoDescription:
      "En praktisk guide til når utlån og leie er smartere enn å eie, og hvordan du finner lokale tilbud.",
    primaryIntent: "rental",
    relatedCategories: ["utleie"],
    relatedCounties: [...pilotCounties],
    bodySections: [
      {
        title: "Tenk brukstid først",
        body: [
          "Hvis du bare trenger noe et par ganger i året, er lån eller leie ofte bedre enn kjøp. Dette gjelder særlig verktøy, sportsutstyr og sesongvarer.",
        ],
        checklist: [
          "Hvor ofte trenger du tingen i løpet av et år?",
          "Hvor mye plass tar den hjemme?",
          "Er vedlikehold og lagring mer styr enn nytte?",
        ],
        ctaLinks: [
          { label: "Utforsk utleie", href: "/kategori/utleie" },
          { label: "Finn lokale tilbud", href: "/guider/slik-finner-du-lokale-sirkulaere-tilbud" },
        ],
      },
      {
        title: "Sammenlign total kostnad",
        body: [
          "Leie og utlån er smartest når totalprisen over tid blir lavere enn kjøp, og når du slipper vedlikehold på kjøpet.",
        ],
        checklist: [
          "Sammenlign leiepris med nypris og bruktpris.",
          "Sjekk depositum, leveringstid og returregler.",
          "Velg lokale steder for kortere reise og enklere logistikk.",
        ],
      },
      {
        title: "Bruk deling som standard for sjeldne behov",
        body: [
          "Jo sjeldnere behovet er, desto bedre fungerer utlån og leie som standardvalg.",
        ],
      },
    ],
  },
  {
    slug: "slik-finner-du-lokale-sirkulaere-tilbud",
    title: "Slik finner du lokale sirkulære tilbud",
    summary:
      "En guide til hvordan du går fra behov til lokal aktør ved å bruke fylker, kategorier, kart og søk smartere.",
    seoTitle: "Slik finner du lokale sirkulære tilbud | Praktisk guide",
    seoDescription:
      "Lær hvordan du finner lokale sirkulære tilbud i Norge ved å bruke fylker, kommuner, kategorier og kart i riktig rekkefølge.",
    primaryIntent: "how-to-find-local-services",
    relatedCategories: [...categoryOrder],
    relatedCounties: [...pilotCounties],
    bodySections: [
      {
        title: "Velg riktig inngang",
        body: [
          "Start med fylke hvis du vil browse lokalt, med kategori hvis du vet hva du trenger, og med kart hvis nærhet er viktigst.",
          "Når du er usikker på løsning, bruk først guide eller beslutningsmotor og gå derfra til aktør.",
        ],
        checklist: [
          "Fylke først for lokalt browse.",
          "Kategori først når behovet er klart.",
          "Kart først når reiseavstand betyr mest.",
        ],
        ctaLinks: [
          { label: "Utforsk fylker", href: "/fylker" },
          { label: "Se alle kategorier", href: "/aktorer" },
          { label: "Åpne kartet", href: "/kart" },
        ],
      },
      {
        title: "Bruk kommune og kategori sammen",
        body: [
          "De beste treffene kommer ofte når du kombinerer kommune med kategori. Da får du lokale base-aktører først, deretter eksplisitte serviceområder og landsdekkende alternativer.",
        ],
        checklist: [
          "Velg fylke før kommune.",
          "Filtrer på kategori før du vurderer enkeltaktører.",
          "Se etter redaksjonell tillit og fersk verifisering.",
        ],
      },
      {
        title: "Bruk guide, aktørside og kart sammen",
        body: [
          "Guiden hjelper deg å velge retning. Aktørsiden gir konkrete detaljer. Kartet hjelper deg å vurdere reisen.",
        ],
        ctaLinks: [
          { label: "Gå til aktører", href: "/aktorer" },
          { label: "Prøv beslutningsmotoren", href: "/decide" },
        ],
      },
    ],
  },
]
