import Link from "next/link"
import { Recycle } from "lucide-react"
import { footerContent, navigation, site } from "@/content/no"

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
              <span className="text-lg font-bold">{site.name}</span>
            </Link>
            <p className="text-sm text-muted-foreground">{footerContent.about}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{footerContent.navigationTitle}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {navigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{footerContent.actorsTitle}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerContent.actorLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{footerContent.sourcesTitle}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {footerContent.sourceLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>{footerContent.copyright}</p>
        </div>
      </div>
    </footer>
  )
}
