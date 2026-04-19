import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const dialogSource = readFileSync(resolve(process.cwd(), 'components/ui/dialog.tsx'), 'utf8')
const publicActorDialogShellSource = readFileSync(
  resolve(process.cwd(), 'components/public-actor-dialog-shell.tsx'),
  'utf8',
)

describe('shared dialog implementation', () => {
  it('keeps dialog overlay and content on the shared modal layer above the page chrome', () => {
    expect(dialogSource).toContain('MODAL_LAYER_CLASS')
    expect(dialogSource).toContain('fixed inset-0 bg-black/50')
    expect(dialogSource).toContain('fixed top-[50%] left-[50%]')
    expect(dialogSource).toContain('max-h-[calc(100dvh-2rem)]')
  })

  it('uses a plain backdrop instead of Radix overlay scroll locking', () => {
    expect(dialogSource).not.toContain('DialogPrimitive.Overlay')
    expect(dialogSource).not.toContain("React.ComponentProps<typeof DialogPrimitive.Overlay>")
  })

  it('keeps the public actor dialog shell full-height within the modal viewport', () => {
    expect(publicActorDialogShellSource).toContain('h-dvh max-h-dvh')
    expect(publicActorDialogShellSource).toContain('sm:max-h-[calc(100dvh-2rem)]')
  })
})
