import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const actorsExplorerSource = readFileSync(resolve(process.cwd(), 'components/actors-explorer.tsx'), 'utf8')

describe('actors explorer layout', () => {
  it('keeps the desktop sidebar height scoped to its content and sticky', () => {
    expect(actorsExplorerSource).toContain('grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start')
    expect(actorsExplorerSource).toContain(
      'space-y-4 rounded-2xl border border-border/60 bg-card/40 p-4 lg:sticky lg:top-20 lg:self-start',
    )
  })
})
