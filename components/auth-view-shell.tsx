"use client"

import type { ComponentProps } from "react"
import { AuthView } from "@neondatabase/auth/react"
import { ClientReady } from "@/components/client-ready"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type AuthViewShellProps = ComponentProps<typeof AuthView>

function AuthViewFallback({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "w-full rounded-[1.5rem] border border-white/50 bg-card/85 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] backdrop-blur sm:rounded-[1.75rem] dark:border-white/10",
        className,
      )}
    >
      <div className="space-y-3 border-b border-border/60 px-5 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-full max-w-64" />
      </div>
      <div className="grid gap-4 p-5 sm:gap-5 sm:p-6">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="flex items-center gap-3 py-1">
          <Skeleton className="h-px flex-1" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-px flex-1" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function AuthViewShell({ className, ...props }: AuthViewShellProps) {
  return (
    <ClientReady fallback={<AuthViewFallback className={className} />}>
      <AuthView className={className} {...props} />
    </ClientReady>
  )
}
