import { describe, expect, it } from "vitest"
import { validateActorSubmission } from "@/lib/actor-submissions"

const validPayload = {
  actor: {
    name: "PhoneFix Hamar",
    slug: "phonefix-hamar",
    category: "reparasjon",
    description: "Kort beskrivelse",
    longDescription: "Lang beskrivelse",
    address: "Storgata 1",
    postalCode: "2317",
    county: "Innlandet",
    municipality: "Hamar",
    lat: 60.7945,
    lng: 11.068,
    openingHours: ["Man-fre 10:00-18:00"],
    tags: ["reparasjon"],
    benefits: ["Forlenger levetiden"],
    howToUse: ["Beskriv feilen"],
    nationwide: false,
  },
  sources: [
    {
      type: "website",
      title: "Offisiell nettside",
      url: "https://example.no",
      capturedAt: "2026-04-19",
      note: "Primarkilde",
    },
  ],
}

describe("validateActorSubmission", () => {
  it("accepts repair services with fra pricing", () => {
    const result = validateActorSubmission({
      ...validPayload,
      repairServices: [
        {
          problemType: "screen",
          itemTypes: ["phone"],
          priceMin: "1299",
          priceMax: "",
          etaDays: "",
        },
      ],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.repairServices).toEqual([
      {
        problemType: "screen",
        itemTypes: ["phone"],
        priceMin: 1299,
        priceMax: null,
        etaDays: null,
      },
    ])
  })

  it("rejects max price lower than fra price", () => {
    expect(() =>
      validateActorSubmission({
        ...validPayload,
        repairServices: [
          {
            problemType: "screen",
            itemTypes: ["phone"],
            priceMin: "1500",
            priceMax: "1200",
            etaDays: "",
          },
        ],
      }),
    ).toThrow(/ugyldig pris/i)
  })
})
