import { accountViewPaths } from "@neondatabase/auth/react/ui/server"
import { AccountViewShell } from "@/components/account-view-shell"
import { AppBreadcrumbs } from "@/components/app-breadcrumbs"
import { AccountTabs } from "@/components/account-tabs"
import { BottomNav } from "@/components/bottom-nav"
import { Footer } from "@/components/footer"
import { Navigation } from "@/components/navigation"
import { ProfileDashboard } from "@/components/profile-dashboard"
import { accountSectionCopy } from "@/content/account-ui"
import { accountLocalization } from "@/content/auth-localization"
import { pageCopy } from "@/content/no"

export const dynamicParams = false

export function generateStaticParams() {
  return [...Object.values(accountViewPaths), "profile"].map((path) => ({ path }))
}

type AccountPageProps = {
  params: Promise<{ path: string }>
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { path } = await params
  const isProfile = path === "profile"
  const sectionCopy = isProfile
    ? pageCopy.profile
    : path === accountViewPaths.SECURITY
      ? accountSectionCopy.security
      : path === accountViewPaths.TEAMS
        ? accountSectionCopy.teams
        : path === accountViewPaths.API_KEYS
          ? accountSectionCopy.apiKeys
          : path === accountViewPaths.ORGANIZATIONS
            ? accountSectionCopy.organizations
            : accountSectionCopy.settings

  return (
    <>
      <Navigation />
      <main className="container px-4 pb-[calc(var(--mobile-bottom-nav-height)+env(safe-area-inset-bottom,0px)+1.25rem)] pt-3 md:px-6 md:pb-10 md:pt-6">
        <AppBreadcrumbs withContainer={false} className="hidden md:mb-4 md:flex" />
        <div className="flex flex-col gap-4 md:flex-row md:gap-10">
          <aside className="md:w-64 md:shrink-0">
            <AccountTabs />
          </aside>
          <section className="flex w-full flex-col gap-4 md:gap-6">
            <header className="rounded-2xl border bg-muted/30 p-4 sm:p-5 md:rounded-3xl md:p-6">
              <div className="max-w-3xl space-y-1.5 md:space-y-2">
                <h1 className="text-xl font-bold sm:text-2xl md:text-4xl">{sectionCopy.title}</h1>
                <p className="text-sm text-muted-foreground sm:text-base md:text-lg">{sectionCopy.description}</p>
              </div>
            </header>
            {isProfile ? (
              <ProfileDashboard />
            ) : (
              <AccountViewShell
                path={path}
                hideNav
                localization={accountLocalization}
                classNames={{ cards: "gap-4 md:gap-6" }}
              />
            )}
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
