"use client"

import type { ComponentProps } from "react"
import { AccountView } from "@neondatabase/auth/react"
import { ClientReady } from "@/components/client-ready"
import { Skeleton } from "@/components/ui/skeleton"

type AccountViewShellProps = ComponentProps<typeof AccountView>

function AccountViewFallback() {
  return (
    <div aria-hidden="true" className="grid gap-4 md:gap-6">
      <div className="rounded-3xl border bg-card p-4 shadow-sm md:p-6">
        <div className="space-y-3 border-b border-border/60 pb-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-full max-w-72" />
        </div>
        <div className="mt-5 grid gap-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
      <div className="rounded-3xl border bg-card p-4 shadow-sm md:p-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function AccountViewShell(props: AccountViewShellProps) {
  return (
    <ClientReady fallback={<AccountViewFallback />}>
      <AccountView {...props} />
    </ClientReady>
  )
}
