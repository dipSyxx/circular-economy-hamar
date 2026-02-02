"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment, useMemo } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { adminResources } from "@/lib/admin/resources"
import { cn } from "@/lib/utils"

type AppBreadcrumbsProps = {
  className?: string
  containerClassName?: string
  hideHome?: boolean
  withContainer?: boolean
}

type Crumb = {
  label: string
  href: string
}

const baseLabels: Record<string, string> = {
  aktorer: "Aktører",
  decide: "Beslutning",
  kart: "Kart",
  quiz: "Quiz",
  fakta: "Fakta",
  kalkulator: "Reparasjonskalkulator",
  challenges: "Oppdrag",
  profile: "Profil",
  admin: "Admin",
  account: "Konto",
  settings: "Konto",
  security: "Sikkerhet",
  teams: "Team",
  "api-keys": "API-keys",
  organizations: "Organisasjoner",
}

const adminResourceLabels = new Map(
  adminResources.map((resource) => [resource.key, resource.label])
)

const hiddenSegments = new Set(["account"])

const decodeSegment = (segment: string) => {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

const toTitleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ")

const humanizeSegment = (segment: string) => {
  const decoded = decodeSegment(segment)
  const normalized = decoded.replace(/[-_]+/g, " ").trim()
  return normalized ? toTitleCase(normalized) : decoded
}

const getSegmentLabel = (segment: string, previousSegment?: string) => {
  if (previousSegment === "admin") {
    const adminLabel = adminResourceLabels.get(segment)
    if (adminLabel) return adminLabel
  }

  return baseLabels[segment] ?? humanizeSegment(segment)
}

export function AppBreadcrumbs({
  className,
  containerClassName,
  hideHome = false,
  withContainer = true,
}: AppBreadcrumbsProps) {
  const pathname = usePathname()

  const items = useMemo<Crumb[]>(() => {
    if (!pathname) return []
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return []

    const crumbs: Crumb[] = []

    if (!hideHome) {
      crumbs.push({ label: "Hjem", href: "/" })
    }

    segments.forEach((segment, index) => {
      if (hiddenSegments.has(segment) && segments.length > 1) {
        return
      }

      const href = `/${segments.slice(0, index + 1).join("/")}`
      const label = getSegmentLabel(segment, segments[index - 1])
      crumbs.push({ label, href })
    })

    return crumbs
  }, [hideHome, pathname])

  if (items.length === 0) return null

  const content = (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <Fragment key={`${item.href}-${item.label}`}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )

  if (!withContainer) {
    return content
  }

  return <div className={cn("container mx-auto px-4", containerClassName)}>{content}</div>
}
