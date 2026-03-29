import { readFile } from "node:fs/promises"
import path from "node:path"

const ensureDatabaseUrl = async () => {
  if (process.env.DATABASE_URL) return

  const envPath = path.join(process.cwd(), ".env")
  const envContents = await readFile(envPath, "utf8")
  const databaseUrlLine = envContents
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("DATABASE_URL="))

  if (!databaseUrlLine) {
    throw new Error("DATABASE_URL mangler i .env")
  }

  process.env.DATABASE_URL = databaseUrlLine.slice("DATABASE_URL=".length).trim()
}

const runBackfill = async () => {
  await ensureDatabaseUrl()

  const { prisma } = await import("../lib/prisma")
  const { seedCanonicalGeoTaxonomy } = await import("../lib/geo-taxonomy")
  const { prepareActorPersistData, replaceActorServiceAreas } = await import("../lib/actor-write")

  const actors = await prisma.actor.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      description: true,
      longDescription: true,
      address: true,
      postalCode: true,
      county: true,
      countySlug: true,
      municipality: true,
      municipalitySlug: true,
      city: true,
      area: true,
      lat: true,
      lng: true,
      phone: true,
      email: true,
      website: true,
      instagram: true,
      openingHours: true,
      openingHoursOsm: true,
      tags: true,
      benefits: true,
      howToUse: true,
      image: true,
      nationwide: true,
    },
  })

  await seedCanonicalGeoTaxonomy(
    prisma,
    actors.map((actor) => ({
      county: actor.county,
      countySlug: actor.countySlug,
      municipality: actor.municipality,
      municipalitySlug: actor.municipalitySlug,
    })),
  )

  const unresolved: Array<{ actorId: string; slug: string; reason: string }> = []
  let updated = 0

  for (const actor of actors) {
    try {
      const prepared = await prepareActorPersistData(
        prisma,
        {
          name: actor.name,
          slug: actor.slug,
          category: actor.category,
          description: actor.description,
          longDescription: actor.longDescription,
          address: actor.address,
          postalCode: actor.postalCode,
          county: actor.county,
          countySlug: actor.countySlug,
          municipality: actor.municipality,
          municipalitySlug: actor.municipalitySlug,
          city: actor.city,
          area: actor.area,
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
          nationwide: actor.nationwide,
        },
        { createMissingMunicipality: true },
      )

      await prisma.actor.update({
        where: { id: actor.id },
        data: prepared.actorData,
      })
      await replaceActorServiceAreas(prisma, actor.id, prepared.serviceAreaLinks)
      updated += 1
    } catch (error) {
      unresolved.push({
        actorId: actor.id,
        slug: actor.slug,
        reason: error instanceof Error ? error.message : "Ukjent feil",
      })
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: unresolved.length === 0,
        updatedActors: updated,
        unresolvedCount: unresolved.length,
        unresolved,
      },
      null,
      2,
    ),
  )
}

void runBackfill().catch((error) => {
  console.error(error)
  process.exit(1)
})
