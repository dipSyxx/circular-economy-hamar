import type { ReactNode } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { BottomNav } from "@/components/bottom-nav"
import { AppBreadcrumbs } from "@/components/app-breadcrumbs"

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pb-20">
        <AppBreadcrumbs className="mb-4" containerClassName="pt-6" />
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
