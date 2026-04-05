"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Noe gikk galt</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          En uventet feil oppstod. Prøv å laste siden på nytt.
        </p>
      </div>
      <Button onClick={reset}>Prøv igjen</Button>
    </div>
  )
}
