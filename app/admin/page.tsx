import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { adminResources } from "@/lib/admin/resources"
import { PendingActorsPanel } from "@/components/admin/pending-actors"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminPage() {
  const { dbUser } = await requireAdmin()

  const [
    userCount,
    actorCount,
    pendingActorCount,
    challengeCount,
    quizQuestionCount,
    factCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.actor.count(),
    prisma.actor.count({ where: { status: "pending" } }),
    prisma.challenge.count(),
    prisma.quizQuestion.count(),
    prisma.fact.count(),
  ])

  const pendingActors = await prisma.actor.findMany({
    where: { status: "pending" },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      repairServices: true,
      sources: true,
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  })

  const pendingActorPayload = pendingActors.map((actor) => ({
    id: actor.id,
    name: actor.name,
    slug: actor.slug,
    category: actor.category,
    description: actor.description,
    longDescription: actor.longDescription,
    address: actor.address,
    lat: actor.lat,
    lng: actor.lng,
    phone: actor.phone,
    email: actor.email,
    website: actor.website,
    instagram: actor.instagram,
    openingHours: actor.openingHours,
    openingHoursOsm: actor.openingHoursOsm,
    tags: actor.tags,
    benefits: actor.benefits,
    howToUse: actor.howToUse,
    image: actor.image,
    status: actor.status,
    reviewNote: actor.reviewNote,
    createdAt: actor.createdAt.toISOString(),
    updatedAt: actor.updatedAt.toISOString(),
    createdBy: actor.createdBy ? { name: actor.createdBy.name, email: actor.createdBy.email } : null,
    repairServices: actor.repairServices.map((service) => ({
      id: service.id,
      problemType: service.problemType,
      itemTypes: service.itemTypes,
      priceMin: service.priceMin,
      priceMax: service.priceMax,
      etaDays: service.etaDays,
    })),
    sources: actor.sources.map((source) => ({
      id: source.id,
      type: source.type,
      title: source.title,
      url: source.url,
      capturedAt: source.capturedAt ? source.capturedAt.toISOString() : null,
      note: source.note,
    })),
  }))

  const stats = [
    { label: "Brukere", value: userCount },
    { label: "Aktører", value: actorCount },
    { label: "Ventende aktører", value: pendingActorCount },
    { label: "Oppdrag", value: challengeCount },
    { label: "Quizspørsmål", value: quizQuestionCount },
    { label: "Fakta", value: factCount },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Adminoversikt</h1>
        <p className="text-muted-foreground">Administrer innhold, brukere og godkjenninger.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <PendingActorsPanel initialActors={pendingActorPayload} reviewerId={dbUser.id} />

      <div>
        <h2 className="text-xl font-semibold">Ressurser</h2>
        <p className="text-muted-foreground">Detaljert redigering per ressurs.</p>
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



