import OpeningHours from "opening_hours"

export type OpeningState = "open" | "closed" | "unknown"

export interface OpeningStatus {
  state: OpeningState
  nextChange?: Date
}

export const getOpeningStatus = (openingHoursOsm?: string, now = new Date()): OpeningStatus => {
  if (!openingHoursOsm) {
    return { state: "unknown" }
  }

  try {
    const hours = new OpeningHours(openingHoursOsm)
    const isOpen = hours.getState(now)
    const nextChange = hours.getNextChange(now)
    return {
      state: isOpen ? "open" : "closed",
      nextChange: nextChange instanceof Date ? nextChange : undefined,
    }
  } catch {
    return { state: "unknown" }
  }
}

export const formatTime = (date: Date, locale = "nb-NO") =>
  new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date)
