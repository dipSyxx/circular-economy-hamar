export const pilotCountySlugs = ["innlandet", "oslo", "akershus"] as const

export type PilotCountySlug = (typeof pilotCountySlugs)[number]

export const isPilotCounty = (countySlug?: string | null) => {
  if (!countySlug) return false
  return pilotCountySlugs.includes(countySlug as PilotCountySlug)
}

