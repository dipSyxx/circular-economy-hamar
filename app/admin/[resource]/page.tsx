import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import { adminResources, adminResourceDefaults } from "@/lib/admin/resources"
import { ResourceManager } from "@/components/admin/resource-manager"

type PageProps = {
  params: { resource: string }
}

export default async function AdminResourcePage({ params }: PageProps) {
  await requireAdmin()

  const resource = adminResources.find((item) => item.key === params.resource)
  if (!resource) {
    notFound()
  }

  return (
    <ResourceManager
      resourceKey={resource.key}
      label={resource.label}
      description={resource.description}
      defaultPayload={adminResourceDefaults[resource.key]}
    />
  )
}
