import { describe, expect, it } from "vitest"
import {
  formatRepairServicePriceLabel,
  isRepairServiceGuaranteedWithinBudget,
  isRepairServiceStartingPriceWithinBudget,
} from "@/lib/repair-price-format"

describe("repair price formatting", () => {
  it("formats explicit price ranges", () => {
    expect(formatRepairServicePriceLabel({ priceMin: 900, priceMax: 1800 })).toBe("900-1800 kr")
  })

  it("formats missing max price as fra", () => {
    expect(formatRepairServicePriceLabel({ priceMin: 1299, priceMax: null })).toBe("fra 1299 kr")
  })

  it("treats only known max price as guaranteed budget fit", () => {
    expect(isRepairServiceGuaranteedWithinBudget({ priceMin: 900, priceMax: 1800 }, 1800)).toBe(true)
    expect(isRepairServiceGuaranteedWithinBudget({ priceMin: 1299, priceMax: null }, 1800)).toBe(false)
  })

  it("allows fra prices to count as starting-price budget fit", () => {
    expect(isRepairServiceStartingPriceWithinBudget({ priceMin: 1299, priceMax: null }, 1800)).toBe(true)
    expect(isRepairServiceStartingPriceWithinBudget({ priceMin: 2000, priceMax: null }, 1800)).toBe(false)
  })
})
