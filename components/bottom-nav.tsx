"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Sparkles, MapPin, Trophy, User } from "lucide-react"

const items = [
  { href: "/", label: "Hjem", icon: Home },
  { href: "/decide", label: "Decide", icon: Sparkles },
  { href: "/kart", label: "Kart", icon: MapPin },
  { href: "/challenges", label: "Missions", icon: Trophy },
  { href: "/profile", label: "Profil", icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const Icon = item.icon
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
