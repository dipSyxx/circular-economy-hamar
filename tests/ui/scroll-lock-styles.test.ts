import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const globalsCss = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')

describe('scroll lock global styles', () => {
  it('keeps stable scrollbar gutter on the root document', () => {
    expect(globalsCss).toContain('scrollbar-gutter: stable')
  })

  it('neutralizes body margin compensation from react-remove-scroll', () => {
    expect(globalsCss).toContain('html body[data-scroll-locked][data-scroll-locked]')
    expect(globalsCss).toContain('margin-right: 0 !important;')
    expect(globalsCss).toContain('padding-right: 0 !important;')
  })
})
