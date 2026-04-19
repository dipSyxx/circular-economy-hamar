import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const packageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'),
) as {
  dependencies?: Record<string, string>
}

describe('map query runtime dependencies', () => {
  it('ships supercluster as a production dependency', () => {
    expect(packageJson.dependencies?.supercluster).toBeTypeOf('string')
  })
})
