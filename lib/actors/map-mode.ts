export const getMapResponseMode = (zoom: number | null | undefined) =>
  Math.max(0, Math.floor(zoom ?? 0)) <= 10 ? "clusters" : "points"
