import type { ActorCategory } from "@/lib/data"
import type { ItemType, ProblemType } from "@/lib/prisma-enums"

export const itemTypeLabels: Record<ItemType, string> = {
  phone: "Telefon",
  laptop: "PC/Laptop",
  tablet: "Nettbrett",
  desktop: "Stasjonær PC",
  smartwatch: "Smartklokke",
  tv: "TV",
  monitor: "Skjerm/Monitor",
  printer: "Skriver",
  camera: "Kamera",
  gaming_console: "Spillkonsoll",
  audio: "Lydutstyr",
  small_appliance: "Småapparat",
  large_appliance: "Hvitevare",
  bicycle: "Sykkel",
  furniture: "Møbel",
  clothing: "Klær",
  footwear: "Sko",
  other: "Annet",
}

export const problemTypeLabels: Record<ProblemType, string> = {
  screen: "Skjerm",
  battery: "Batteri",
  slow: "Treg",
  no_power: "Starter ikke",
  water: "Vannskade",
  overheating: "Overoppheting",
  charging_port: "Ladeport",
  speaker: "Høyttaler",
  microphone: "Mikrofon",
  camera: "Kamera",
  keyboard: "Tastatur",
  trackpad: "Styreflate",
  storage: "Lagring/minne",
  software: "Programvare",
  connectivity: "Tilkobling",
  broken_part: "Ødelagt del",
  cosmetic: "Kosmetisk skade",
  noise: "Støy",
  leak: "Lekkasjer",
  motor: "Motor",
  zipper: "Glidelås",
  seam: "Søm",
  tear: "Rift/hull",
  stain: "Flekker",
  sole: "Såle",
  chain: "Kjede",
  brake: "Bremser",
  tire: "Dekk",
  wheel: "Hjul",
  other: "Annet",
}

export const categoryLabels: Record<ActorCategory, string> = {
  brukt: "Ombruk / second hand",
  reparasjon: "Reparasjon mobil/PC",
  gjenvinning: "Gjenvinning",
  utleie: "Utleie / utlån",
  reparasjon_sko_klar: "Reparasjon sko og klær",
  mottak_ombruk: "Mottak for ombruk",
  mobelreparasjon: "Møbelreparasjon",
  sykkelverksted: "Sykkelverksted",
  ombruksverksted: "Ombruksverksted",
  baerekraftig_mat: "Bærekraftig mat",
}

export const formatEnumLabel = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())

export const formatItemTypeLabel = (value: string) => itemTypeLabels[value as ItemType] ?? formatEnumLabel(value)

export const formatProblemTypeLabel = (value: string) =>
  problemTypeLabels[value as ProblemType] ?? formatEnumLabel(value)

export const formatCategoryLabel = (value: string) =>
  categoryLabels[value as ActorCategory] ?? formatEnumLabel(value)
