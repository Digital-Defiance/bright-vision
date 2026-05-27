import { describe, expect, it } from 'vitest'
import { DEFAULT_EDITOR_PREFS, EXPLORER_WIDTH_PX, loadEditorPrefs } from './editorPrefs'

describe('editorPrefs', () => {
  it('defaults explorer open', () => {
    expect(DEFAULT_EDITOR_PREFS.explorerOpen).toBe(true)
  })

  it('uses fixed explorer width', () => {
    expect(EXPLORER_WIDTH_PX).toBeGreaterThanOrEqual(280)
  })

  it('loadEditorPrefs returns defaults when storage empty', () => {
    expect(loadEditorPrefs()).toEqual(DEFAULT_EDITOR_PREFS)
  })
})
