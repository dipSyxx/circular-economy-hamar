import { authViewPaths } from "@neondatabase/auth/react/ui/server"
import { AuthShell } from "@/components/auth-shell"
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

  return <AuthShell path={path} localization={accountLocalization} />
}
