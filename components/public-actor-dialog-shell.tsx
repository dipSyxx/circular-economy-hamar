"use client"

import type { ReactNode } from "react"
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type PublicActorDialogShellProps = {
  title: string
  description: string
  children: ReactNode
}

export function PublicActorDialogShell({
  title,
  description,
  children,
}: PublicActorDialogShellProps) {
  return (
    <DialogContent className="h-dvh max-h-dvh w-screen max-w-none gap-0 rounded-none border-0 px-0 py-0 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-[98vw] sm:max-w-7xl sm:rounded-2xl sm:border sm:px-0 sm:py-0 [&>[data-slot=dialog-header]+:not([data-slot=dialog-footer]):not([data-slot=dialog-close])]:overflow-visible [&>[data-slot=dialog-header]+:not([data-slot=dialog-footer]):not([data-slot=dialog-close])]:p-0 [&>[data-slot=dialog-header]+:not([data-slot=dialog-footer]):not([data-slot=dialog-close])]:pr-0">
      <DialogHeader className="border-b bg-background/95 px-4 pb-3 pt-[calc(1rem+env(safe-area-inset-top,0px))] text-left backdrop-blur sm:px-6 sm:pb-4 sm:pt-6">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {children}
    </DialogContent>
  )
}
