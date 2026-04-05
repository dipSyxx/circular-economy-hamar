"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { UserButton } from "@neondatabase/auth/react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Shield, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { navigation, navigationCopy } from "@/content/no"
import { ThemeToggle } from "@/components/theme-toggle"
import { authClient } from "@/lib/auth/client"
import { accountLocalization } from "@/content/auth-localization"
import { BrandLogo } from "@/components/brand-logo"
import { ActorSubmissionDialog } from "@/components/actor-submission-dialog"

const authRoutes = {
  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",
  signOut: "/auth/sign-out",
  accountProfile: "/account/profile",
  accountSettings: "/account/settings",
}

export function Navigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { data } = authClient.useSession()
  const hasSession = Boolean(data?.session)
  const [isAdmin, setIsAdmin] = useState(false)
  const additionalLinks = hasSession
    ? [
        {
          href: authRoutes.accountProfile,
          label: "Profil",
          icon: <User className="mr-2 h-4 w-4" />,
          signedIn: true,
        },
        ...(isAdmin
          ? [
              {
                href: "/admin",
                label: "Admin",
                icon: <Shield className="mr-2 h-4 w-4" />,
                signedIn: true,
                separator: true,
              },
            ]
          : []),
      ]
    : undefined

  useEffect(() => {
    let active = true
    const checkAdmin = async () => {
      if (!hasSession) {
        if (active) setIsAdmin(false)
        return
      }

      const userId = data?.user?.id
      const cacheKey = userId ? `admin_check_${userId}` : null
      const ADMIN_CACHE_TTL = 5 * 60 * 1000

      if (cacheKey) {
        try {
          const cached = JSON.parse(sessionStorage.getItem(cacheKey) ?? "null") as { value: string; ts: number } | null
          if (cached !== null && Date.now() - cached.ts < ADMIN_CACHE_TTL) {
            if (active) setIsAdmin(cached.value === "1")
            return
          }
        } catch {
          // ignore sessionStorage errors (private mode, etc.)
        }
      }

      try {
        const response = await fetch("/api/admin/me")
        if (!active) return
        const isAdminResult = response.ok
        setIsAdmin(isAdminResult)
        if (cacheKey) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({ value: isAdminResult ? "1" : "0", ts: Date.now() }))
          } catch {
            // ignore sessionStorage errors
          }
        }
      } catch {
        if (active) setIsAdmin(false)
      }
    }
    void checkAdmin()
    return () => {
      active = false
    }
  }, [hasSession, data?.user?.id])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <BrandLogo priority imageClassName="h-9 md:h-10" className="shrink-0" />

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
          <ActorSubmissionDialog
            triggerVariant="outline"
            triggerSize="sm"
            triggerClassName="hidden md:inline-flex"
          />
          {hasSession ? (
            <UserButton
              size="icon"
              localization={accountLocalization}
              additionalLinks={additionalLinks}
            />
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
                <ActorSubmissionDialog triggerVariant="outline" triggerClassName="w-full" />
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
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "px-4 py-3 text-base font-medium rounded-lg transition-colors",
                      pathname.startsWith("/admin")
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    Admin
                  </Link>
                )}
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
