import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const navigationSource = readFileSync(resolve(process.cwd(), 'components/navigation.tsx'), 'utf8')
const themeToggleSource = readFileSync(resolve(process.cwd(), 'components/theme-toggle.tsx'), 'utf8')

describe('header-attached menu layering', () => {
  it('elevates the desktop account menu above the sticky header and map overlays', () => {
    expect(navigationSource).toContain('HEADER_MENU_LAYER_CLASS')
    expect(navigationSource).toContain('<DropdownMenuContent align="end" className={cn("w-64", HEADER_MENU_LAYER_CLASS)}>')
  })

  it('elevates the theme toggle menu above the sticky header and map overlays', () => {
    expect(themeToggleSource).toContain('HEADER_MENU_LAYER_CLASS')
    expect(themeToggleSource).toContain('<DropdownMenuContent align="end" className={HEADER_MENU_LAYER_CLASS}>')
  })
})
