import type { ReactNode } from "react"
import { PlatformShell } from "@/components/platform-shell"

export default function FylkerLayout({ children }: { children: ReactNode }) {
  return <PlatformShell>{children}</PlatformShell>
}
