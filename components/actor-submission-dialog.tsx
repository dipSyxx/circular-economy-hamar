"use client"

import { ActorSubmissionForm } from "@/components/actor-submission-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function ActorSubmissionDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Foreslå aktør</Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-[98vw] sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Registrer ny aktør</DialogTitle>
          <DialogDescription>
            Fyll inn alle feltene. Innsendingen blir gjennomgått av en administrator før den publiseres.
          </DialogDescription>
        </DialogHeader>
        <ActorSubmissionForm variant="dialog" />
      </DialogContent>
    </Dialog>
  )
}
