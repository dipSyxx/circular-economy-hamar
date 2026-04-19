import { describe, expect, it } from 'vitest'
import { buildMarkerIconHtml, getActorMarkerVisualStyle } from '@/lib/actors/map-marker-icon'

describe('buildMarkerIconHtml', () => {
  it('adds a favorite badge when actor is favorited', () => {
    const html = buildMarkerIconHtml({
      color: '#22c55e',
      iconSvg: '<svg data-category-icon />',
      size: 30,
      borderWidth: 2,
      shadow: '0 2px 6px rgba(0,0,0,0.3)',
      isFavorite: true,
      favoriteSvg: '<svg data-heart-icon />',
    })

    expect(html).toContain('data-favorite-badge')
    expect(html).toContain('data-heart-icon')
  })

  it('omits favorite badge when actor is not favorited', () => {
    const html = buildMarkerIconHtml({
      color: '#22c55e',
      iconSvg: '<svg data-category-icon />',
      size: 30,
      borderWidth: 2,
      shadow: '0 2px 6px rgba(0,0,0,0.3)',
      isFavorite: false,
      favoriteSvg: '<svg data-heart-icon />',
    })

    expect(html).not.toContain('data-favorite-badge')
    expect(html).not.toContain('data-heart-icon')
  })
})

describe('getActorMarkerVisualStyle', () => {
  it('keeps the same base marker size when selected', () => {
    const regular = getActorMarkerVisualStyle(false, '#22c55e')
    const selected = getActorMarkerVisualStyle(true, '#22c55e')

    expect(selected.size).toBe(regular.size)
    expect(selected.borderWidth).toBe(regular.borderWidth)
    expect(selected.shadow).toBe(regular.shadow)
  })
})
