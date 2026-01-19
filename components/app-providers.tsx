"use client"

import type { ReactNode } from "react"
import { NeonAuthUIProvider } from "@neondatabase/auth/react"
import { AuthSync } from "@/components/auth-sync"
import { ThemeProvider } from "@/components/theme-provider"
import { authClient } from "@/lib/auth/client"

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <NeonAuthUIProvider authClient={authClient}>
      <AuthSync />
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </NeonAuthUIProvider>
  )
}
