"use client"

import { useEffect, useState, type ReactNode } from "react"

type ClientReadyProps = {
  children: ReactNode
  fallback?: ReactNode
}

export function ClientReady({ children, fallback = null }: ClientReadyProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  return ready ? <>{children}</> : <>{fallback}</>
}
