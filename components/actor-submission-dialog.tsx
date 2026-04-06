"use client"

import { useState } from "react"
import type { VariantProps } from "class-variance-authority"
import { ActorSubmissionForm } from "@/components/actor-submission-form"
import type { buttonVariants } from "@/components/ui/button"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

      <DialogContent className="h-dvh max-h-dvh w-screen max-w-none gap-0 rounded-none border-0 px-0 py-0 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[98vw] sm:max-w-7xl sm:rounded-2xl sm:border sm:px-0 sm:py-0 [&>[data-slot=dialog-header]+:not([data-slot=dialog-footer]):not([data-slot=dialog-close])]:overflow-visible [&>[data-slot=dialog-header]+:not([data-slot=dialog-footer]):not([data-slot=dialog-close])]:p-0 [&>[data-slot=dialog-header]+:not([data-slot=dialog-footer]):not([data-slot=dialog-close])]:pr-0">
        <DialogHeader className="border-b bg-background/95 px-4 pb-3 pt-[calc(1rem+env(safe-area-inset-top,0px))] text-left backdrop-blur sm:px-6 sm:pb-4 sm:pt-6">
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
