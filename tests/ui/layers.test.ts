import { describe, expect, it } from 'vitest'
import {
  FLOATING_LAYER,
  HEADER_MENU_LAYER,
  HEADER_LAYER,
  MODAL_LAYER,
} from '@/lib/ui/layers'

describe('ui layer scale', () => {
  it('keeps the sticky header above dropdown-style floating content', () => {
    expect(HEADER_LAYER).toBeGreaterThan(FLOATING_LAYER)
  })

  it('keeps modal surfaces above the sticky header', () => {
    expect(MODAL_LAYER).toBeGreaterThan(HEADER_LAYER)
  })

  it('keeps header-attached menus above the sticky header but below modals', () => {
    expect(HEADER_MENU_LAYER).toBeGreaterThan(HEADER_LAYER)
    expect(MODAL_LAYER).toBeGreaterThan(HEADER_MENU_LAYER)
  })

  it('keeps modal surfaces above high-z map overlays', () => {
    expect(MODAL_LAYER).toBeGreaterThan(1001)
  })

  it('keeps header-attached menus above high-z map overlays', () => {
    expect(HEADER_MENU_LAYER).toBeGreaterThan(1001)
  })
})
