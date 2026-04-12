import "server-only"

import { openai } from "@ai-sdk/openai"
import { generateText, NoObjectGeneratedError, Output } from "ai"
import { z } from "zod"
import type { DecisionInput, Priority } from "@/lib/decision-system"
import { formatItemTypeLabel, formatProblemTypeLabel } from "@/lib/enum-labels"
import { ITEM_TYPES, PROBLEM_TYPES, type ItemType, type ProblemType } from "@/lib/prisma-enums"

const DEFAULT_BUDGET_NOK = 1500
const DEFAULT_TIME_DAYS = 3
const PRIORITIES = ["save_money", "save_time", "save_impact", "balanced"] as const
const AI_DECISION_MODEL = process.env.AI_DECISION_MODEL ?? "gpt-5-mini"

const extractionSchema = z.object({
  itemType: z.enum(ITEM_TYPES),
  problemType: z.enum(PROBLEM_TYPES),
  budgetNok: z.number().int().min(0).nullable(),
  timeDays: z.number().int().min(0).nullable(),
  priority: z.enum(PRIORITIES).nullable(),
  advice: z.string(),
  assumptions: z.array(z.string()),
  warnings: z.array(z.string()),
})

type ExtractionResult = z.infer<typeof extractionSchema>

const itemKeywordMap: Record<ItemType, readonly string[]> = {
  phone: [" telefon ", " mobil ", " iphone ", " android ", " samsung ", " smartphone "],
  laptop: [" laptop ", " pc ", " macbook ", " notebook ", " datamaskin "],
  tablet: [" tablet ", " ipad ", " nettbrett "],
  desktop: [" stasjonar ", " stasjonær ", " desktop ", " tower "],
  smartwatch: [" smartklokke ", " klokke ", " apple watch ", " galaxy watch "],
  tv: [" tv ", " fjernsyn ", " television "],
  monitor: [" monitor ", " skjerm ", " display "],
  printer: [" skriver ", " printer "],
  camera: [" kamera ", " camera "],
  gaming_console: [" playstation ", " xbox ", " nintendo ", " switch ", " spillkonsoll ", " konsoll "],
  audio: [" hodetelefon ", " høretelefon ", " headset ", " hoyttaler ", " høyttaler ", " earbud ", " airpods ", " lyd "],
  small_appliance: [" blender ", " toaster ", " kaffemaskin ", " vannkoker ", " mikser ", " food processor ", " appliance "],
  large_appliance: [" vaskemaskin ", " oppvaskmaskin ", " kjoleskap ", " kjøleskap ", " fryser ", " komfyr ", " stekeovn ", " ovn ", " tørketrommel ", " hvitevare "],
  bicycle: [" sykkel ", " bike ", " bicycle "],
  furniture: [" bord ", " stol ", " sofa ", " hylle ", " skap ", " kommode ", " desk ", " table ", " furniture ", " møbel ", " mobel "],
  clothing: [" jakke ", " bukse ", " jeans ", " kjole ", " skjorte ", " genser ", " tskjorte ", " t-shirt ", " klaer ", " klær ", " clothing ", " garment "],
  footwear: [" sko ", " sneakers ", " sneaker ", " boots ", " støvel ", " stovel ", " joggesko ", " footwear "],
  other: [],
}

const problemKeywordMap: Record<ProblemType, readonly string[]> = {
  screen: [" skjerm ", " display ", " glass ", " cracked screen ", " knust "],
  battery: [" batteri ", " battery ", " lader ut ", " drains fast "],
  slow: [" treg ", " slow ", " henger ", " lagger "],
  no_power: [" starter ikke ", " vil ikke starte ", " no power ", " turn on ", " skrur seg ikke på ", " virker ikke "],
  water: [" vann ", " vannskade ", " wet ", " liquid ", " fukt "],
  overheating: [" varm ", " overheting ", " overoppheting ", " hot "],
  charging_port: [" ladeport ", " charging port ", " lader ikke ", " usb port "],
  speaker: [" hoyttaler ", " høyttaler ", " speaker ", " lyd "],
  microphone: [" mikrofon ", " microphone ", " mic "],
  camera: [" kamera ", " camera lens ", " lens "],
  keyboard: [" tastatur ", " keyboard "],
  trackpad: [" styreflate ", " trackpad ", " touchpad "],
  storage: [" lagring ", " storage ", " minne ", " disk "],
  software: [" programvare ", " software ", " app ", " update ", " oppdatering "],
  connectivity: [" wifi ", " bluetooth ", " tilkobling ", " connection ", " nettverk "],
  broken_part: [" odelegt ", " ødelagt ", " broken ", " lost ", " løs ", " loest ", " loose ", " mangler del ", " broken part "],
  cosmetic: [" ripe ", " riper ", " scratched ", " cosmetic ", " slitasje ", " worn "],
  noise: [" stoy ", " støy ", " noise ", " braker ", " vibrerer "],
  leak: [" lekkasje ", " leak ", " drypper "],
  motor: [" motor ", " compressor ", " kompressor "],
  zipper: [" glidelas ", " glidelås ", " zipper "],
  seam: [" som ", " søm ", " seam ", " stitch "],
  tear: [" hull ", " rift ", " tear ", " ripped "],
  stain: [" flekk ", " stain ", " skitten "],
  sole: [" sale ", " såle ", " sole "],
  chain: [" kjede ", " chain "],
  brake: [" brems ", " brake "],
  tire: [" dekk ", " tire ", " tyre ", " punktering "],
  wheel: [" hjul ", " wheel ", " felg "],
  other: [],
}

const recommendationWarningProblemTypes = new Set<ProblemType>(["battery", "water", "motor", "leak"])

const normalizeText = (value: string) =>
  ` ${value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9æøå]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `

const getKeywordScore = (normalized: string, keywords: readonly string[]) =>
  keywords.reduce((score, keyword) => (normalized.includes(keyword) ? score + 1 : score), 0)

const pickBestItemType = (normalized: string): ItemType => {
  let bestType: ItemType = "other"
  let bestScore = 0

  for (const itemType of ITEM_TYPES) {
    const score = getKeywordScore(normalized, itemKeywordMap[itemType])
    if (score > bestScore) {
      bestType = itemType
      bestScore = score
    }
  }

  return bestType
}

const pickBestProblemType = (normalized: string): ProblemType => {
  let bestType: ProblemType = "other"
  let bestScore = 0

  for (const problemType of PROBLEM_TYPES) {
    const score = getKeywordScore(normalized, problemKeywordMap[problemType])
    if (score > bestScore) {
      bestType = problemType
      bestScore = score
    }
  }

  return bestType
}

const dedupeStrings = (values: string[]) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))

const applyDefaults = (result: ExtractionResult) => {
  const assumptions = [...result.assumptions]

  if (result.budgetNok === null) {
    assumptions.push(`Antok et budsjett på ${DEFAULT_BUDGET_NOK} kr fordi du ikke oppga budsjett.`)
  }

  if (result.timeDays === null) {
    assumptions.push(`Antok at du kan vente ${DEFAULT_TIME_DAYS} dager fordi du ikke oppga tid.`)
  }

  if (result.priority === null) {
    assumptions.push("Antok en balansert vurdering mellom pris, tid og klimaeffekt.")
  }

  return {
    extractedInput: {
      itemType: result.itemType,
      problemType: result.problemType,
      budgetNok: result.budgetNok ?? DEFAULT_BUDGET_NOK,
      timeDays: result.timeDays ?? DEFAULT_TIME_DAYS,
      priority: result.priority ?? undefined,
    } satisfies DecisionInput,
    assumptions: dedupeStrings(assumptions),
  }
}

const buildFallbackAdvice = (input: DecisionInput, warnings: string[]) => {
  const itemLabel = formatItemTypeLabel(input.itemType).toLowerCase()
  const problemLabel = formatProblemTypeLabel(input.problemType).toLowerCase()
  const caution =
    warnings.length > 0
      ? " Hvis dette kan være en sikkerhetsrisiko, bør du bruke profesjonell hjelp før du prøver noe selv."
      : ""

  return `Det høres ut som et problem med ${problemLabel} på ${itemLabel}. Jeg tolket beskrivelsen din til en strukturert vurdering og kobler den nå mot den vanlige beslutningsmotoren, slik at du får et konkret råd og relevante lokale aktører.${caution}`
}

const buildFallbackExtraction = (message: string) => {
  const normalized = normalizeText(message)
  const itemType = pickBestItemType(normalized)
  const problemType = pickBestProblemType(normalized)
  const warnings =
    recommendationWarningProblemTypes.has(problemType)
      ? ["Vær forsiktig: dette kan kreve profesjonell hjelp eller sikker håndtering."]
      : []

  return {
    itemType,
    problemType,
    budgetNok: null,
    timeDays: null,
    priority: null,
    assumptions: [
      "Brukte en lokal best-effort tolkning av teksten fordi AI-svaret ikke var tilgjengelig.",
      itemType === "other"
        ? "Klarte ikke å identifisere en presis varetype og brukte kategorien «Annet»."
        : `Tolket varen som ${formatItemTypeLabel(itemType).toLowerCase()}.`,
      problemType === "other"
        ? "Klarte ikke å identifisere en presis problemtype og brukte «Annet»."
        : `Tolket problemet som ${formatProblemTypeLabel(problemType).toLowerCase()}.`,
    ],
    warnings,
    advice: buildFallbackAdvice(
      {
        itemType,
        problemType,
        budgetNok: DEFAULT_BUDGET_NOK,
        timeDays: DEFAULT_TIME_DAYS,
      },
      warnings,
    ),
  } satisfies ExtractionResult
}

export const extractDecisionAssistantInput = async (message: string) => {
  const trimmedMessage = message.trim()

  if (!trimmedMessage) {
    throw new Error("Message is required.")
  }

  if (!process.env.OPENAI_API_KEY) {
    const fallback = buildFallbackExtraction(trimmedMessage)
    const { extractedInput, assumptions } = applyDefaults(fallback)
    return {
      advice: fallback.advice,
      assumptions,
      warnings: fallback.warnings,
      extractedInput,
    }
  }

  try {
    const result = await generateText({
      model: openai.responses(AI_DECISION_MODEL),
      temperature: 0,
      output: Output.object({
        schema: extractionSchema,
        name: "decision_assistant_extraction",
        description: "Structured extraction and brief advice for a circular-economy decision assistant.",
      }),
      system: `Du er en norsk AI-assistent for en sirkulær beslutningsmotor.

Oppgave:
- Les brukerens fritekst.
- Kartlegg problemet til NØYAKTIG én itemType og én problemType fra schemaet.
- Dette gjelder mange typer ting, ikke bare elektronikk: telefon, møbel, sko, klær, sykkel, hvitevare og annet.
- Hvis teksten ikke er presis nok, velg den nærmeste støttede kategorien eller bruk "other".
- Hvis budsjett, tid eller prioritet ikke er eksplisitt nevnt, returner null for disse feltene.
- Skriv advice på norsk, kort og praktisk, i 2 til 4 setninger.
- Assumptions skal være korte og konkrete.
- Warnings skal bare brukes når problemet kan være sikkerhetskritisk, for eksempel batteri, vannskade, lekkasje eller motor.

Eksempler:
- "bordbenet er løst" -> furniture + broken_part
- "sålen på joggeskoene løsner" -> footwear + sole
- "jakken har ødelagt glidelås" -> clothing + zipper
- "telefonskjermen virker ikke" -> phone + screen`,
      prompt: `Brukerbeskrivelse:\n${trimmedMessage}`,
    })

    const { extractedInput, assumptions } = applyDefaults(result.output)

    return {
      advice: result.output.advice.trim() || buildFallbackAdvice(extractedInput, result.output.warnings),
      assumptions,
      warnings: dedupeStrings(result.output.warnings),
      extractedInput,
    }
  } catch (error) {
    if (!NoObjectGeneratedError.isInstance(error) && !(error instanceof Error)) {
      throw error
    }

    const fallback = buildFallbackExtraction(trimmedMessage)
    const { extractedInput, assumptions } = applyDefaults(fallback)
    const warnings = dedupeStrings([
      ...fallback.warnings,
      "Brukte en reserveanalyse fordi AI-svaret ikke kunne tolkes sikkert.",
    ])

    return {
      advice: fallback.advice,
      assumptions,
      warnings,
      extractedInput,
    }
  }
}

export const getDecisionAssistantDefaults = () => ({
  budgetNok: DEFAULT_BUDGET_NOK,
  timeDays: DEFAULT_TIME_DAYS,
})

export type { Priority }
