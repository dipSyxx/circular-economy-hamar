import { AuthView } from "@neondatabase/auth/react"
import { authViewPaths } from "@neondatabase/auth/react/ui/server"
import { accountLocalization } from "@/content/auth-localization"

export const dynamicParams = false

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }))
}

type AuthPageProps = {
  params: Promise<{ path: string }>
}

export default async function AuthPage({ params }: AuthPageProps) {
  const { path } = await params

  return (
    <main className="container mx-auto flex grow flex-col items-center justify-center gap-3 self-center p-4 md:p-6">
      <AuthView path={path} localization={accountLocalization} />
    </main>
  )
}
