import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const selectSource = readFileSync(resolve(process.cwd(), 'components/ui/select.tsx'), 'utf8')

describe('shared select implementation', () => {
  it('does not depend on radix react-select modal behavior', () => {
    expect(selectSource).not.toContain('@radix-ui/react-select')
    expect(selectSource).not.toContain('SelectPrimitive')
  })
})
