import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"
import { footerContent, navigation } from "@/content/no"

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-4 sm:col-span-2 md:col-span-1">
            <BrandLogo variant="full" imageClassName="h-10" textClassName="text-base md:text-lg" />
            <p className="text-sm text-muted-foreground">{footerContent.about}</p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">{footerContent.navigationTitle}</h3>
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
            <h3 className="mb-4 font-semibold">{footerContent.actorsTitle}</h3>
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
            <h3 className="mb-4 font-semibold">{footerContent.sourcesTitle}</h3>
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

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground md:pt-8">
          <p>{footerContent.copyright}</p>
        </div>
      </div>
    </footer>
  )
}
