type RepairPriceLike = {
  priceMin: number
  priceMax: number | null
}

export function formatRepairServicePriceLabel(service: RepairPriceLike) {
  return service.priceMax === null ? `fra ${service.priceMin} kr` : `${service.priceMin}-${service.priceMax} kr`
}

export function isRepairServiceGuaranteedWithinBudget(service: RepairPriceLike, budget: number) {
  return service.priceMax !== null && service.priceMax <= budget
}

export function isRepairServiceStartingPriceWithinBudget(service: RepairPriceLike, budget: number) {
  return service.priceMin <= budget
}
