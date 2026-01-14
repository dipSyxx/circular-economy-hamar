import type { ReactNode } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { BottomNav } from "@/components/bottom-nav"

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pb-20">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  )
}
