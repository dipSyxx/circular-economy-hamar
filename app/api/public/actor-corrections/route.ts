import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPublicUser, jsonError } from "@/app/api/public/_helpers"
import {
  hasCorrectionPayloadValues,
  sanitizeActorCorrectionPayload,
  type ActorCorrectionPayload,
} from "@/lib/actor-corrections"

type CorrectionRequestBody = {
  actorId?: unknown
  note?: unknown
  sourceUrl?: unknown
  payload?: unknown
}

const normalizeSourceUrl = (value: unknown) => {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    return new URL(trimmed).toString()
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const { user, error } = await getPublicUser(true)
  if (error) return error
  if (!user) return jsonError("Unauthorized", 401)

  const body = (await request.json()) as CorrectionRequestBody
  const actorId = typeof body.actorId === "string" ? body.actorId.trim() : ""
  const note = typeof body.note === "string" ? body.note.trim() : ""
  const payload = sanitizeActorCorrectionPayload((body.payload as ActorCorrectionPayload | undefined) ?? {})
  const sourceUrl = normalizeSourceUrl(body.sourceUrl)

  if (!actorId) {
    return jsonError("actorId er pakrevd.", 400)
  }

  const actor = await prisma.actor.findUnique({
    where: { id: actorId },
    select: { id: true },
  })
  if (!actor) {
    return jsonError("Aktoren ble ikke funnet.", 404)
  }

  if (!note && !hasCorrectionPayloadValues(payload) && !sourceUrl) {
    return jsonError("Legg til en beskrivelse eller minst ett felt som skal korrigeres.", 400)
  }

  if (body.sourceUrl && !sourceUrl) {
    return jsonError("sourceUrl ma vaere en gyldig URL.", 400)
  }

  const suggestion = await prisma.actorCorrectionSuggestion.create({
    data: {
      actorId,
      submittedById: user.id,
      payload,
      note: note || "Brukerforslag uten ekstra notat.",
      sourceUrl,
    },
  })

  return NextResponse.json({ suggestion }, { status: 201 })
}
