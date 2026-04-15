import "server-only"

import { openai } from "@ai-sdk/openai"
import { generateText, NoObjectGeneratedError, Output } from "ai"
import { z } from "zod"
import type { DecisionCaseKey, DecisionInput, Priority } from "@/lib/decision-system"
import { getDecisionAssistantDefaults } from "@/lib/ai/decision-assistant-defaults"
import { formatItemTypeLabel, formatProblemTypeLabel } from "@/lib/enum-labels"
import { ITEM_TYPES, PROBLEM_TYPES, type ItemType, type ProblemType } from "@/lib/prisma-enums"

const { budgetNok: DEFAULT_BUDGET_NOK, timeDays: DEFAULT_TIME_DAYS } = getDecisionAssistantDefaults()
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
type ExtractionOverrides = Partial<Pick<DecisionInput, "budgetNok" | "timeDays" | "priority">>

const itemKeywordMap: Record<ItemType, readonly string[]> = {
  phone: [" telefon ", " mobil ", " iphone ", " pixel ", " samsung ", " smartphone ", " android ", " oneplus ", " xiaomi "],
  laptop: [" laptop ", " pc ", " macbook ", " notebook ", " datamaskin "],
  tablet: [" tablet ", " ipad ", " nettbrett "],
  desktop: [" stasjonaer ", " desktop ", " tower ", " gaming pc "],
  smartwatch: [" smartklokke ", " klokke ", " apple watch ", " galaxy watch "],
  tv: [" tv ", " fjernsyn ", " television "],
  monitor: [" monitor ", " skjerm ", " display ", " pc skjerm "],
  printer: [" skriver ", " printer "],
  camera: [" kamera ", " camera ", " objektiv "],
  gaming_console: [" playstation ", " xbox ", " nintendo ", " switch ", " spillkonsoll ", " konsoll "],
  audio: [" hodetelefon ", " horetelefon ", " headset ", " hoyttaler ", " earbud ", " airpods ", " lyd "],
  small_appliance: [" blender ", " toaster ", " kaffemaskin ", " vannkoker ", " mikser ", " food processor ", " airfryer "],
  large_appliance: [" vaskemaskin ", " oppvaskmaskin ", " kjoleskap ", " fryser ", " komfyr ", " stekeovn ", " ovn ", " torketrommel ", " hvitevare "],
  bicycle: [" sykkel ", " bike ", " bicycle "],
  furniture: [" bord ", " stol ", " sofa ", " hylle ", " skap ", " kommode ", " desk ", " table ", " furniture ", " mobel "],
  clothing: [" jakke ", " bukse ", " jeans ", " kjole ", " skjorte ", " genser ", " tskjorte ", " t shirt ", " klaer ", " clothing ", " garment "],
  footwear: [" sko ", " sneakers ", " sneaker ", " boots ", " stovel ", " joggesko ", " footwear "],
  other: [],
}

const problemKeywordMap: Record<ProblemType, readonly string[]> = {
  screen: [" skjerm ", " display ", " glass ", " cracked screen ", " knust ", " skjermbeskytter ", " beskyttelsesglass ", " screen protector ", " tempered glass ", " herdet glass "],
  battery: [" batteri ", " battery ", " lader ut ", " drains fast "],
  slow: [" treg ", " slow ", " henger ", " lagger "],
  no_power: [" starter ikke ", " vil ikke starte ", " no power ", " turn on ", " skrur seg ikke pa ", " virker ikke "],
  water: [" vann ", " vannskade ", " wet ", " liquid ", " fukt "],
  overheating: [" varm ", " overheting ", " overoppheting ", " hot "],
  charging_port: [" ladeport ", " charging port ", " lader ikke ", " usb port "],
  speaker: [" hoyttaler ", " speaker ", " lyd "],
  microphone: [" mikrofon ", " microphone ", " mic "],
  camera: [" kamera ", " camera lens ", " lens "],
  keyboard: [" tastatur ", " keyboard "],
  trackpad: [" styreflate ", " trackpad ", " touchpad "],
  storage: [" lagring ", " storage ", " minne ", " disk "],
  software: [" programvare ", " software ", " app ", " update ", " oppdatering "],
  connectivity: [" wifi ", " bluetooth ", " tilkobling ", " connection ", " nettverk "],
  broken_part: [" odelegt ", " odelagt ", " broken ", " lost ", " los ", " loose ", " mangler del ", " broken part ", " vingler "],
  cosmetic: [" ripe ", " riper ", " scratched ", " cosmetic ", " slitasje ", " worn "],
  noise: [" stoy ", " noise ", " braker ", " vibrerer "],
  leak: [" lekkasje ", " leak ", " drypper "],
  motor: [" motor ", " compressor ", " kompressor "],
  zipper: [" glidelas ", " zipper "],
  seam: [" som ", " seam ", " stitch "],
  tear: [" hull ", " rift ", " tear ", " ripped "],
  stain: [" flekk ", " stain ", " skitten "],
  sole: [" sale ", " sole "],
  chain: [" kjede ", " chain "],
  brake: [" brems ", " brake "],
  tire: [" dekk ", " tire ", " tyre ", " punktering "],
  wheel: [" hjul ", " wheel ", " felg "],
  other: [],
}

const caseKeywordMap: Record<DecisionCaseKey, readonly string[]> = {
  screen_protector: [
    "skjermbeskytter",
    "beskyttelsesglass",
    "screen protector",
    "tempered glass",
    "herdet glass",
    "panzerglass",
    "protective glass",
  ],
}

const recommendationWarningProblemTypes = new Set<ProblemType>(["battery", "water", "motor", "leak"])

const normalizeText = (value: string) =>
  ` ${value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/g, "ae")
    .replace(/[øö]/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, " ")
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

const applyDefaults = (result: ExtractionResult, overrides: ExtractionOverrides = {}) => {
  const assumptions = [...result.assumptions]
  const hasBudgetOverride = typeof overrides.budgetNok === "number"
  const hasTimeOverride = typeof overrides.timeDays === "number"
  const hasPriorityOverride = overrides.priority !== undefined
  const nextBudgetNok: number = overrides.budgetNok ?? result.budgetNok ?? DEFAULT_BUDGET_NOK
  const nextTimeDays: number = overrides.timeDays ?? result.timeDays ?? DEFAULT_TIME_DAYS
  const nextPriority: Priority | undefined = overrides.priority ?? result.priority ?? undefined

  if (!hasBudgetOverride && result.budgetNok === null) {
    assumptions.push(`Antok et budsjett pa ${DEFAULT_BUDGET_NOK} kr fordi du ikke oppga budsjett.`)
  }

  if (!hasTimeOverride && result.timeDays === null) {
    assumptions.push(`Antok at du kan vente ${DEFAULT_TIME_DAYS} dager fordi du ikke oppga tid.`)
  }

  if (!hasPriorityOverride && result.priority === null) {
    assumptions.push("Antok en balansert vurdering mellom pris, tid og klimaeffekt.")
  }

  return {
    extractedInput: {
      itemType: result.itemType,
      problemType: result.problemType,
      budgetNok: nextBudgetNok,
      timeDays: nextTimeDays,
      priority: nextPriority,
    } satisfies DecisionInput,
    assumptions: dedupeStrings(assumptions),
  }
}

const detectDecisionCaseKey = (
  normalizedMessage: string,
  extractedInput: Pick<DecisionInput, "itemType" | "problemType">,
): DecisionCaseKey | undefined => {
  const matchesCase = (caseKey: DecisionCaseKey) =>
    caseKeywordMap[caseKey].some((keyword) => normalizedMessage.includes(keyword))

  if (
    extractedInput.problemType === "screen" &&
    (extractedInput.itemType === "phone" || extractedInput.itemType === "tablet" || extractedInput.itemType === "smartwatch") &&
    matchesCase("screen_protector")
  ) {
    return "screen_protector"
  }

  return undefined
}

const applyCaseHeuristics = (
  message: string,
  extractedInput: DecisionInput,
  assumptions: string[],
) => {
  const normalizedMessage = normalizeText(message)
  const caseKey = detectDecisionCaseKey(normalizedMessage, extractedInput)
  const nextAssumptions = [...assumptions]

  if (caseKey === "screen_protector") {
    nextAssumptions.push("Tolket dette som skjermbeskytter eller beskyttelsesglass, ikke selve skjermpanelet.")
  }

  return {
    extractedInput: caseKey ? { ...extractedInput, caseKey } : extractedInput,
    assumptions: dedupeStrings(nextAssumptions),
  }
}

const buildFallbackAdvice = (input: DecisionInput, warnings: string[]) => {
  if (input.caseKey === "screen_protector") {
    return "Det hortes ut som at skjermbeskytteren er knust, ikke nodvendigvis selve displayet. Fjern lose glassbiter forsiktig, sett pa et nytt herdet glass, og bruk verksted bare hvis bildet eller beroringen ogsa er skadet."
  }

  const itemLabel = formatItemTypeLabel(input.itemType).toLowerCase()
  const problemLabel = formatProblemTypeLabel(input.problemType).toLowerCase()
  const caution =
    warnings.length > 0
      ? " Hvis dette kan vaere en sikkerhetsrisiko, bor du bruke profesjonell hjelp for du prover noe selv."
      : ""

  return `Det hores ut som et problem med ${problemLabel} pa ${itemLabel}. Jeg tolket beskrivelsen din til en strukturert vurdering og kobler den na mot beslutningsmotoren, slik at du far et konkret rad og relevante lokale aktorer.${caution}`
}

const buildFallbackExtraction = (message: string) => {
  const normalized = normalizeText(message)
  const itemType = pickBestItemType(normalized)
  const problemType = pickBestProblemType(normalized)
  const warnings =
    recommendationWarningProblemTypes.has(problemType)
      ? ["Vaer forsiktig: dette kan kreve profesjonell hjelp eller sikker handtering."]
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
        ? 'Klarte ikke a identifisere en presis varetype og brukte kategorien "Annet".'
        : `Tolket varen som ${formatItemTypeLabel(itemType).toLowerCase()}.`,
      problemType === "other"
        ? 'Klarte ikke a identifisere en presis problemtype og brukte "Annet".'
        : `Tolket problemet som ${formatProblemTypeLabel(problemType).toLowerCase()}.`,
    ],
    warnings,
    advice: "",
  } satisfies ExtractionResult
}

export const extractDecisionAssistantInput = async (message: string, overrides: ExtractionOverrides = {}) => {
  const trimmedMessage = message.trim()

  if (!trimmedMessage) {
    throw new Error("Message is required.")
  }

  if (!process.env.OPENAI_API_KEY) {
    const fallback = buildFallbackExtraction(trimmedMessage)
    const { extractedInput, assumptions } = applyDefaults(fallback, overrides)
    const withCaseHeuristics = applyCaseHeuristics(trimmedMessage, extractedInput, assumptions)

    return {
      advice: buildFallbackAdvice(withCaseHeuristics.extractedInput, fallback.warnings),
      assumptions: withCaseHeuristics.assumptions,
      warnings: fallback.warnings,
      extractedInput: withCaseHeuristics.extractedInput,
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
      system: `Du er en norsk AI-assistent for en sirkulaer beslutningsmotor.

Oppgave:
- Les brukerens fritekst.
- Kartlegg problemet til noyaktig en itemType og en problemType fra schemaet.
- Dette gjelder mange typer ting, ikke bare elektronikk: telefon, mobel, sko, klaer, sykkel, hvitevare og annet.
- Hvis teksten ikke er presis nok, velg den naermeste stottede kategorien eller bruk "other".
- Hvis budsjett, tid eller prioritet ikke er eksplisitt nevnt, returner null for disse feltene.
- Skriv advice pa norsk, kort og praktisk, i 2 til 4 setninger.
- Assumptions skal vaere korte og konkrete.
- Warnings skal bare brukes nar problemet kan vaere sikkerhetskritisk, for eksempel batteri, vannskade, lekkasje eller motor.
- Hvis brukeren beskriver skjermbeskytter eller beskyttelsesglass, skal du fortsatt mappe til screen, men forklare i assumptions at dette gjelder beskytteren og ikke nodvendigvis selve displaypanelet.

Eksempler:
- "bordbenet er lost" -> furniture + broken_part
- "salen pa joggeskoene losner" -> footwear + sole
- "jakken har odelagt glidelas" -> clothing + zipper
- "telefonskjermen virker ikke" -> phone + screen
- "beskyttelsesglasset pa Pixel 8 Pro knuste" -> phone + screen`,
      prompt: `Brukerbeskrivelse:\n${trimmedMessage}`,
    })

    const { extractedInput, assumptions } = applyDefaults(result.output, overrides)
    const withCaseHeuristics = applyCaseHeuristics(trimmedMessage, extractedInput, assumptions)

    return {
      advice:
        result.output.advice.trim() || buildFallbackAdvice(withCaseHeuristics.extractedInput, result.output.warnings),
      assumptions: withCaseHeuristics.assumptions,
      warnings: dedupeStrings(result.output.warnings),
      extractedInput: withCaseHeuristics.extractedInput,
    }
  } catch (error) {
    if (!NoObjectGeneratedError.isInstance(error) && !(error instanceof Error)) {
      throw error
    }

    const fallback = buildFallbackExtraction(trimmedMessage)
    const { extractedInput, assumptions } = applyDefaults(fallback, overrides)
    const withCaseHeuristics = applyCaseHeuristics(trimmedMessage, extractedInput, assumptions)
    const warnings = dedupeStrings([
      ...fallback.warnings,
      "Brukte en reserveanalyse fordi AI-svaret ikke kunne tolkes sikkert.",
    ])

    return {
      advice: buildFallbackAdvice(withCaseHeuristics.extractedInput, warnings),
      assumptions: withCaseHeuristics.assumptions,
      warnings,
      extractedInput: withCaseHeuristics.extractedInput,
    }
  }
}

export type { Priority }
