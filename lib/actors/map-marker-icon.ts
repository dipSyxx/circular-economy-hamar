type BuildMarkerIconHtmlOptions = {
  color: string
  iconSvg: string
  size: number
  borderWidth: number
  shadow: string
  isFavorite?: boolean
  favoriteSvg?: string
}

type ActorMarkerVisualStyle = {
  size: number
  borderWidth: number
  shadow: string
}

const BASE_MARKER_VISUAL_STYLE: ActorMarkerVisualStyle = {
  size: 30,
  borderWidth: 2,
  shadow: '0 2px 6px rgba(0,0,0,0.3)',
}

export function getActorMarkerVisualStyle(_isSelected: boolean, _color: string): ActorMarkerVisualStyle {
  return BASE_MARKER_VISUAL_STYLE
}

export function buildMarkerIconHtml({
  color,
  iconSvg,
  size,
  borderWidth,
  shadow,
  isFavorite = false,
  favoriteSvg,
}: BuildMarkerIconHtmlOptions) {
  const badgeSize = Math.max(14, Math.round(size * 0.46))
  const badgeOffset = Math.max(1, Math.round(size * 0.06))
  const badgeMarkup =
    isFavorite && favoriteSvg
      ? `<span data-favorite-badge style="position:absolute;top:-${badgeOffset}px;right:-${badgeOffset}px;width:${badgeSize}px;height:${badgeSize}px;border-radius:9999px;background:#fff;border:1.5px solid rgba(255,255,255,0.95);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.2);">${favoriteSvg}</span>`
      : ''

  return `<div style="position:relative;width:${size}px;height:${size}px;"><div style="background-color:${color};width:${size}px;height:${size}px;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:${borderWidth}px solid #fff;box-shadow:${shadow};">${iconSvg}</div>${badgeMarkup}</div>`
}
