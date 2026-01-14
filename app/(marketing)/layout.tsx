import type { ReactNode } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
