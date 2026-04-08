"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { ActorSubmissionDialog } from "@/components/actor-submission-dialog"
import { BrandLogo } from "@/components/brand-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { navigation, navigationCopy } from "@/content/no"
import { authClient } from "@/lib/auth/client"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  ChevronRight,
  House,
  Info,
  LogIn,
  LogOut,
  Map,
  MapPinned,
  Menu,
  Newspaper,
  Settings,
  Shield,
  Sparkles,
  Store,
  Trophy,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

const authRoutes = {
  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",
  signOut: "/auth/sign-out",
  accountProfile: "/account/profile",
  accountSettings: "/account/settings",
}

const mobileNavigationMeta: Record<
  string,
  { description: string; icon: LucideIcon }
> = {
  "/": {
    description: "Startside og siste høydepunkter",
    icon: House,
  },
  "/aktorer": {
    description: "Utforsk lokale tilbud og tjenester",
    icon: Store,
  },
  "/fylker": {
    description: "Se oversikten fylke for fylke",
    icon: MapPinned,
  },
  "/guider": {
    description: "Lær hva du kan gjøre videre",
    icon: BookOpen,
  },
  "/artikler": {
    description: "Les innsikt, tips og oppdateringer",
    icon: Newspaper,
  },
  "/decide": {
    description: "Få hjelp til å ta neste valg",
    icon: Sparkles,
  },
  "/kart": {
    description: "Finn steder nær deg på kartet",
    icon: Map,
  },
  "/quiz": {
    description: "Test deg selv og lær underveis",
    icon: Trophy,
  },
  "/fakta": {
    description: "Tall, kilder og forklaringer",
    icon: Info,
  },
}

type NavigationUser = {
  email?: string | null
  image?: string | null
  name?: string | null
}

function getUserInitials(user: NavigationUser) {
  const source = user.name?.trim() || user.email?.trim() || "Konto"

  return (
    source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "K"
  )
}

function DesktopAccountMenu({
  isAdmin,
  user,
}: {
  isAdmin: boolean
  user: NavigationUser
}) {
  const email = user.email?.trim()
  const displayName = user.name?.trim() || email || "Konto"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hidden rounded-full md:inline-flex"
          aria-label="Konto"
        >
          <Avatar className="size-8 border border-border/60">
            <AvatarImage src={user.image ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-muted text-xs font-semibold">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 border border-border/60">
              <AvatarImage src={user.image ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-muted text-xs font-semibold">
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              {email ? (
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {email}
                </p>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={authRoutes.accountProfile}>
            <User className="mr-2 h-4 w-4" />
            Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={authRoutes.accountSettings}>
            <Settings className="mr-2 h-4 w-4" />
            Innstillinger
          </Link>
        </DropdownMenuItem>
        {isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">
                <Shield className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={authRoutes.signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logg ut
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function Navigation() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [authUiReady, setAuthUiReady] = useState(false)
  const { data } = authClient.useSession()
  const hasSession = Boolean(data?.session)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setAuthUiReady(true)
  }, [])

  useEffect(() => {
    let active = true

    const checkAdmin = async () => {
      if (!hasSession) {
        if (active) setIsAdmin(false)
        return
      }

      const userId = data?.user?.id
      const cacheKey = userId ? `admin_check_${userId}` : null
      const adminCacheTtl = 5 * 60 * 1000

      if (cacheKey) {
        try {
          const cached = JSON.parse(
            sessionStorage.getItem(cacheKey) ?? "null",
          ) as { value: string; ts: number } | null
          if (cached !== null && Date.now() - cached.ts < adminCacheTtl) {
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
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({
                value: isAdminResult ? "1" : "0",
                ts: Date.now(),
              }),
            )
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

  const getIsActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <BrandLogo priority imageClassName="h-9 md:h-10" className="shrink-0" />

        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                getIsActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ActorSubmissionDialog
            triggerVariant="outline"
            triggerSize="sm"
            triggerClassName="hidden md:inline-flex"
          />

          {authUiReady ? (
            hasSession ? (
              <DesktopAccountMenu isAdmin={isAdmin} user={data?.user ?? {}} />
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={authRoutes.signIn}>Logg inn</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={authRoutes.signUp}>Registrer deg</Link>
                </Button>
              </div>
            )
          ) : (
            <div className="hidden items-center gap-2 md:flex" aria-hidden="true">
              <div className="h-9 w-24 rounded-md border bg-background/80" />
              <div className="h-9 w-28 rounded-md bg-primary/12" />
            </div>
          )}

          <ThemeToggle />

          {authUiReady ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-10 rounded-xl border-border/60 bg-background/90 shadow-sm"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{navigationCopy.openMenuLabel}</span>
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="h-dvh max-h-dvh w-[min(92vw,360px)] gap-0 overflow-hidden p-0"
              >
                <SheetHeader className="shrink-0 border-b px-5 pb-4 pt-6 text-left">
                  <BrandLogo imageClassName="h-10" className="pr-10" />
                  <SheetTitle className="pt-3 text-left text-base">Meny</SheetTitle>
                  <SheetDescription className="text-left text-pretty">
                    Gå raskt til kart, guider, aktører og kontoen din.
                  </SheetDescription>
                </SheetHeader>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden !p-0">
                  <div className="overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4">
                    <div className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                      <p className="text-sm font-semibold">Tips oss om en aktør</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Hjelp oss utvide kartet med reparasjon, ombruk og
                        gjenvinning i ditt område.
                      </p>
                      <ActorSubmissionDialog
                        triggerVariant="outline"
                        triggerClassName="mt-3 w-full rounded-xl bg-background"
                      />
                    </div>

                    <div className="mt-5">
                      <p className="px-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Utforsk
                      </p>
                      <nav className="mt-3 flex flex-col gap-2">
                        {navigation.map((item) => {
                          const meta = mobileNavigationMeta[item.href]
                          const Icon = meta?.icon ?? House
                          const active = getIsActive(item.href)

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              aria-current={active ? "page" : undefined}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "group flex items-center justify-between rounded-2xl border border-transparent px-3 py-3 transition-all",
                                active
                                  ? "border-primary/15 bg-primary/5 shadow-sm"
                                  : "hover:border-border/60 hover:bg-muted/70",
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className={cn(
                                    "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                                    active
                                      ? "border-primary/20 bg-primary/10 text-primary"
                                      : "border-border/60 bg-background text-muted-foreground group-hover:text-foreground",
                                  )}
                                >
                                  <Icon className="size-4" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-foreground">
                                    {item.label}
                                  </span>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {meta?.description}
                                  </span>
                                </span>
                              </div>
                              <ChevronRight
                                className={cn(
                                  "size-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                                  active
                                    ? "text-primary"
                                    : "text-muted-foreground/70",
                                )}
                              />
                            </Link>
                          )
                        })}
                      </nav>
                    </div>

                    <Separator className="my-5" />

                    <div className="grid gap-3">
                      <div className="rounded-2xl border border-border/60 bg-background p-3">
                        <p className="text-sm font-semibold">
                          {authUiReady && hasSession ? "Konto" : "Logg inn for mer"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {authUiReady && hasSession
                            ? "Administrer profilen din, favoritter og innsendinger."
                            : "Lagrede favoritter og innsendinger følger kontoen din."}
                        </p>
                      </div>

                      {authUiReady ? (
                        hasSession ? (
                          <div className="grid gap-2">
                            <Button variant="secondary" asChild>
                              <Link
                                href={authRoutes.accountProfile}
                                onClick={() => setOpen(false)}
                              >
                                <User data-icon="inline-start" />
                                Profil
                              </Link>
                            </Button>
                            <Button variant="outline" asChild>
                              <Link
                                href={authRoutes.accountSettings}
                                onClick={() => setOpen(false)}
                              >
                                <Settings data-icon="inline-start" />
                                Innstillinger
                              </Link>
                            </Button>
                            {isAdmin ? (
                              <Button variant="outline" asChild>
                                <Link href="/admin" onClick={() => setOpen(false)}>
                                  <Shield data-icon="inline-start" />
                                  Admin
                                </Link>
                              </Button>
                            ) : null}
                            <Button variant="destructive" asChild>
                              <Link href={authRoutes.signOut} onClick={() => setOpen(false)}>
                                Logg ut
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            <Button variant="outline" asChild>
                              <Link href={authRoutes.signIn} onClick={() => setOpen(false)}>
                                <LogIn data-icon="inline-start" />
                                Logg inn
                              </Link>
                            </Button>
                            <Button asChild>
                              <Link href={authRoutes.signUp} onClick={() => setOpen(false)}>
                                <UserPlus data-icon="inline-start" />
                                Registrer deg
                              </Link>
                            </Button>
                          </div>
                        )
                      ) : (
                        <div className="grid gap-2" aria-hidden="true">
                          <div className="h-10 rounded-md border bg-background/80" />
                          <div className="h-10 rounded-md bg-primary/12" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="md:hidden" aria-hidden="true">
              <div className="size-10 rounded-xl border border-border/60 bg-background/90 shadow-sm" />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
