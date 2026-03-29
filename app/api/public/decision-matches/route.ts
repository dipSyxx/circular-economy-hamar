import { NextResponse } from "next/server"
import { z } from "zod"
import { jsonError } from "@/app/api/public/_helpers"
import { evaluateDecisionMatches } from "@/lib/decision-matching"
import { TRANSPORT_MODES } from "@/lib/decision-match-types"
import { ITEM_TYPES, PROBLEM_TYPES } from "@/lib/prisma-enums"
import { getActors } from "@/lib/public-data"

const PRIORITIES = ["save_money", "save_time", "save_impact", "balanced"] as const

const requestSchema = z.object({
  itemType: z.enum(ITEM_TYPES),
  problemType: z.enum(PROBLEM_TYPES),
  budgetNok: z.number().min(0),
  timeDays: z.number().min(0),
  priority: z.enum(PRIORITIES).optional(),
  modelRepairabilityScore: z.number().min(0).max(10).optional(),
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
    return jsonError("Invalid decision match payload.", 400)
  }

  try {
    const actors = await getActors()
    const {
      countySlug,
      municipalitySlug,
      userLat,
      userLng,
      transportMode,
      maxTravelMinutes,
      ...decisionInput
    } = parsed.data

    const result = await evaluateDecisionMatches(decisionInput, actors, {
      countySlug,
      municipalitySlug,
      userLat,
      userLng,
      transportMode,
      maxTravelMinutes,
    })

    return NextResponse.json(result)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Could not compute decision matches.",
      500,
    )
  }
}
