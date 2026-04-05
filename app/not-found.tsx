import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-6xl font-bold text-muted-foreground/40">404</h1>
        <h2 className="text-2xl font-semibold">Siden ble ikke funnet</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Det ser ut til at siden du leter etter ikke eksisterer eller har blitt flyttet.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="default">
          <Link href="/">Til forsiden</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/fylker">Se alle fylker</Link>
        </Button>
      </div>
    </div>
  )
}
