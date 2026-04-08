"use client"

import { useState } from "react"
import type { VariantProps } from "class-variance-authority"
import { ActorSubmissionForm } from "@/components/actor-submission-form"
import { ClientReady } from "@/components/client-ready"
import { PublicActorDialogShell } from "@/components/public-actor-dialog-shell"
import type { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
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
    <ClientReady
      fallback={
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={cn(triggerClassName)}
          aria-hidden="true"
          disabled
          tabIndex={-1}
        >
          {triggerLabel}
        </Button>
      }
    >
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={triggerVariant} size={triggerSize} className={cn(triggerClassName)}>
            {triggerLabel}
          </Button>
        </DialogTrigger>

        <PublicActorDialogShell
          title="Registrer ny aktør"
          description="Fyll inn alle feltene. Innsendingen blir gjennomgått av en administrator før den publiseres."
        >
          <ActorSubmissionForm variant="dialog" onSuccess={handleSuccess} />
        </PublicActorDialogShell>
      </Dialog>
    </ClientReady>
  )
}
