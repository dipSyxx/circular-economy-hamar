"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useContext, useMemo } from "react"
import { AuthUIContext, accountViewPaths } from "@neondatabase/auth/react"
import { Button } from "@/components/ui/button"
import { accountSectionCopy } from "@/content/account-ui"
import { pageCopy } from "@/content/no"
import { cn } from "@/lib/utils"

type AccountTabsProps = {
  className?: string
  showTeams?: boolean
}

type AccountTabItem = {
  key: string
  label: string
  path: string
  enabled?: boolean
}

export function AccountTabs({ className, showTeams = true }: AccountTabsProps) {
  const pathname = usePathname()
  const {
    account: accountOptions,
    apiKey,
    teams: teamOptions,
    organization,
  } = useContext(AuthUIContext)

  const basePath = accountOptions?.basePath ?? "/account"
  const viewPaths = accountOptions?.viewPaths ?? accountViewPaths
  const teamsEnabled = teamOptions?.enabled ?? false
  const activePath = pathname?.split("/").pop() ?? viewPaths.SETTINGS

  const items = useMemo<AccountTabItem[]>(() => {
    const list: AccountTabItem[] = [
      {
        key: "PROFILE",
        label: pageCopy.profile.title,
        path: "profile",
      },
      {
        key: "SETTINGS",
        label: accountSectionCopy.settings.title,
        path: viewPaths.SETTINGS,
      },
      {
        key: "SECURITY",
        label: accountSectionCopy.security.title,
        path: viewPaths.SECURITY,
      },
    ]

    if (teamsEnabled && showTeams) {
      list.push({
        key: "TEAMS",
        label: accountSectionCopy.teams.title,
        path: viewPaths.TEAMS,
      })
    }

    if (apiKey) {
      list.push({
        key: "API_KEYS",
        label: accountSectionCopy.apiKeys.title,
        path: viewPaths.API_KEYS,
      })
    }

    if (organization) {
      list.push({
        key: "ORGANIZATIONS",
        label: accountSectionCopy.organizations.title,
        path: viewPaths.ORGANIZATIONS,
      })
    }

    return list.filter((item) => Boolean(item.path))
  }, [
    apiKey,
    organization,
    showTeams,
    teamsEnabled,
    viewPaths.API_KEYS,
    viewPaths.ORGANIZATIONS,
    viewPaths.SECURITY,
    viewPaths.SETTINGS,
    viewPaths.TEAMS,
  ])

  return (
    <div
      className={cn(
        "-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0 md:pb-0",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = activePath === item.path
        return (
          <Button
            key={item.key}
            asChild
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "h-9 snap-start justify-start whitespace-nowrap rounded-full border border-transparent bg-background/80 px-3.5 text-sm transition-colors md:h-11 md:rounded-2xl md:px-4",
              isActive
                ? "border-primary/20 bg-primary/10 font-semibold text-foreground shadow-sm"
                : "text-foreground/70 hover:border-border/60 hover:bg-muted/70",
            )}
          >
            <Link href={`${basePath}/${item.path}`}>{item.label}</Link>
          </Button>
        )
      })}
    </div>
  )
}
