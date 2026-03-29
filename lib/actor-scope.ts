import type { Actor } from "@/lib/data"
import { getCountyBySlug, getMunicipalityBySlug } from "@/lib/geo"

export type GeographyOption = {
  slug: string
  name: string
}

const sortOptions = (options: GeographyOption[]) =>
  options.sort((left, right) => left.name.localeCompare(right.name, "no", { sensitivity: "base" }))

const addOption = (map: Map<string, GeographyOption>, slug?: string, name?: string) => {
  if (!slug || !name) return
  map.set(slug, { slug, name })
}

export const getCountyMatchPriority = (actor: Actor, countySlug: string) => {
  if (actor.countySlug === countySlug) return 0

  if (
    actor.serviceAreaMunicipalitySlugs?.some(
      (municipalitySlug) => getMunicipalityBySlug(municipalitySlug)?.countySlug === countySlug,
    )
  ) {
    return 1
  }

  if (actor.serviceAreaCountySlugs?.includes(countySlug)) return 1
  if (actor.nationwide) return 2
  return null
}

export const getMunicipalityMatchPriority = (
  actor: Actor,
  countySlug: string,
  municipalitySlug: string,
) => {
  if (actor.countySlug === countySlug && actor.municipalitySlug === municipalitySlug) return 0
  if (actor.serviceAreaMunicipalitySlugs?.includes(municipalitySlug)) return 1
  if (actor.serviceAreaCountySlugs?.includes(countySlug)) return 1
  if (actor.nationwide) return 2
  return null
}

export const getActorGeographyMatchPriority = (
  actor: Actor,
  countySlug?: string | null,
  municipalitySlug?: string | null,
) => {
  if (countySlug && municipalitySlug) {
    return getMunicipalityMatchPriority(actor, countySlug, municipalitySlug)
  }
  if (countySlug) {
    return getCountyMatchPriority(actor, countySlug)
  }
  return null
}

export const sortActorsByGeographyPriority = (
  actors: Actor[],
  countySlug?: string | null,
  municipalitySlug?: string | null,
) =>
  [...actors].sort((left, right) => {
    const leftPriority = getActorGeographyMatchPriority(left, countySlug, municipalitySlug) ?? 99
    const rightPriority = getActorGeographyMatchPriority(right, countySlug, municipalitySlug) ?? 99
    if (leftPriority !== rightPriority) return leftPriority - rightPriority
    return left.name.localeCompare(right.name, "no", { sensitivity: "base", numeric: true })
  })

export const getAvailableCountyOptions = (actors: Actor[]) => {
  const options = new Map<string, GeographyOption>()

  for (const actor of actors) {
    addOption(options, actor.countySlug, actor.county)

    for (const countySlug of actor.serviceAreaCountySlugs ?? []) {
      addOption(options, countySlug, getCountyBySlug(countySlug)?.name ?? actor.county ?? countySlug)
    }

    for (const municipalitySlug of actor.serviceAreaMunicipalitySlugs ?? []) {
      const municipality = getMunicipalityBySlug(municipalitySlug)
      if (municipality) {
        addOption(options, municipality.countySlug, municipality.countyName)
      }
    }
  }

  return sortOptions(Array.from(options.values()))
}

export const getAvailableMunicipalityOptions = (actors: Actor[], countySlug: string) => {
  const options = new Map<string, GeographyOption>()

  for (const actor of actors) {
    if (actor.countySlug === countySlug && actor.municipalitySlug) {
      addOption(options, actor.municipalitySlug, actor.municipality ?? actor.city ?? actor.municipalitySlug)
    }

    for (const municipalitySlug of actor.serviceAreaMunicipalitySlugs ?? []) {
      const municipality = getMunicipalityBySlug(municipalitySlug)
      if (municipality?.countySlug === countySlug) {
        addOption(options, municipality.slug, municipality.name)
      }
    }
  }

  return sortOptions(Array.from(options.values()))
}

export const filterActorsByCountyScope = (actors: Actor[], countySlug: string) =>
  sortActorsByGeographyPriority(
    actors.filter((actor) => getCountyMatchPriority(actor, countySlug) !== null),
    countySlug,
  )

export const filterActorsByMunicipalityScope = (actors: Actor[], countySlug: string, municipalitySlug: string) =>
  sortActorsByGeographyPriority(
    actors.filter((actor) => getMunicipalityMatchPriority(actor, countySlug, municipalitySlug) !== null),
    countySlug,
    municipalitySlug,
  )
