import { describe, expect, it } from "vitest"
import { parseAdminActorNestedRelations } from "@/lib/admin/actor-create-staging"

describe("parseAdminActorNestedRelations", () => {
  it("accepts staged repair rows with blank max price", () => {
    const result = parseAdminActorNestedRelations(
      "reparasjon",
      [
        {
          problemType: "screen",
          itemTypes: ["phone"],
          priceMin: "1299",
          priceMax: "",
          etaDays: "",
        },
      ],
      [
        {
          type: "website",
          title: "Offisiell nettside",
          url: "https://example.no",
          capturedAt: "2026-04-19",
          note: "",
        },
      ],
    )

    expect(result.repairServices).toEqual([
      {
        problemType: "screen",
        itemTypes: ["phone"],
        priceMin: 1299,
        priceMax: null,
        etaDays: null,
      },
    ])
  })

  it("rejects staged repair rows where max price is lower than fra price", () => {
    expect(() =>
      parseAdminActorNestedRelations(
        "reparasjon",
        [
          {
            problemType: "screen",
            itemTypes: ["phone"],
            priceMin: "1500",
            priceMax: "1200",
            etaDays: "",
          },
        ],
        [
          {
            type: "website",
            title: "Offisiell nettside",
            url: "https://example.no",
            capturedAt: "2026-04-19",
            note: "",
          },
        ],
      ),
    ).toThrow(/ugyldig pris/i)
  })
})
