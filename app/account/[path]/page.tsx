import { AccountView } from "@neondatabase/auth/react"
import { accountViewPaths } from "@neondatabase/auth/react/ui/server"

export const dynamicParams = false

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }))
}

type AccountPageProps = {
  params: Promise<{ path: string }>
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { path } = await params

  return (
    <main className="container p-4 md:p-6">
      <AccountView path={path} />
    </main>
  )
}
