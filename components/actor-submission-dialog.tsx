"use client"

import { useState } from "react"
import { ActorSubmissionForm } from "@/components/actor-submission-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type ActorSubmissionDialogProps = {
  onSuccess?: (actorId: string) => void | Promise<void>
  triggerLabel?: string
}

export function ActorSubmissionDialog({ onSuccess, triggerLabel = "Foreslå aktør" }: ActorSubmissionDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = async (actorId: string) => {
    await onSuccess?.(actorId)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-[98vw] sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Registrer ny aktør</DialogTitle>
          <DialogDescription>
            Fyll inn alle feltene. Innsendingen blir gjennomgått av en administrator før den publiseres.
          </DialogDescription>
        </DialogHeader>
        <ActorSubmissionForm variant="dialog" onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
