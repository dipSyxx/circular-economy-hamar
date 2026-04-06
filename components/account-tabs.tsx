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
        "flex snap-x gap-2 overflow-x-auto pb-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0",
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
              "h-10 snap-start justify-start whitespace-nowrap rounded-full border border-transparent px-4 transition-colors md:h-11 md:rounded-2xl",
              isActive
                ? "border-primary/15 bg-primary/10 font-semibold text-foreground"
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
