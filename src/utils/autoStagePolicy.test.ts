import { describe, expect, it } from 'vitest'
import { normalizeStagePaths, shouldAutoStage } from './autoStagePolicy'

describe('shouldAutoStage', () => {
  it('stages when enabled, desktop, edits, no engine commit', () => {
    expect(
      shouldAutoStage({
        enabled: true,
        engineCommitted: false,
        isTauri: true,
        workingDir: '/proj',
        editedFiles: ['a.ts'],
      })
    ).toBe(true)
  })

  it('skips when engine committed', () => {
    expect(
      shouldAutoStage({
        enabled: true,
        engineCommitted: true,
        isTauri: true,
        workingDir: '/proj',
        editedFiles: ['a.ts'],
      })
    ).toBe(false)
  })

  it('skips on web', () => {
    expect(
      shouldAutoStage({
        enabled: true,
        engineCommitted: false,
        isTauri: false,
        workingDir: '/proj',
        editedFiles: ['a.ts'],
      })
    ).toBe(false)
  })
})

describe('normalizeStagePaths', () => {
  it('dedupes and trims', () => {
    expect(normalizeStagePaths([' a.ts ', 'a.ts', '', 'b.ts'])).toEqual(['a.ts', 'b.ts'])
  })
})
