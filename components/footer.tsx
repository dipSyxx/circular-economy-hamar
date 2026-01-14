import Link from "next/link"
import { Recycle } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Recycle className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">SirkulærHamar</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Din guide til bærekraftige valg i Hamar. Gjenbruk, reparer, resirkuler.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Navigasjon</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/aktorer" className="hover:text-foreground">
                  Aktører
                </Link>
              </li>
              <li>
                <Link href="/kart" className="hover:text-foreground">
                  Kart
                </Link>
              </li>
              <li>
                <Link href="/kalkulator" className="hover:text-foreground">
                  Kalkulator
                </Link>
              </li>
              <li>
                <Link href="/quiz" className="hover:text-foreground">
                  Quiz
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Aktører</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/aktorer/kirppis" className="hover:text-foreground">
                  Kirppis
                </Link>
              </li>
              <li>
                <Link href="/aktorer/resirkula" className="hover:text-foreground">
                  Resirkula
                </Link>
              </li>
              <li>
                <Link href="/aktorer/teknikfiks" className="hover:text-foreground">
                  TeknikFiks
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Kilder</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://ndla.no" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                  NDLA
                </a>
              </li>
              <li>
                <a
                  href="https://framtiden.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  Framtiden i våre hender
                </a>
              </li>
              <li>
                <a
                  href="https://miljostatus.miljodirektoratet.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  Miljøstatus
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2025 SirkulærHamar. Laget som skoleprosjekt om sirkulær økonomi.</p>
        </div>
      </div>
    </footer>
  )
}
