// This file is generated from prisma/schema.prisma.
// Do not edit manually. Run "pnpm generate:prisma-enums" to update.

export const ITEM_TYPES = [
  "phone",
  "laptop",
  "tablet",
  "desktop",
  "smartwatch",
  "tv",
  "monitor",
  "printer",
  "camera",
  "gaming_console",
  "audio",
  "small_appliance",
  "large_appliance",
  "bicycle",
  "furniture",
  "clothing",
  "footwear",
  "other",
] as const

export type ItemType = (typeof ITEM_TYPES)[number]

export const PROBLEM_TYPES = [
  "screen",
  "battery",
  "slow",
  "no_power",
  "water",
  "overheating",
  "charging_port",
  "speaker",
  "microphone",
  "camera",
  "keyboard",
  "trackpad",
  "storage",
  "software",
  "connectivity",
  "broken_part",
  "cosmetic",
  "noise",
  "leak",
  "motor",
  "zipper",
  "seam",
  "tear",
  "stain",
  "sole",
  "chain",
  "brake",
  "tire",
  "wheel",
  "other",
] as const

export type ProblemType = (typeof PROBLEM_TYPES)[number]
