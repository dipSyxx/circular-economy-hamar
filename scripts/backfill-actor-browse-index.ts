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

const run = async () => {
  await ensureDatabaseUrl()

  const { prisma } = await import("../lib/prisma")
  const { prepareActorPersistData, replaceActorBrowseScopes } = await import("../lib/actor-write")

  const actors = await prisma.actor.findMany({
    where: { status: "approved" },
    include: {
      serviceAreas: {
        include: {
          county: { select: { slug: true } },
          municipality: { select: { slug: true } },
        },
      },
    },
  })

  let updated = 0
  for (const actor of actors) {
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
        serviceAreaCountySlugs: actor.serviceAreas.flatMap((entry) => (entry.county?.slug ? [entry.county.slug] : [])),
        serviceAreaMunicipalitySlugs: actor.serviceAreas.flatMap((entry) =>
          entry.municipality?.slug ? [entry.municipality.slug] : [],
        ),
      },
      { createMissingMunicipality: true },
    )

    await prisma.actor.update({
      where: { id: actor.id },
      data: { searchText: prepared.actorData.searchText },
    })
    await replaceActorBrowseScopes(prisma, actor.id, prepared.browseScopes)
    updated += 1
  }

  console.log(JSON.stringify({ ok: true, updated }, null, 2))
}

void run().catch((error) => {
  console.error(error)
  process.exit(1)
})
