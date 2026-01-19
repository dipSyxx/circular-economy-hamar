"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
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
              className={cn(
                "flex flex-col items-center gap-1 text-xs font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
