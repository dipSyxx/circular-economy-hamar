"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { UserButton } from "@neondatabase/auth/react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Recycle } from "lucide-react"
import { cn } from "@/lib/utils"
import { navigation, navigationCopy, site } from "@/content/no"
import { ThemeToggle } from "@/components/theme-toggle"
import { authClient } from "@/lib/auth/client"

const authRoutes = {
  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",
  signOut: "/auth/sign-out",
  accountSettings: "/account/settings",
}

export function Navigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { data } = authClient.useSession()
  const hasSession = Boolean(data?.session)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Recycle className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold">{site.name}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2">
          {hasSession ? (
            <UserButton size="icon" />
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={authRoutes.signIn}>Logg inn</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={authRoutes.signUp}>Registrer deg</Link>
              </Button>
            </div>
          )}
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{navigationCopy.openMenuLabel}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <div className="flex flex-col gap-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-4 py-3 text-base font-medium rounded-lg transition-colors",
                      (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href))
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                {hasSession ? (
                  <div className="grid gap-2 pt-2">
                    <Button variant="outline" asChild>
                      <Link href={authRoutes.accountSettings}>Innstillinger</Link>
                    </Button>
                    <Button variant="destructive" asChild>
                      <Link href={authRoutes.signOut}>Logg ut</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-2 pt-2">
                    <Button variant="outline" asChild>
                      <Link href={authRoutes.signIn}>Logg inn</Link>
                    </Button>
                    <Button asChild>
                      <Link href={authRoutes.signUp}>Registrer deg</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
