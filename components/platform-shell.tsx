import type { ReactNode } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { BottomNav } from "@/components/bottom-nav"
import { AppBreadcrumbs } from "@/components/app-breadcrumbs"

export function PlatformShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navigation />
      <main className="flex-1 pb-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom,0px)+1rem)] md:pb-0">
        <AppBreadcrumbs className="mb-3 md:mb-4" containerClassName="pt-4 md:pt-6" />
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
