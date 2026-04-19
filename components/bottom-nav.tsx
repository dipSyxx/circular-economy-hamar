"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HEADER_LAYER_CLASS } from "@/lib/ui/layers"
import { cn } from "@/lib/utils"
import { Home, Sparkles, MapPin, Trophy, User, type LucideIcon } from "lucide-react"
import { bottomNavCopy } from "@/content/no"

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  decide: Sparkles,
  map: MapPin,
  challenges: Trophy,
  profile: User,
}

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 border-t border-border/70 bg-background/95 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/75 md:hidden",
        HEADER_LAYER_CLASS,
      )}
    >
      <div className="mx-auto flex max-w-md items-end justify-between gap-1 px-3 pt-2">
        {bottomNavCopy.items.map((item) => {
          const isProfile = item.key === "profile"
          const active =
            item.href === "/"
              ? pathname === "/"
              : isProfile
                ? pathname.startsWith("/account") || pathname.startsWith("/profile")
                : pathname.startsWith(item.href)
          const Icon = iconMap[item.key] ?? Home
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl transition-colors",
                  active ? "bg-primary/12 text-primary" : "bg-muted/50 text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
