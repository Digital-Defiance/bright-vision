import { readStorageItem } from '../storageKeys'

export const EDITOR_PREFS_STORAGE_KEY = 'bright-vision-editor-prefs'

export interface EditorPrefs {
  explorerOpen: boolean
  /** @deprecated kept for migration; explorer uses fixed width now */
  explorerSizePct?: number
}

export const DEFAULT_EDITOR_PREFS: EditorPrefs = {
  explorerOpen: true,
}

/** Fixed explorer column — percentage splits were collapsing to icon-only width. */
export const EXPLORER_WIDTH_PX = 300

export function loadEditorPrefs(): EditorPrefs {
  try {
    const raw = readStorageItem(EDITOR_PREFS_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_EDITOR_PREFS }
    const parsed = JSON.parse(raw) as Partial<EditorPrefs>
    return {
      explorerOpen: parsed.explorerOpen ?? DEFAULT_EDITOR_PREFS.explorerOpen,
    }
  } catch {
    return { ...DEFAULT_EDITOR_PREFS }
  }
}

export function saveEditorPrefs(prefs: EditorPrefs): void {
  localStorage.setItem(EDITOR_PREFS_STORAGE_KEY, JSON.stringify(prefs))
}
