import type { ReactNode } from "react"
import { Navigation } from "@/components/navigation"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto px-4 py-10">{children}</div>
      </main>
    </div>
  )
}
