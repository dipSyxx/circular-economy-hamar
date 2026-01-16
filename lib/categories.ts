import {
  Armchair,
  Bike,
  Hammer,
  Inbox,
  KeyRound,
  Laptop,
  Leaf,
  Recycle,
  Scissors,
  ShoppingBag,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ActorCategory } from "@/lib/data"

export const categoryOrder: ActorCategory[] = [
  "brukt",
  "utleie",
  "reparasjon",
  "reparasjon_sko_klar",
  "mobelreparasjon",
  "sykkelverksted",
  "ombruksverksted",
  "mottak_ombruk",
  "baerekraftig_mat",
  "gjenvinning",
]

export const categoryConfig: Record<ActorCategory, { color: string; icon: LucideIcon }> = {
  brukt: {
    color: "#22c55e",
    icon: ShoppingBag,
  },
  utleie: {
    color: "#8b5cf6",
    icon: KeyRound,
  },
  reparasjon: {
    color: "#f59e0b",
    icon: Laptop,
  },
  reparasjon_sko_klar: {
    color: "#ec4899",
    icon: Scissors,
  },
  mobelreparasjon: {
    color: "#a16207",
    icon: Armchair,
  },
  sykkelverksted: {
    color: "#06b6d4",
    icon: Bike,
  },
  ombruksverksted: {
    color: "#14b8a6",
    icon: Hammer,
  },
  mottak_ombruk: {
    color: "#0ea5e9",
    icon: Inbox,
  },
  baerekraftig_mat: {
    color: "#65a30d",
    icon: Leaf,
  },
  gjenvinning: {
    color: "#3b82f6",
    icon: Recycle,
  },
}
