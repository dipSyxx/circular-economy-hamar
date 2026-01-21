import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { adminResources } from "@/lib/admin/resources"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminPage() {
  await requireAdmin()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground">Administrer innhold og datasett.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminResources.map((resource) => (
          <Link key={resource.key} href={`/admin/${resource.key}`}>
            <Card className="h-full transition hover:shadow-md">
              <CardHeader>
                <CardTitle>{resource.label}</CardTitle>
                {resource.description && <CardDescription>{resource.description}</CardDescription>}
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
