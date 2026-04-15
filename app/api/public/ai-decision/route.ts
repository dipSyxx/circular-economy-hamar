import { NextResponse } from "next/server"
import { z } from "zod"
import { jsonError } from "@/app/api/public/_helpers"
import type { AIDecisionResponse } from "@/lib/ai/decision-assistant-types"
import { extractDecisionAssistantInput } from "@/lib/ai/decision-assistant"
import { evaluateDecisionForContext } from "@/lib/decision-system-server"
import { TRANSPORT_MODES } from "@/lib/decision-system"
import { getActors } from "@/lib/public-data"

const PRIORITIES = ["save_money", "save_time", "save_impact", "balanced"] as const

const requestSchema = z.object({
  message: z.string().trim().min(3),
  budgetNok: z.number().int().min(0).optional(),
  timeDays: z.number().int().min(0).optional(),
  priority: z.enum(PRIORITIES).optional(),
  countySlug: z.string().trim().min(1).optional(),
  municipalitySlug: z.string().trim().min(1).optional(),
  userLat: z.number().min(-90).max(90).optional(),
  userLng: z.number().min(-180).max(180).optional(),
  transportMode: z.enum(TRANSPORT_MODES).optional(),
  maxTravelMinutes: z.number().int().positive().optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return jsonError("Invalid AI decision payload.", 400)
  }

  try {
    const actors = await getActors()
    const { message, budgetNok, timeDays, priority, countySlug, municipalitySlug, userLat, userLng, transportMode, maxTravelMinutes } = parsed.data
    const extraction = await extractDecisionAssistantInput(message, {
      budgetNok,
      timeDays,
      priority,
    })
    const result = await evaluateDecisionForContext(extraction.extractedInput, actors, {
      countySlug,
      municipalitySlug,
      userLat,
      userLng,
      transportMode,
      maxTravelMinutes,
    })

    const response: AIDecisionResponse = {
      advice: extraction.advice,
      assumptions: extraction.assumptions,
      extractedInput: extraction.extractedInput,
      decision: result.decision,
      matchedActors: result.matchedActors,
      fallbackReason: result.fallbackReason,
      warnings: extraction.warnings.length ? extraction.warnings : undefined,
    }

    return NextResponse.json(response)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not generate AI decision.",
      500,
    )
  }
}
