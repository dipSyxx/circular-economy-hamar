export const getSiteUrl = () => {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL

  if (!envUrl) {
    return "http://localhost:3000"
  }

  return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`
}
