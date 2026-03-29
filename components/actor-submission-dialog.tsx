"use client"

import { useState } from "react"
import { ActorSubmissionForm } from "@/components/actor-submission-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { VariantProps } from "class-variance-authority"
import type { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ActorSubmissionDialogProps = {
  onSuccess?: (actorId: string) => void | Promise<void>
  triggerLabel?: string
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"]
  triggerSize?: VariantProps<typeof buttonVariants>["size"]
  triggerClassName?: string
}

export function ActorSubmissionDialog({
  onSuccess,
  triggerLabel = "Foreslå aktør",
  triggerVariant,
  triggerSize,
  triggerClassName,
}: ActorSubmissionDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = async (actorId: string) => {
    await onSuccess?.(actorId)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className={cn(triggerClassName)}>
          {triggerLabel}
        </Button>
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
