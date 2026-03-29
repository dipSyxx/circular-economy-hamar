import { Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { PilotRolloutMode } from "@/lib/pilot-coverage"

type PilotRolloutNoteProps = {
  mode: PilotRolloutMode
  countyName?: string
  municipalityName?: string
}

export function PilotRolloutNote({ mode, countyName, municipalityName }: PilotRolloutNoteProps) {
  if (mode === "pilot-ready") {
    return null
  }

  if (mode === "pilot-expanding") {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Dekningen bygges ut</AlertTitle>
        <AlertDescription>
          {countyName
            ? `${countyName} er et prioritert pilotfylke i denne fasen.`
            : "Dette omradet er prioritert i pilotfasen."}{" "}
          Browse er klart, men vi fyller fortsatt ut enkelte tjenesteklynger. Bruk gjerne korrekturforslag hvis noe
          mangler.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Under utrulling</AlertTitle>
      <AlertDescription>
        {municipalityName
          ? `${municipalityName}${countyName ? ` i ${countyName}` : ""} er fortsatt under utrulling.`
          : countyName
            ? `${countyName} er fortsatt under utrulling.`
            : "Dette omradet er fortsatt under utrulling."}{" "}
        Browse fungerer allerede, men dekningen kan vaere tynn. Bruk innsendinger og korrekturforslag for a hjelpe oss
        fylle ut katalogen.
      </AlertDescription>
    </Alert>
  )
}
