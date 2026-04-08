export type ActorFormSection = {
  title: string
  keys: string[]
  layout?: "stack"
}

export const ACTOR_FORM_SECTIONS: ActorFormSection[] = [
  {
    title: "Grunninfo",
    keys: ["name", "slug", "category", "description", "longDescription"],
  },
  {
    title: "Kontakt og plassering",
    keys: [
      "address",
      "postalCode",
      "county",
      "municipality",
      "city",
      "area",
      "lat",
      "lng",
      "phone",
      "email",
      "website",
      "instagram",
      "nationwide",
    ],
  },
  {
    title: "Bilde",
    keys: ["image"],
    layout: "stack",
  },
  {
    title: "Detaljer og innhold",
    keys: ["openingHours", "openingHoursOsm", "tags", "benefits", "howToUse"],
  },
  {
    title: "Administrasjon",
    keys: ["status", "reviewNote", "createdById", "reviewedById", "reviewedAt"],
  },
  {
    title: "System",
    keys: ["id", "createdAt", "updatedAt"],
  },
]
