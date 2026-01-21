import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { adminResourceConfig } from "@/lib/admin/resource-config"
import { adminResources, adminResourceDefaults } from "@/lib/admin/resources"
import { ResourceManager } from "@/components/admin/resource-manager"

type PageProps = {
  params: Promise<{ resource: string }>
}

export default async function AdminResourcePage({ params }: PageProps) {
  const { resource } = await params
  await requireAdmin()

  const config = adminResourceConfig[resource]
  if (!config) {
    notFound()
  }

  const resourceMeta = adminResources.find((item) => item.key === resource)
  const fallbackLabel = resource
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

  return (
    <ResourceManager
      resourceKey={resource}
      label={resourceMeta?.label ?? fallbackLabel}
      description={resourceMeta?.description}
      defaultPayload={adminResourceDefaults[resource]}
      allowIdOnCreate={resource === "users"}
    />
  )
}
